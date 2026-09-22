import { useCallback, useEffect, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { SCAN_VIEW_IDS, type ScanView } from '../../../api'
import { Card, PillButton } from '../../../components/ui/primitives'
import { AppIcon } from '../../../components/ui/icons'
import { useToast } from '../../../components/ui/Toast'
import { ImageError, captureVideoFrame } from './imageUtils'
import { HeightField, isHeightValid } from './HeightField'
import { POSITIONING_TIPS, VIEW_INFO } from './scanViews'
import { StanceGuide } from './StanceGuide'
import { useCamera, type CameraStatus } from './useCamera'
import { detectPose, loadPoseLandmarker } from './poseGuide'
import { StillnessTracker, evaluatePose, type Guidance, type Landmark } from './poseMath'
import type { PhotoSet } from './usePhotoSet'

type Phase = 'intro' | 'capture' | 'summary'
type Detector = 'idle' | 'loading' | 'ready' | 'unavailable'
interface Pending {
  view: ScanView
  blob: Blob
  url: string
  note?: string
}

const TIMER_SECONDS = 5
const COOLDOWN_MS = 1500
const DARK_LUMA = 45

const BONES: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28],
]

const PROBLEMS: Partial<Record<CameraStatus, { title: string; body: string; hint?: string }>> = {
  denied: {
    title: 'Camera access is blocked',
    body: 'Morphofit needs your camera to guide the scan. Nothing is recorded or uploaded until you confirm your four photos.',
    hint: 'Tap the lock or camera icon in your browser\'s address bar, set Camera to Allow, then try again. On iPhone: Settings > Safari > Camera.',
  },
  unavailable: {
    title: 'No camera found',
    body: "This device doesn't seem to have a camera we can use.",
    hint: 'Plug in or enable a camera and try again, or use Photo Body Scan and upload four photos instead.',
  },
  'in-use': {
    title: 'The camera is busy',
    body: 'Another app or browser tab is using your camera, or your device blocked it.',
    hint: 'Close other apps or tabs that use the camera (video calls, other browsers) and try again.',
  },
  insecure: {
    title: 'Live scan needs a secure connection',
    body: "Browsers only allow camera access on secure (https) pages, and this page isn't one.",
    hint: 'Open Morphofit over https, or use Photo Body Scan, which works on any connection.',
  },
  unsupported: {
    title: "This browser can't open the camera",
    body: 'Your browser is too old to support live camera access.',
    hint: 'Try a recent version of Chrome, Edge, Safari or Firefox, or use Photo Body Scan.',
  },
  lost: {
    title: 'The camera stopped',
    body: 'The camera was disconnected or taken over by another app.',
    hint: 'Your captured photos are kept. Reconnect the camera and try again.',
  },
  error: {
    title: "Couldn't start the camera",
    body: 'Something unexpected went wrong while opening the camera.',
    hint: 'Try again, or use Photo Body Scan instead.',
  },
}

