import { useRef, useState } from 'react'
import { SCAN_VIEW_IDS, type ScanView } from '../../../api'
import { Card, PillButton } from '../../../components/ui/primitives'
import { AppIcon } from '../../../components/ui/icons'
import { useToast } from '../../../components/ui/Toast'
import { ImageError, prepareScanImage } from './imageUtils'
import { POSITIONING_TIPS, VIEW_INFO } from './scanViews'
import { StanceGuide } from './StanceGuide'
import { HeightField, isHeightValid } from './HeightField'
import type { PhotoSet } from './usePhotoSet'

// The `capture` attribute only does something on touch devices (it opens the
// native camera); on desktop it would just show a file picker labelled "Take
// photo", so desktop gets a plain Upload button (Live scan covers webcams).
const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

function AngleCard({
  view,
  index,
  isNext,
  photos,
  onFile,
  onRemove,
}: {
  view: ScanView
  index: number
  isNext: boolean
  photos: PhotoSet
  onFile: (view: ScanView, file: File) => Promise<void>
  onRemove: (view: ScanView) => void
}) {
  const info = VIEW_INFO[view]
  const photo = photos[view]
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be picked again after a retake
    if (!file) return
    setBusy(true)
    try {
      await onFile(view, file)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div data-testid={`angle-${view}`}>
    <Card className={`p-4 transition-shadow ${isNext ? 'ring-2 ring-forest/40 shadow-md' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold font-data ${
              photo ? 'bg-forest text-white' : 'bg-parchment text-ink-subtle'
            }`}
          >
            {photo ? <AppIcon name="check" size={13} strokeWidth={2.5} /> : index + 1}
          </span>
          <span className="text-sm font-bold font-display text-ink">{info.label}</span>
        </div>
        {isNext && !photo && (
          <span className="text-[10px] font-data font-semibold uppercase tracking-wider text-forest">Next</span>
        )}
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-2xl border border-parchment-dark bg-parchment">
        {photo ? (
          <img src={photo.url} alt={`${info.label} photo`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6 text-forest">
            <StanceGuide view={view} className="h-full w-auto" />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="h-6 w-6 animate-spin-smooth rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <p className="mt-3 min-h-[2.5rem] text-[11px] font-body leading-relaxed text-ink-muted">{info.instruction}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {IS_TOUCH && (
          <PillButton size="sm" variant={photo ? 'secondary' : 'primary'} icon="camera" onClick={() => cameraRef.current?.click()} disabled={busy}>
            {photo ? 'Retake' : 'Take photo'}
          </PillButton>
        )}
        <PillButton size="sm" variant={photo || IS_TOUCH ? 'secondary' : 'primary'} icon="upload" onClick={() => uploadRef.current?.click()} disabled={busy}>
          {photo ? 'Replace' : 'Upload'}
        </PillButton>
        {photo && (
          <PillButton size="sm" variant="ghost" icon="trash" onClick={() => onRemove(view)} disabled={busy}>
            Remove
          </PillButton>
        )}
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} data-testid={`camera-input-${view}`} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handle} data-testid={`upload-input-${view}`} />
    </Card>
    </div>
  )
}

export function PhotoScanFlow({
  photos,
  missing,
  onSetPhoto,
  onRemovePhoto,
  heightCm,
  onHeightChange,
  onAnalyze,
  onBack,
}: {
  photos: PhotoSet
  missing: ScanView[]
  onSetPhoto: (view: ScanView, blob: Blob) => void
  onRemovePhoto: (view: ScanView) => void
  heightCm: number
  onHeightChange: (h: number) => void
  onAnalyze: () => void
  onBack: () => void
}) {
  const { show } = useToast()
  const heightValid = isHeightValid(heightCm)
  const nextView = SCAN_VIEW_IDS.find((v) => !photos[v])
  const done = SCAN_VIEW_IDS.length - missing.length

  const handleFile = async (view: ScanView, file: File) => {
    try {
      onSetPhoto(view, await prepareScanImage(file))
    } catch (err) {
      show({
        title: `Couldn't use that ${VIEW_INFO[view].label.toLowerCase()} photo`,
        description: err instanceof ImageError ? err.message : 'Please try a different photo.',
        tone: 'error',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold font-body text-ink-muted hover:text-ink">
          <AppIcon name="chevronLeft" size={14} /> Change method
        </button>
        <span className="text-[11px] font-data font-semibold uppercase tracking-wider text-ink-subtle" data-testid="photo-progress">
          {done} of {SCAN_VIEW_IDS.length} photos
        </span>
      </div>

      <Card className="p-5" style={{ background: 'var(--gradient-mesh)' }}>
        <h3 className="text-sm font-bold font-display text-ink">Get a good result</h3>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {POSITIONING_TIPS.map((tip) => (
            <li key={tip} className="flex gap-2 text-xs font-body leading-relaxed text-ink-muted">
              <AppIcon name="check" size={13} className="mt-0.5 flex-shrink-0 text-forest" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SCAN_VIEW_IDS.map((view, i) => (
          <AngleCard key={view} view={view} index={i} isNext={view === nextView} photos={photos} onFile={handleFile} onRemove={onRemovePhoto} />
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <HeightField value={heightCm} onChange={onHeightChange} />

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {missing.length > 0 && (
              <p className="text-[11px] font-body text-ink-muted" data-testid="missing-list">
                Still needed: <span className="font-semibold text-ink">{missing.map((v) => VIEW_INFO[v].label).join(', ')}</span>
              </p>
            )}
            <PillButton variant="primary" size="lg" icon="sparkles" onClick={onAnalyze} disabled={missing.length > 0 || !heightValid}>
              Analyse my photos
            </PillButton>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PhotoScanFlow
