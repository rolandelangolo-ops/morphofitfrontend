import { useCallback, useEffect, useRef, useState } from 'react'

export type Facing = 'user' | 'environment'

/**
 * What the camera is doing. Every failure has its own status because each one
 * needs different advice from the user:
 *  - denied:      they (or the browser) blocked camera permission
 *  - unavailable: no camera on this device
 *  - in-use:      another app/tab holds the camera, or the OS blocked it
 *  - insecure:    getUserMedia only exists on HTTPS (or localhost)
 *  - unsupported: an old browser without getUserMedia at all
 *  - lost:        the camera worked, then stopped (unplugged / revoked mid-scan)
 */
export type CameraStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'unavailable' | 'in-use' | 'insecure' | 'unsupported' | 'lost' | 'error'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startId = useRef(0)
  const wantLive = useRef(false)
  const facingRef = useRef<Facing>('user')
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [facing, setFacing] = useState<Facing>('user')

  const stop = useCallback(() => {
    wantLive.current = false
    startId.current++
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const start = useCallback(
    async (want: Facing) => {
      startId.current++
      const id = startId.current
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      wantLive.current = true
      facingRef.current = want
      setFacing(want)

      if (typeof window !== 'undefined' && !window.isSecureContext) return setStatus('insecure')
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported')
      setStatus('requesting')

      const attempt = (video: MediaTrackConstraints | true) => navigator.mediaDevices.getUserMedia({ video, audio: false })
      let stream: MediaStream
      try {
        try {
          stream = await attempt({ facingMode: { ideal: want }, width: { ideal: 720 }, height: { ideal: 1280 } })
        } catch (err) {
          // Some devices reject an over-specific request; a bare request works.
          if (err instanceof DOMException && err.name === 'OverconstrainedError') stream = await attempt(true)
          else throw err
        }
      } catch (err) {
        if (id !== startId.current) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return setStatus('denied')
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return setStatus('unavailable')
        if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return setStatus('in-use')
        return setStatus('error')
      }

      if (id !== startId.current) {
        // A newer start()/stop() superseded this one while the permission
        // prompt was open; don't leave that camera running.
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      // If the camera disappears mid-scan (unplugged, permission revoked,
      // OS reclaimed it) say so instead of freezing on the last frame.
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (streamRef.current === stream && wantLive.current) setStatus('lost')
        })
      })

      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.muted = true
        video.setAttribute('playsinline', 'true') // iOS Safari would otherwise go fullscreen
        try {
          await video.play()
        } catch {
          // Autoplay was blocked; the stream is attached, the user's next tap plays it.
        }
      }
      if (id === startId.current) setStatus('live')
    },
    []
  )

  const flip = useCallback(() => start(facing === 'user' ? 'environment' : 'user'), [start, facing])

  // Re-acquire after a backgrounded tab returns (mobile browsers suspend the
  // stream). Reads the facing mode from a ref so this listener is never torn
  // down (and the camera never stopped) just because the user flipped cameras.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !wantLive.current) return
      const live = streamRef.current?.getVideoTracks().some((t) => t.readyState === 'live')
      if (!live) start(facingRef.current)
      else videoRef.current?.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [start])

  // Never leave the camera light on: release it when the screen goes away.
  useEffect(() => () => stop(), [stop])

  return { videoRef, status, facing, start, stop, flip }
}
