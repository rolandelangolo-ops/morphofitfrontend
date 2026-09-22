import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiRequestError, SCAN_VIEW_IDS, type ScanAnalysis, type ScanMethod, type ScanView } from '../../../api'
import { Card, PillButton } from '../../../components/ui/primitives'
import { AppIcon } from '../../../components/ui/icons'
import { VIEW_INFO } from './scanViews'
import type { PhotoSet } from './usePhotoSet'

type Phase = 'uploading' | 'analyzing'
type Failure =
  | { kind: 'views'; views: { view: ScanView; issue: string }[] }
  | { kind: 'blocked'; message: string }
  | { kind: 'limit'; message: string }
  | { kind: 'service'; message: string }

function classify(err: unknown): Failure | 'expired' | 'aborted' {
  if (err instanceof DOMException && err.name === 'AbortError') return 'aborted'
  if (err instanceof ApiRequestError) {
    const details = err.details as { code?: string; views?: { view: ScanView; issue: string }[] } | undefined
    if (err.status === 422 && details?.code === 'VIEW_REJECTED' && details.views?.length) return { kind: 'views', views: details.views }
    if (err.status === 422) return { kind: 'blocked', message: err.message }
    if (err.status === 404) return 'expired'
    if (err.status === 429) return { kind: 'limit', message: err.message }
    return { kind: 'service', message: err.message }
  }
  // fetch() itself rejected: offline, dropped connection, server unreachable.
  return { kind: 'service', message: 'We could not reach the server. Check your connection and try again.' }
}