function CameraProblem({ status, onRetry, onUsePhoto, onClose }: { status: CameraStatus; onRetry: () => void; onUsePhoto: () => void; onClose: () => void }) {
  const p = PROBLEMS[status] ?? PROBLEMS.error!
  return (
    <div data-testid="camera-problem" data-status={status} className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-neutral-900 p-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
          <AppIcon name="alert" size={22} />
        </span>
        <h3 className="text-lg font-bold font-display text-white">{p.title}</h3>
        <p className="mt-2 text-sm font-body leading-relaxed text-white/75">{p.body}</p>
        {p.hint && <p className="mt-2 text-xs font-body leading-relaxed text-white/55">{p.hint}</p>}
        <div className="mt-5 flex flex-col gap-2.5">
          {status !== 'insecure' && status !== 'unsupported' && (
            <PillButton variant="primary" icon="refresh" onClick={onRetry}>
              Try again
            </PillButton>
          )}
          <PillButton variant="secondary" icon="upload" onClick={onUsePhoto}>
            Use Photo Body Scan instead
          </PillButton>
          <button type="button" onClick={onClose} className="text-xs font-semibold font-body text-white/60 hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function LiveScanFlow({
  photos,
  missing,
  onSetPhoto,
  heightCm,
  onHeightChange,
  onAnalyze,
  onBack,
  onUsePhoto,
}: {
  photos: PhotoSet
  missing: ScanView[]
  onSetPhoto: (view: ScanView, blob: Blob) => void
  heightCm: number
  onHeightChange: (h: number) => void
  onAnalyze: () => void
  onBack: () => void
  onUsePhoto: () => void
}) {
  const { show } = useToast()
  const cam = useCamera()
  const [phase, setPhase] = useState<Phase>(() => (missing.length === 0 ? 'summary' : 'intro'))
  const [queue, setQueue] = useState<ScanView[]>([])
  const [pending, setPending] = useState<Pending | null>(null)
  const [detector, setDetector] = useState<Detector>('idle')
  const [guidance, setGuidance] = useState<Guidance | null>(null)
  const [progress, setProgress] = useState(0)
  const [pose, setPose] = useState<{ pts: Landmark[]; vw: number; vh: number } | null>(null)
  const [dark, setDark] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const capturingRef = useRef(false)
  const lastGuidance = useRef<Guidance | null>(null)
  const cooldownUntil = useRef(0)
  const captureRef = useRef<(kind: 'auto' | 'manual' | 'timer') => void>(() => {})

  const target = queue[0]
  const mirrored = cam.facing === 'user'
  const heightValid = isHeightValid(heightCm)
  const cameraFailed = ['denied', 'unavailable', 'in-use', 'insecure', 'unsupported', 'lost', 'error'].includes(cam.status)

  // The camera lives exactly as long as the capture screen: opened when it
  // appears, always released when it goes away (summary, exit, unmount).
  useEffect(() => {
    if (phase !== 'capture') return
    cam.start('user')
    return () => cam.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Load the on-device guidance model while the camera starts. If it can't
  // load (offline, blocked CDN, old device) the scan still works manually.
  useEffect(() => {
    if (phase !== 'capture') return
    if (landmarkerRef.current) {
      setDetector('ready')
      return
    }
    let alive = true
    setDetector('loading')
    loadPoseLandmarker()
      .then((lm) => {
        landmarkerRef.current = lm
        if (alive) setDetector('ready')
      })
      .catch(() => {
        if (alive) setDetector('unavailable')
      })
    return () => {
      alive = false
    }
  }, [phase])

  // Lock page scroll behind the full-screen camera and let Escape leave it.
  useEffect(() => {
    if (phase !== 'capture') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCapture()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, missing.length])

  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.url)
    }
  }, [pending])

  const closeCapture = useCallback(() => {
    setCountdown(null)
    setPending(null)
    setGuidance(null)
    setPose(null)
    setPhase(missing.length === 0 ? 'summary' : 'intro')
  }, [missing.length])

  const startCapture = (views: ScanView[]) => {
    setQueue(views)
    setPending(null)
    setGuidance(null)
    setProgress(0)
    setCountdown(null)
    cooldownUntil.current = performance.now() + COOLDOWN_MS
    setPhase('capture')
  }

  const capture = useCallback(
    async (kind: 'auto' | 'manual' | 'timer') => {
      const video = cam.videoRef.current
      const view = queue[0]
      if (!video || !view || capturingRef.current || pending) return
      capturingRef.current = true
      try {
        const blob = await captureVideoFrame(video)
        const g = lastGuidance.current
        // A hand-triggered shot can be a poor one; say so, but let them decide.
        const note = kind !== 'auto' && detector === 'ready' && g && !g.ok ? `Our guide noticed: ${g.message}. You can retake for a better result.` : undefined
        setCountdown(null)
        setFlash(true)
        setTimeout(() => setFlash(false), 180)
        setPending({ view, blob, url: URL.createObjectURL(blob), note })
      } catch (err) {
        show({ title: "Couldn't capture that photo", description: err instanceof ImageError ? err.message : 'Please try again.', tone: 'error' })
      } finally {
        capturingRef.current = false
      }
    },
    [cam.videoRef, queue, pending, detector, show]
  )
  captureRef.current = capture

  // Real-time guidance: ~10 detections a second on the live frame, entirely on
  // this device. The frame is only auto-captured after the pose has been valid
  // for the requested angle AND steady for a moment.
  useEffect(() => {
    if (phase !== 'capture' || pending || cam.status !== 'live' || detector !== 'ready' || !target) return
    const video = cam.videoRef.current
    const landmarker = landmarkerRef.current
    if (!video || !landmarker) return
    const tracker = new StillnessTracker()
    const probe = document.createElement('canvas')
    probe.width = 24
    probe.height = 32
    const probeCtx = probe.getContext('2d', { willReadFrequently: true })
    let raf = 0
    let stopped = false
    let last = 0
    let ticks = 0
    let failures = 0

    const tick = (now: number) => {
      if (stopped) return
      raf = requestAnimationFrame(tick)
      if (now - last < 100 || video.readyState < 2 || !video.videoWidth) return
      last = now
      ticks++
      try {
        if (probeCtx && ticks % 10 === 1) {
          probeCtx.drawImage(video, 0, 0, probe.width, probe.height)
          const data = probeCtx.getImageData(0, 0, probe.width, probe.height).data
          let sum = 0
          for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
          setDark(sum / (data.length / 4) < DARK_LUMA)
        }
        const pts = detectPose(landmarker, video, now)
        failures = 0
        const g = evaluatePose(pts, target, mirrored)
        lastGuidance.current = g
        setGuidance((prev) => (prev && prev.code === g.code && prev.message === g.message ? prev : g))
        setPose(pts ? { pts, vw: video.videoWidth, vh: video.videoHeight } : null)
        const cooling = now < cooldownUntil.current
        const p = cooling ? 0 : tracker.update(now, pts, g.ok)
        setProgress(p)
        if (p >= 1 && !capturingRef.current) {
          tracker.reset()
          captureRef.current('auto')
        }
      } catch {
        // A run of consecutive failures means the model is unusable here:
        // fall back to manual capture instead of a silently dead screen.
        if (++failures > 8) setDetector('unavailable')
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      setProgress(0)
    }
  }, [phase, pending, cam.status, cam.videoRef, detector, target, mirrored])

  // Self-timer for people who prop the phone up and walk into the frame.
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      captureRef.current('timer')
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const confirmPending = () => {
    if (!pending) return
    onSetPhoto(pending.view, pending.blob)
    const rest = queue.filter((v) => v !== pending.view)
    setPending(null)
    setQueue(rest)
    setGuidance(null)
    cooldownUntil.current = performance.now() + COOLDOWN_MS
    if (rest.length === 0) setPhase('summary')
  }

  const retakePending = () => {
    setPending(null)
    cooldownUntil.current = performance.now() + COOLDOWN_MS
  }

  const flip = () => {
    setCountdown(null)
    setPose(null)
    cam.flip()
  }

  /* ------------------------------ intro ------------------------------ */
  if (phase === 'intro') {
    const some = SCAN_VIEW_IDS.length - missing.length
    return (
      <div className="space-y-6" data-testid="live-intro">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold font-body text-ink-muted hover:text-ink">
          <AppIcon name="chevronLeft" size={14} /> Change method
        </button>
        <Card className="p-6" style={{ background: 'var(--gradient-mesh)' }}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-md">
              <AppIcon name="camera" size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold font-display text-ink">How the live scan works</h3>
              <p className="mt-1 max-w-2xl text-xs font-body leading-relaxed text-ink-muted">
                Prop your phone upright and step back. The camera tracks your pose on this device and tells you how to stand for each of four angles: front, back, left side, right side. It captures each one automatically when you are in position and still, and you confirm every photo before anything is sent.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {POSITIONING_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 text-xs font-body leading-relaxed text-ink-muted">
                <AppIcon name="check" size={13} className="mt-0.5 flex-shrink-0 text-forest" />
                {tip}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <HeightField value={heightCm} onChange={onHeightChange} />
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {some > 0 && <p className="text-[11px] font-body text-ink-muted">{some} of 4 photos already captured. Continuing with the rest.</p>}
              <PillButton variant="primary" size="lg" icon="camera" onClick={() => startCapture(missing)} disabled={!heightValid} testId="live-start">
                {some > 0 ? 'Continue live scan' : 'Start live scan'}
              </PillButton>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  /* ----------------------------- summary ----------------------------- */
  if (phase === 'summary') {
    return (
      <div className="space-y-6" data-testid="live-summary">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold font-body text-ink-muted hover:text-ink">
          <AppIcon name="chevronLeft" size={14} /> Change method
        </button>
        <Card className="p-5">
          <h3 className="text-sm font-bold font-display text-ink">Review your four photos</h3>
          <p className="mt-1 text-xs font-body text-ink-muted">Retake any that don't look right, then continue.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SCAN_VIEW_IDS.map((v) => (
              <div key={v} data-testid={`summary-${v}`} className="overflow-hidden rounded-2xl border border-parchment-dark bg-parchment">
                <div className="aspect-[3/4] w-full bg-parchment-dark/40">
                  {photos[v] ? (
                    <img src={photos[v]!.url} alt={`${VIEW_INFO[v].label} photo`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-forest">
                      <StanceGuide view={v} className="h-full w-auto" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                  <span className="text-xs font-bold font-display text-ink">{VIEW_INFO[v].label}</span>
                  <button type="button" onClick={() => startCapture([v])} className="text-[11px] font-semibold font-body text-forest hover:underline">
                    {photos[v] ? 'Retake' : 'Capture'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <HeightField value={heightCm} onChange={onHeightChange} />
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {missing.length > 0 && (
                <p className="text-[11px] font-body text-ink-muted">
                  Still needed: <span className="font-semibold text-ink">{missing.map((v) => VIEW_INFO[v].label).join(', ')}</span>
                </p>
              )}
              <PillButton variant="primary" size="lg" icon="sparkles" onClick={onAnalyze} disabled={missing.length > 0 || !heightValid} testId="live-analyze">
                Analyse my photos
              </PillButton>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  /* ----------------------------- capture ----------------------------- */
  const doneCount = SCAN_VIEW_IDS.filter((v) => photos[v] && v !== target).length
  const ready = guidance?.ok
  const message = dark
    ? 'It looks dark here. Turn on a light or face a window'
    : cam.status === 'requesting'
      ? 'Allow camera access when your browser asks'
      : detector === 'ready'
        ? (guidance?.message ?? 'Step into the frame')
        : detector === 'loading'
          ? 'Loading the on-device guide...'
          : (target ? VIEW_INFO[target].live : '')
  const ringColor = ready ? '#34d399' : 'rgba(255,255,255,0.35)'
  const C = 2 * Math.PI * 22

  return (
    <div className="fixed inset-0 z-[900] bg-black text-white" role="dialog" aria-label="Live body scan" data-testid="live-overlay">
      <div className="relative mx-auto h-full w-full max-w-[600px] overflow-hidden bg-black">
        <video
          ref={cam.videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
          data-testid="live-video"
        />

        {/* Stance outline for the angle being captured (flipped with the mirrored preview so it matches what you see). */}
        {target && cam.status === 'live' && (
          <div className={`pointer-events-none absolute inset-0 flex items-center justify-center px-12 py-24 ${mirrored ? 'scale-x-[-1]' : ''}`}>
            <StanceGuide view={target} overlay className="h-full w-auto opacity-70" />
          </div>
        )}

        {/* Tracked skeleton: the same coordinate space as the video so object-cover maps exactly. */}
        {pose && cam.status === 'live' && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${pose.vw} ${pose.vh}`}
            preserveAspectRatio="xMidYMid slice"
            style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
            aria-hidden
          >
            {BONES.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={pose.pts[a].x * pose.vw} y1={pose.pts[a].y * pose.vh} x2={pose.pts[b].x * pose.vw} y2={pose.pts[b].y * pose.vh} stroke={ready ? '#34d399' : '#fbbf24'} strokeWidth={Math.max(2, pose.vw / 220)} strokeLinecap="round" opacity={0.85} />
            ))}
          </svg>
        )}

        {flash && <div className="pointer-events-none absolute inset-0 z-20 bg-white/80" />}

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={closeCapture} aria-label="Close live scan" data-testid="live-close" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70">
              <AppIcon name="close" size={18} />
            </button>
            <div className="flex items-center gap-1.5" data-testid="live-steps">
              {SCAN_VIEW_IDS.map((v) => {
                const done = !!photos[v] && v !== target
                const current = v === target
                return (
                  <span key={v} className={`rounded-full px-2.5 py-1 text-[10px] font-bold font-data uppercase tracking-wide ${current ? 'bg-white text-black' : done ? 'bg-emerald-500/90 text-white' : 'bg-white/15 text-white/70'}`}>
                    {done ? '✓ ' : ''}{VIEW_INFO[v].label.replace(' side', '')}
                  </span>
                )
              })}
            </div>
            <button type="button" onClick={flip} aria-label="Switch camera" data-testid="live-flip" disabled={cam.status === 'requesting'} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70 disabled:opacity-40">
              <AppIcon name="refresh" size={18} />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] font-data uppercase tracking-widest text-white/60" data-testid="live-detector">
            {detector === 'ready' ? 'Auto-capture on' : detector === 'loading' ? 'Loading guide' : detector === 'unavailable' ? 'Manual mode: use the shutter or timer' : ''}
            {doneCount > 0 ? ` · ${doneCount} of 4 done` : ''}
          </p>
        </div>

        {/* Guidance + controls */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-16">
          {target && (
            <p className="mb-1 text-center text-[11px] font-data font-semibold uppercase tracking-widest text-white/70">
              {VIEW_INFO[target].label} view
            </p>
          )}
          <p
            data-testid="live-guidance"
            data-code={guidance?.code ?? ''}
            aria-live="polite"
            className={`mx-auto mb-4 max-w-sm rounded-2xl px-4 py-2.5 text-center text-sm font-semibold font-body backdrop-blur ${ready ? 'bg-emerald-500/85 text-white' : 'bg-black/55 text-white'}`}
          >
            {message}
          </p>
          <div className="mb-2 flex items-center justify-center gap-6">
            <button type="button" onClick={() => setCountdown(countdown === null ? TIMER_SECONDS : null)} data-testid="live-timer" disabled={cam.status !== 'live'} className="w-20 text-center text-[11px] font-semibold font-body text-white/80 hover:text-white disabled:opacity-40">
              {countdown === null ? `${TIMER_SECONDS}s timer` : 'Cancel timer'}
            </button>
            <button type="button" onClick={() => captureRef.current('manual')} disabled={cam.status !== 'live' || !!pending} aria-label="Capture photo now" data-testid="live-shutter" className="relative flex h-[72px] w-[72px] items-center justify-center disabled:opacity-40">
              <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="24" cy="24" r="22" fill="none" stroke={ringColor} strokeWidth="2.5" />
                <circle cx="24" cy="24" r="22" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
              </svg>
              <span className={`h-[54px] w-[54px] rounded-full ${ready ? 'bg-emerald-400' : 'bg-white'} transition-colors`} />
            </button>
            <span className="w-20" />
          </div>
        </div>

        {countdown !== null && countdown > 0 && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" data-testid="live-countdown">
            <span className="text-8xl font-bold font-display text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">{countdown}</span>
          </div>
        )}

        {cam.status === 'requesting' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-8 text-center">
            <div>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin-smooth rounded-full border-2 border-white border-t-transparent" />
              <p className="text-sm font-body text-white/80">Waiting for camera access. Please allow it when your browser asks.</p>
            </div>
          </div>
        )}

        {cameraFailed && (
          <CameraProblem
            status={cam.status}
            onRetry={() => cam.start(cam.facing)}
            onUsePhoto={() => {
              cam.stop()
              onUsePhoto()
            }}
            onClose={closeCapture}
          />
        )}

        {pending && (
          <div data-testid="live-review" className="absolute inset-0 z-30 flex flex-col bg-black">
            <div className="flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)]">
              <span className="text-sm font-bold font-display">{VIEW_INFO[pending.view].label} photo</span>
              <span className="text-[11px] font-data uppercase tracking-widest text-white/60">Check it</span>
            </div>
            <div className="min-h-0 flex-1 px-4">
              <img src={pending.url} alt={`${VIEW_INFO[pending.view].label} capture`} className="mx-auto h-full max-h-full w-auto max-w-full rounded-2xl object-contain" />
            </div>
            <div className="space-y-3 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
              <p className="text-center text-[11px] font-body text-white/60">Is your whole body in view, and are you standing the way the outline shows?</p>
              {pending.note && <p className="rounded-xl bg-amber-500/20 px-3 py-2 text-center text-xs font-body text-amber-200">{pending.note}</p>}
              <div className="grid grid-cols-2 gap-3">
                <PillButton variant="secondary" icon="refresh" onClick={retakePending} testId="live-retake">
                  Retake
                </PillButton>
                <PillButton variant="primary" icon="check" onClick={confirmPending} testId="live-use">
                  Use photo
                </PillButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveScanFlow
