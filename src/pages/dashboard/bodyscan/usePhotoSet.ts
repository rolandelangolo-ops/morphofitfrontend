import { useCallback, useEffect, useRef, useState } from 'react'
import { SCAN_VIEW_IDS, type ScanView } from '../../../api'

export interface Captured {
  /** Prepared JPEG that will actually be uploaded. */
  blob: Blob
  /** Object URL for previews only. */
  url: string
}

export type PhotoSet = Partial<Record<ScanView, Captured>>

/**
 * The four scan photos, shared by the Photo and Live methods so both feed the
 * exact same analysis step. Owns the preview object URLs and revokes them when
 * a photo is replaced/removed or the page unmounts.
 */
export function usePhotoSet() {
  const [photos, setPhotos] = useState<PhotoSet>({})
  const urls = useRef<Set<string>>(new Set())

  const setPhoto = useCallback((view: ScanView, blob: Blob) => {
    const url = URL.createObjectURL(blob)
    urls.current.add(url)
    setPhotos((prev) => {
      const old = prev[view]
      if (old) {
        URL.revokeObjectURL(old.url)
        urls.current.delete(old.url)
      }
      return { ...prev, [view]: { blob, url } }
    })
  }, [])

  const clearViews = useCallback((views: ScanView[]) => {
    setPhotos((prev) => {
      const next = { ...prev }
      for (const v of views) {
        const old = next[v]
        if (old) {
          URL.revokeObjectURL(old.url)
          urls.current.delete(old.url)
        }
        delete next[v]
      }
      return next
    })
  }, [])

  const clearAll = useCallback(() => clearViews([...SCAN_VIEW_IDS]), [clearViews])

  useEffect(() => {
    const live = urls.current
    return () => {
      for (const u of live) URL.revokeObjectURL(u)
      live.clear()
    }
  }, [])

  const missing = SCAN_VIEW_IDS.filter((v) => !photos[v])
  const complete = missing.length === 0
  return { photos, setPhoto, clearViews, clearAll, missing, complete }
}
