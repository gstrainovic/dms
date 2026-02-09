export async function hashImage(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function resizeImage(
  file: File,
  maxWidth: number = 1540,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  if (bitmap.width <= maxWidth) {
    bitmap.close()
    return file
  }

  const ratio = maxWidth / bitmap.width
  const width = maxWidth
  const height = Math.round(bitmap.height * ratio)

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
}
