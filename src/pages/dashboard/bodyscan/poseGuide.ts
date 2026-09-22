import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark } from './poseMath'

// Pinned to the installed package version so the JS bundle and the WASM it
// loads can never drift apart. The model is Google's published "lite" pose
// landmarker (~6 MB). Only these static files are downloaded: no camera frame
// ever leaves the device during guidance.
const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let loading: Promise<PoseLandmarker> | null = null

/**
 * Lazily loads the on-device pose model (dynamic import, so it costs nothing
 * for people who never open the live scan). Cached; a failed load is not, so
 * the next attempt can retry. The caller falls back to manual capture on error.
 */
export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!loading) {
    loading = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
      const make = (delegate: 'GPU' | 'CPU') =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
      try {
        return await make('GPU')
      } catch {
        return await make('CPU') // some phones/browsers have no usable WebGL
      }
    })().catch((err) => {
      loading = null
      throw err
    })
  }
  return loading
}

/** Runs one detection on the current video frame; undefined when nobody is found. */
export function detectPose(landmarker: PoseLandmarker, video: HTMLVideoElement, timestampMs: number): Landmark[] | undefined {
  const result = landmarker.detectForVideo(video, timestampMs)
  return result.landmarks?.[0] as Landmark[] | undefined
}
