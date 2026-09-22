import type { ScanView } from '../../../api'

/**
 * A simple line figure showing the stance for each angle. `overlay` draws it
 * as a dashed white outline for laying over the live camera; otherwise it
 * uses the theme colours for the capture cards.
 */
export function StanceGuide({ view, overlay = false, className = '' }: { view: ScanView; overlay?: boolean; className?: string }) {
  const stroke = overlay ? 'rgba(255,255,255,0.92)' : 'currentColor'
  const fill = overlay ? 'rgba(255,255,255,0.07)' : 'currentColor'
  const fillOpacity = overlay ? 1 : 0.08
  const common = {
    stroke,
    strokeWidth: overlay ? 1.6 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: overlay ? '4 3' : undefined,
    fill,
    fillOpacity,
  }
  const isSide = view === 'left' || view === 'right'
  // In a LEFT-side view the person's left side faces the camera, so they face
  // toward the left of the frame (and the mirror image for the right side).
  const facing = view === 'left' ? -1 : 1

  return (
    <svg viewBox="0 0 100 220" className={className} role="img" aria-label={`${view} stance guide`}>
      {isSide ? (
        <g transform={facing === 1 ? 'translate(100 0) scale(-1 1)' : undefined}>
          <circle cx="50" cy="18" r="10" {...common} />
          {/* nose: points the way the person faces (toward the frame's left in this drawing) */}
          <path d="M40.5 17 L34 20 L40.5 22" {...common} fill="none" />
          <path d="M43 32 L58 32 Q60 60 57 100 L43 100 Q40 62 43 32 Z" {...common} />
          <path d="M50 36 L52 96" {...common} fill="none" />
          <path d="M46 100 L45 205 L33 208" {...common} fill="none" />
          <path d="M55 100 L56 205 L44 208" {...common} fill="none" />
        </g>
      ) : (
        <g>
          <circle cx="50" cy="18" r="10" {...common} />
          <path d="M44 28 L44 34 M56 28 L56 34" {...common} fill="none" />
          <path d="M34 36 Q50 30 66 36 L60 100 L40 100 Z" {...common} />
          <path d="M34 38 L20 94" {...common} fill="none" />
          <path d="M66 38 L80 94" {...common} fill="none" />
          <path d="M41 100 L36 205 L28 208" {...common} fill="none" />
          <path d="M59 100 L64 205 L72 208" {...common} fill="none" />
          {view === 'back' && <path d="M50 34 L50 98" {...common} fill="none" strokeDasharray="2 3" />}
        </g>
      )}
    </svg>
  )
}

export default StanceGuide
