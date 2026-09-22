import { MAX_INPUT_BYTES } from './scanViews'

const MAX_SIDE = 1280
const MIN_SIDE = 480
const JPEG_QUALITY = 0.85

export class ImageError extends Error {}

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void }

async function decode(file: Blob): Promise<Drawable> {
  // createImageBitmap with 'from-image' applies the EXIF rotation phones
  // record, so a portrait shot isn't analysed sideways.
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() }
    } catch {
      /* fall through to <img>, which also honours EXIF orientation in current browsers */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new ImageError("This image format isn't supported here. Please use a JPEG or PNG photo.")
  }
}

/**
 * Validates and prepares one scan photo: decode -> downscale (long side
 * <= 1280px, never upscaled) -> re-encode as JPEG.
 *
 * Re-encoding through a canvas drops ALL metadata, including the GPS
 * location and device details phones embed in photos, so none of that is ever
 * uploaded. It also keeps each upload to a few hundred KB on mobile data.
 */
export async function prepareScanImage(file: Blob): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new ImageError('Please choose an image file (JPEG or PNG).')
  if (file.size === 0) throw new ImageError('That file is empty. Please choose another photo.')
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('That photo is too large (over 25 MB). Please choose a smaller one.')

  const drawable = await decode(file)
  try {
    const { width, height } = drawable
    if (Math.min(width, height) < MIN_SIDE) {
      throw new ImageError('That photo is too small to analyse. Please use a higher-resolution photo.')
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError("Your browser couldn't process this image. Please try another browser.")
    ctx.drawImage(drawable.source, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new ImageError("Couldn't prepare this photo. Please try another one.")
    return blob
  } finally {
    drawable.release()
  }
}

/** Grabs the current frame of a playing <video> as a prepared JPEG (live scan). */
export async function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) throw new ImageError('The camera is not ready yet.')
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError("Your browser couldn't capture this frame.")
  // Deliberately NOT mirrored: the preview is mirrored for the front camera,
  // but the saved frame must show the person's true left/right.
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new ImageError("Couldn't capture this frame. Please try again.")
  return blob
}