export function AnalyzeStep({
  photos,
  heightCm,
  method,
  onDone,
  onRetakeViews,
  onCancel,
}: {
  photos: PhotoSet
  heightCm: number
  method: ScanMethod
  onDone: (analysis: ScanAnalysis) => void
  onRetakeViews: (views: ScanView[]) => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<Phase>('uploading')
  const [failure, setFailure] = useState<Failure | null>(null)
  const [elapsed, setElapsed] = useState(0)
  // The uploaded draft survives a failed analysis, so "Try again" only re-runs
  // the analysis instead of re-uploading four photos over a slow connection.
  const draftId = useRef<string | null>(null)
  const runId = useRef(0)
  const controller = useRef<AbortController | null>(null)
  // run() is memoised once (it must keep a stable identity for the mount
  // effect), so it reads the current props through this ref instead of
  // closing over the first render's values.
  const latest = useRef({ photos, heightCm, method, onDone })
  latest.current = { photos, heightCm, method, onDone }

  const run = useCallback(async () => {
    const id = ++runId.current
    controller.current?.abort()
    const ctl = new AbortController()
    controller.current = ctl
    setFailure(null)
    setElapsed(0)
    try {
      if (!draftId.current) {
        setPhase('uploading')
        const { photos: current, heightCm: height, method: scanMethod } = latest.current
        const blobs = Object.fromEntries(SCAN_VIEW_IDS.map((v) => [v, current[v]!.blob])) as Record<ScanView, Blob>
        const draft = await api.client.bodyScan.createDraft(blobs, height, scanMethod, ctl.signal)
        if (id !== runId.current) return
        draftId.current = draft.draftId
      }
      setPhase('analyzing')
      const analysis = await api.client.bodyScan.analyze(draftId.current, ctl.signal)
      if (id !== runId.current) return
      latest.current.onDone(analysis)
    } catch (err) {
      if (id !== runId.current) return
      const result = classify(err)
      if (result === 'aborted') return
      if (result === 'expired') {
        draftId.current = null // the server dropped the draft; upload again
        setFailure({ kind: 'service', message: 'This scan expired before it finished. Please try again.' })
        return
      }
      setFailure(result)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Deferred one tick so React StrictMode's simulated unmount in dev cancels
    // this before any request starts (otherwise the photos upload twice and
    // leave an orphan draft behind).
    const start = setTimeout(run, 0)
    return () => {
      clearTimeout(start)
      runId.current++ // invalidate any in-flight run
      controller.current?.abort()
    }
  }, [run])

  useEffect(() => {
    if (failure) return
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [failure, phase])

  if (failure) {
    const isViews = failure.kind === 'views'
    return (
      <div data-testid="analyze-error">
      <Card className="mx-auto max-w-xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--status-error-bg)] text-[var(--status-error-text)]">
            <AppIcon name="alert" size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold font-display text-ink">
              {isViews ? 'Some photos need to be retaken' : failure.kind === 'blocked' ? "We couldn't analyse these photos" : failure.kind === 'limit' ? 'Please slow down a moment' : "The analysis didn't finish"}
            </h3>
            {isViews ? (
              <ul className="mt-3 space-y-2" data-testid="rejected-views">
                {failure.views.map((v) => (
                  <li key={v.view} className="rounded-xl border border-parchment-dark bg-parchment/60 px-3 py-2 text-xs font-body">
                    <span className="font-semibold text-ink">{VIEW_INFO[v.view].label}:</span>{' '}
                    <span className="text-ink-muted">{v.issue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm font-body leading-relaxed text-ink-muted">{failure.message}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2.5">
              {isViews ? (
                <PillButton variant="primary" icon="camera" onClick={() => onRetakeViews(failure.views.map((v) => v.view))}>
                  Retake {failure.views.length === 1 ? 'this photo' : 'these photos'}
                </PillButton>
              ) : failure.kind === 'blocked' ? (
                <PillButton variant="primary" icon="camera" onClick={() => onRetakeViews([...SCAN_VIEW_IDS])}>
                  Retake photos
                </PillButton>
              ) : failure.kind === 'service' ? (
                <PillButton variant="primary" icon="refresh" onClick={run}>
                  Try again
                </PillButton>
              ) : null}
              <PillButton variant="secondary" onClick={onCancel}>
                Back
              </PillButton>
            </div>
          </div>
        </div>
      </Card>
      </div>
    )
  }

  const steps = [
    { label: 'Uploading your photos securely', done: phase === 'analyzing', active: phase === 'uploading' },
    { label: 'Analysing your four views', done: false, active: phase === 'analyzing' },
    { label: 'Preparing your results', done: false, active: false },
  ]

  return (
    <div data-testid="analyze-progress">
    <Card className="mx-auto flex max-w-xl flex-col items-center p-8 text-center shadow-lg sm:p-10">
      <div className="relative mb-6 h-24 w-24">
        <div className="absolute inset-0 animate-ping rounded-full bg-forest opacity-20" />
        <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-forest bg-surface shadow-xl">
          <AppIcon name="sparkles" size={34} className="animate-pulse text-forest" />
        </div>
      </div>
      <h3 className="text-xl font-bold font-display text-ink">{phase === 'uploading' ? 'Uploading your photos' : 'Analysing your photos'}</h3>
      <p className="mt-1.5 max-w-sm text-xs font-body leading-relaxed text-ink-subtle">
        {phase === 'uploading'
          ? 'Sending your four photos over an encrypted connection.'
          : 'This usually takes 10 to 60 seconds. Please keep this page open.'}
      </p>
      <ul className="mt-6 w-full max-w-xs space-y-2.5 text-left">
        {steps.map((s) => (
          <li key={s.label} className={`flex items-center gap-2.5 text-xs font-body ${s.done || s.active ? 'text-ink' : 'text-ink-subtle'}`}>
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              {s.done ? (
                <AppIcon name="checkCircle" size={16} className="text-forest" />
              ) : s.active ? (
                <span className="h-4 w-4 animate-spin-smooth rounded-full border-2 border-forest border-t-transparent" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-parchment-dark" />
              )}
            </span>
            {s.label}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[11px] font-data text-ink-subtle">{elapsed}s elapsed</p>
      <button type="button" onClick={onCancel} className="mt-4 text-xs font-semibold font-body text-ink-muted hover:text-ink">
        Cancel
      </button>
    </Card>
    </div>
  )
}

export default AnalyzeStep
