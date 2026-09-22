import type { Measurements } from '../../../api'

/** Same limits the server enforces (measurementValidators.js BOUNDS), so the
 * editor can flag a bad value before a save is attempted. */
export const BOUNDS: Record<MeasureKey, [number, number]> = {
  height: [100, 260],
  shoulder: [15, 100],
  chest: [40, 250],
  waist: [30, 250],
  hip: [40, 250],
  inseam: [20, 150],
  thigh: [15, 120],
  armLength: [20, 120],
}

export type MeasureKey = 'height' | 'shoulder' | 'chest' | 'waist' | 'hip' | 'inseam' | 'thigh' | 'armLength'

export const MEASURE_FIELDS: { key: MeasureKey; label: string; tip: string }[] = [
  { key: 'height', label: 'Height (stature)', tip: 'Crown of head to floor' },
  { key: 'shoulder', label: 'Shoulder breadth', tip: 'Across the shoulders, point to point' },
  { key: 'chest', label: 'Chest / bust girth', tip: 'Around the fullest part of the chest' },
  { key: 'waist', label: 'Natural waist girth', tip: 'Around the narrowest part of the torso' },
  { key: 'hip', label: 'Hip circumference', tip: 'Around the widest part of the hips' },
  { key: 'inseam', label: 'Inseam length', tip: 'Crotch to ankle, inside of the leg' },
  { key: 'thigh', label: 'Thigh circumference', tip: 'Around the widest part of the upper thigh' },
  { key: 'armLength', label: 'Sleeve / arm length', tip: 'Shoulder point to wrist bone' },
]

export const isInBounds = (key: MeasureKey, value: number) => Number.isFinite(value) && value >= BOUNDS[key][0] && value <= BOUNDS[key][1]

type Values = Pick<Measurements, MeasureKey>

/**
 * Plain proportion ratios computed from the saved numbers. These are real
 * arithmetic on real values: no body-fat or muscle estimates, which cannot be
 * derived honestly from photos.
 */
export function proportions(m: Values) {
  return [
    { id: 'waistToHip', label: 'Waist to hip', value: m.waist / m.hip, hint: 'Waist girth divided by hip girth' },
    { id: 'shoulderToWaist', label: 'Shoulder to waist', value: m.shoulder / m.waist, hint: 'Shoulder breadth divided by waist girth' },
    { id: 'waistToHeight', label: 'Waist to height', value: m.waist / m.height, hint: 'Waist girth divided by height' },
    { id: 'chestToWaist', label: 'Chest to waist', value: m.chest / m.waist, hint: 'Chest girth divided by waist girth' },
  ]
}

export function confidenceLabel(c: number | undefined): { label: string; tone: 'high' | 'medium' | 'low' } | null {
  if (typeof c !== 'number') return null
  if (c >= 0.75) return { label: 'High confidence', tone: 'high' }
  if (c >= 0.5) return { label: 'Medium confidence', tone: 'medium' }
  return { label: 'Low confidence', tone: 'low' }
}

export const TONE_CLASS = {
  high: 'bg-emerald-500/15 text-emerald-600',
  medium: 'bg-amber-500/15 text-amber-600',
  low: 'bg-red-500/15 text-red-500',
} as const

export const TONE_TEXT = {
  high: 'text-emerald-600',
  medium: 'text-amber-600',
  low: 'text-red-500',
} as const

/** Earlier scans (before photo/live scanning existed) were height-scaled averages. */
export const isLegacyScan = (m: { method?: string }) => !m.method

export const methodLabel = (m: { method?: string }) => (m.method === 'live' ? 'Live scan' : m.method === 'photo' ? 'Photo scan' : 'Height-based estimate (earlier version)')

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
