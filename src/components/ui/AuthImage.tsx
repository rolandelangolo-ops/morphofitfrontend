import { useEffect, useState } from 'react'

/** Renders an image served by an `authenticate`-gated backend route (e.g.
 * support-request screenshots) — a plain `<img src>` can't carry the
 * Authorization header, so this fetches the bytes with the header attached
 * and hands the browser a local object URL instead.
 *
 * `src` arrives as the absolute backend URL (built by `publicUploadUrl` —
 * see MorphofitBackend/src/middleware/upload.js), but fetching that
 * directly would hit the backend's own origin/port, which only allows
 * `fetch` (not plain `<img>`) from origins in CLIENT_ORIGIN — and the dev
 * server doesn't always land on that exact port (see vite.config.ts's
 * `strictPort: false`). Fetching the path instead keeps the request
 * same-origin, going through the `/uploads` dev proxy (or same host in
 * prod) instead of cross-origin to the backend. */
export function AuthImage({
  src,
  alt = '',
  className,
  onClick,
}: {
  src: string
  alt?: string
  className?: string
  onClick?: () => void
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let created: string | null = null
    const token = localStorage.getItem('morphofit_token')
    const path = (() => {
      try {
        return new URL(src).pathname
      } catch {
        return src
      }
    })()

    fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('Failed to load image'))))
      .then((blob) => {
        if (cancelled) return
        created = URL.createObjectURL(blob)
        setObjectUrl(created)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [src])

  if (!objectUrl) {
    return <div className={`animate-shimmer ${className}`} />
  }

  return <img src={objectUrl} alt={alt} className={className} onClick={onClick} />
}

export default AuthImage
