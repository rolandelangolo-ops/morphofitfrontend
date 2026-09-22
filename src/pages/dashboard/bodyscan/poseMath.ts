import type { ScanView } from '../../../api'

/**
 * Pure pose maths for the live scan: given MediaPipe's 33 body landmarks,
 * decide which way the person is facing, whether they are fully and sensibly
 * framed, and whether they have held still. No DOM, no camera: it is
 * unit-checkable with hand-made landmark sets.
 *
 * Coordinates are MediaPipe's normalised image space of the RAW video frame:
 * x and y in 0..1 from the top-left, z = depth relative to the hips (smaller =
 * closer to the camera). The frame is never mirrored here; the preview may be.
 * Left/right are the PERSON's anatomical sides.
 */
export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export const LM = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFoot: 31,
  rightFoot: 32,
} as const

export type Orientation = ScanView | 'turning' | 'unknown'

export type GuidanceCode =
  | 'no-person'
  | 'too-close'
  | 'too-far'
  | 'cut-off'
  | 'move-left'
  | 'move-right'
  | 'straighten'
  | 'wrong-view'
  | 'turning'
  | 'ready'

export interface Guidance {
  code: GuidanceCode
  /** Short imperative shown on screen. */
  message: string
  /** True only when this frame is a valid capture of the requested view. */
  ok: boolean
  orientation: Orientation
}

const vis = (l: Landmark | undefined) => l?.visibility ?? 0
const mid = (a: Landmark, b: Landmark) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 })

/** How wide the shoulders look relative to torso length: ~0.75+ face-on, ~0.25 side-on. */
export function shoulderRatio(lm: Landmark[]): number {
  const ls = lm[LM.leftShoulder]
  const rs = lm[LM.rightShoulder]
  const lh = lm[LM.leftHip]
  const rh = lm[LM.rightHip]
  const torso = Math.abs(mid(lh, rh).y - mid(ls, rs).y)
  if (torso < 1e-6) return 0
  return Math.abs(ls.x - rs.x) / torso
}

export function estimateOrientation(lm: Landmark[]): Orientation {
  const ls = lm[LM.leftShoulder]
  const rs = lm[LM.rightShoulder]
  if (!ls || !rs || !lm[LM.leftHip] || !lm[LM.rightHip]) return 'unknown'
  const ratio = shoulderRatio(lm)

  if (ratio >= 0.5) {
    // Facing the camera or away from it. Three independent cues vote:
    //  1. anatomical order: face-on, the person's LEFT shoulder is on the
    //     image's right, so leftShoulder.x > rightShoulder.x; back view flips it
    //  2. the face landmarks are only confidently visible from the front
    //  3. the nose sits in front of (closer than) the shoulder line from the front
    let front = 0
    front += ls.x > rs.x ? 1 : -1
    const face = (vis(lm[LM.nose]) + vis(lm[LM.leftEye]) + vis(lm[LM.rightEye])) / 3
    front += face > 0.55 ? 1 : face < 0.35 ? -1 : 0
    front += lm[LM.nose].z < mid(ls, rs).z - 0.04 ? 1 : lm[LM.nose].z > mid(ls, rs).z ? -1 : 0
    return front > 0 ? 'front' : 'back'
  }

  if (ratio <= 0.4) {
    // Side-on: whichever shoulder/hip is closer to the camera (smaller z) is
    // the side facing it. Ear visibility is a second, independent cue.
    const depth = lm[LM.rightShoulder].z - lm[LM.leftShoulder].z + (lm[LM.rightHip].z - lm[LM.leftHip].z)
    const ear = vis(lm[LM.leftEar]) - vis(lm[LM.rightEar])
    let left = 0
    if (Math.abs(depth) > 0.03) left += depth > 0 ? 1 : -1
    if (Math.abs(ear) > 0.15) left += ear > 0 ? 1 : -1
    if (left === 0) return 'unknown'
    return left > 0 ? 'left' : 'right'
  }

  return 'turning'
}

export interface Framing {
  /** Estimated crown of the head (y, 0..1) - MediaPipe has no top-of-head point. */
  top: number
  /** Lowest visible foot point (y). */
  bottom: number
  /** Body height as a fraction of the frame height. */
  fill: number
  /** Horizontal centre of the torso (x, 0..1) in the RAW frame. */
  centerX: number
  /** Torso lean from vertical in degrees. */
  leanDeg: number
  /** Every landmark needed to size the body is confidently visible. */
  complete: boolean
}

