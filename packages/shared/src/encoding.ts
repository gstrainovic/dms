/**
 * Base64-Encoding für Uint8Array.
 *
 * Verwendet Chunking um Stack Overflow bei String.fromCharCode zu vermeiden.
 * chunkSize MUSS durch 3 teilbar sein, damit btoa kein Padding (=) mitten
 * im String einfügt — sonst wird das Base64 ungültig.
 */
const CHUNK_SIZE = 32766 // 10922 * 3

export function uint8ToBase64(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    result += btoa(String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE)))
  }
  return result
}

export function toDataUrl(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${uint8ToBase64(bytes)}`
}
