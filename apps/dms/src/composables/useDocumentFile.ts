import { supabase } from '@/lib/supabase'

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function isPreviewable(mimeType: string): boolean {
  return isImage(mimeType) || isPdf(mimeType)
}

export async function getDocumentUrl(storagePath: string): Promise<string | null> {
  if (!storagePath) return null

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