export function measureFraming(lm: Landmark[]): Framing {
  const ls = lm[LM.leftShoulder]
  const rs = lm[LM.rightShoulder]
  const lh = lm[LM.leftHip]
  const rh = lm[LM.rightHip]
  const shoulders = mid(ls, rs)
  const hips = mid(lh, rh)
  const nose = lm[LM.nose]

  // Nose to shoulder line is roughly 0.85x the nose-to-crown distance's mirror,
  // so the crown sits about that far above the nose.
  const top = nose.y - 0.85 * Math.max(0, shoulders.y - nose.y)
  const feet = [LM.leftHeel, LM.rightHeel, LM.leftFoot, LM.rightFoot, LM.leftAnkle, LM.rightAnkle]
    .map((i) => lm[i])
    .filter((l): l is Landmark => !!l && vis(l) > 0.4)
  const bottom = feet.length ? Math.max(...feet.map((l) => l.y)) : Math.max(lm[LM.leftAnkle].y, lm[LM.rightAnkle].y)

  // The nose is NOT required: from behind the face landmarks are (correctly)
  // low-confidence, and the model still places them well enough to size the head.
  const required = [LM.leftShoulder, LM.rightShoulder, LM.leftHip, LM.rightHip, LM.leftKnee, LM.rightKnee, LM.leftAnkle, LM.rightAnkle]
  const complete = required.every((i) => vis(lm[i]) >= 0.5 && lm[i].x > 0.01 && lm[i].x < 0.99 && lm[i].y > 0.01 && lm[i].y < 0.99)

  const dx = shoulders.x - hips.x
  const dy = hips.y - shoulders.y
  const leanDeg = Math.abs((Math.atan2(dx, dy) * 180) / Math.PI)

  return { top, bottom, fill: bottom - top, centerX: (shoulders.x + hips.x) / 2, leanDeg, complete }
}

const VIEW_PROMPT: Record<ScanView, string> = {
  front: 'Face the camera',
  back: 'Turn around, back to the camera',
  left: 'Turn so your LEFT side faces the camera',
  right: 'Turn so your RIGHT side faces the camera',
}

export const FILL_MIN = 0.62
export const FILL_MAX = 0.94

/**
 * The single decision the live scan acts on: what to tell the person right now
 * and whether this frame is a valid capture of `target`. Checks run in the
 * order a person would fix them: be in frame, be the right size, be centred,
 * be facing the right way. `mirrored` says whether the on-screen preview is a
 * mirror image (front camera); the wording is relative to what they see.
 */
export function evaluatePose(lm: Landmark[] | undefined, target: ScanView, mirrored: boolean): Guidance {
  if (!lm || lm.length < 29) return { code: 'no-person', message: 'Step into the frame so the camera can see you', ok: false, orientation: 'unknown' }

  const f = measureFraming(lm)
  const orientation = estimateOrientation(lm)

  if (!f.complete) {
    // Distinguish "too close, cut off" from "nobody there".
    const anyVisible = [LM.leftShoulder, LM.rightShoulder, LM.leftHip, LM.rightHip].some((i) => vis(lm[i]) > 0.5)
    if (!anyVisible) return { code: 'no-person', message: 'Step into the frame so the camera can see you', ok: false, orientation }
    return { code: 'cut-off', message: 'Step back until your whole body, head to feet, is in view', ok: false, orientation }
  }
  if (f.fill > FILL_MAX || f.top < 0.015 || f.bottom > 0.985) {
    return { code: 'too-close', message: 'Step back a little', ok: false, orientation }
  }
  if (f.fill < FILL_MIN) return { code: 'too-far', message: 'Move a little closer', ok: false, orientation }

  const shown = mirrored ? 1 - f.centerX : f.centerX
  if (shown < 0.36) return { code: 'move-right', message: 'Move a little to the right', ok: false, orientation }
  if (shown > 0.64) return { code: 'move-left', message: 'Move a little to the left', ok: false, orientation }

  if (f.leanDeg > 12) return { code: 'straighten', message: 'Stand up straight and hold the phone upright', ok: false, orientation }

  if (orientation === 'turning') return { code: 'turning', message: VIEW_PROMPT[target], ok: false, orientation }
  if (orientation !== target) {
    return { code: 'wrong-view', message: VIEW_PROMPT[target], ok: false, orientation }
  }
  return { code: 'ready', message: 'Perfect. Hold still', ok: true, orientation }
}

/**
 * Tracks whether the person has held still. A capture fires only after the
 * pose has been valid AND steady for `holdMs`, so a mid-turn or mid-step frame
 * is never used.
 */
export class StillnessTracker {
  private prev: Landmark[] | null = null
  private since: number | null = null

  constructor(
    private readonly holdMs = 1200,
    private readonly maxStep = 0.012
  ) {}

  reset() {
    this.prev = null
    this.since = null
  }

  /** Returns 0..1 progress toward the hold time (1 = hold complete). */
  update(now: number, lm: Landmark[] | undefined, valid: boolean): number {
    if (!valid || !lm) {
      this.reset()
      return 0
    }
    const idx = [LM.nose, LM.leftShoulder, LM.rightShoulder, LM.leftHip, LM.rightHip, LM.leftAnkle, LM.rightAnkle]
    if (this.prev) {
      const step = Math.max(...idx.map((i) => Math.hypot(lm[i].x - this.prev![i].x, lm[i].y - this.prev![i].y)))
      if (step > this.maxStep) this.since = null
    }
    this.prev = lm.map((l) => ({ ...l }))
    if (this.since === null) this.since = now
    return Math.min(1, (now - this.since) / this.holdMs)
  }
}
