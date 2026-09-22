import type { ScanView } from '../../../api'

export interface ViewInfo {
  id: ScanView
  label: string
  /** One-line stance instruction shown on the capture card and live overlay. */
  instruction: string
  /** Spoken-style prompt used by the live camera between captures. */
  live: string
}

export const VIEW_INFO: Record<ScanView, ViewInfo> = {
  front: {
    id: 'front',
    label: 'Front',
    instruction: 'Face the camera. Feet shoulder-width apart, arms slightly away from your body, palms forward.',
    live: 'Face the camera',
  },
  back: {
    id: 'back',
    label: 'Back',
    instruction: 'Turn your back to the camera. Same stance: feet shoulder-width apart, arms slightly away.',
    live: 'Turn around, back to the camera',
  },
  left: {
    id: 'left',
    label: 'Left side',
    instruction: 'Turn so your LEFT side faces the camera. Arms relaxed at your sides, look straight ahead.',
    live: 'Turn so your left side faces the camera',
  },
  right: {
    id: 'right',
    label: 'Right side',
    instruction: 'Turn so your RIGHT side faces the camera. Arms relaxed at your sides, look straight ahead.',
    live: 'Turn so your right side faces the camera',
  },
}

/** Applies to every angle; drawn from what actually makes an estimate better. */
export const POSITIONING_TIPS = [
  'Whole body in frame, head to feet, with a little space above and below.',
  'Fitted clothing (loose layers hide your shape and lower accuracy).',
  'Plain background, even light, phone upright at about waist height.',
  'Stand roughly 2 to 2.5 metres from the camera. Ask someone to take it, or prop your phone.',
]

export const MAX_INPUT_BYTES = 25 * 1024 * 1024
