import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error' | 'duplicate'
  progress: number
  documentId?: string
  error?: string
}

export function useUpload() {
  const items = ref<UploadItem[]>([])
  const uploading = ref(false)

  const pendingCount = computed(() => items.value.filter((i) => i.status === 'pending').length)
  const doneCount = computed(() => items.value.filter((i) => i.status === 'done').length)
  const errorCount = computed(() => items.value.filter((i) => i.status === 'error').length)

  function addFiles(files: File[]) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const maxSize = 50 * 1024 * 1024 // 50 MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        items.value.push({
          id: crypto.randomUUID(),
          file,
          status: 'error',
          progress: 0,
          error: `Ungültiger Dateityp: ${file.type}`,
        })
        continue
      }
      if (file.size > maxSize) {
        items.value.push({
          id: crypto.randomUUID(),
          file,
          status: 'error',
          progress: 0,
          error: 'Datei zu groß (max. 50 MB)',
        })
        continue
      }
      items.value.push({
        id: crypto.randomUUID(),
        file,
        status: 'pending',
        progress: 0,
      })
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  function clearCompleted() {
    items.value = items.value.filter((i) => !['done', 'error', 'duplicate'].includes(i.status))
  }

  async function uploadFile(item: UploadItem): Promise<void> {
    item.status = 'uploading'
    item.progress = 10

    try {
      // SHA-256 Hash berechnen
      const buffer = await item.file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const sha256 = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      item.progress = 20

      // Duplikat-Check
      const { data: existing } = await supabase
        .from('documents')
        .select('id')
        .eq('sha256', sha256)
        .maybeSingle()

      if (existing) {
        item.status = 'duplicate'
        item.documentId = existing.id
        item.error = 'Dokument existiert bereits'
        return
      }

      item.progress = 30

      // Storage Upload
      const storagePath = `documents/${sha256}/${item.file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: item.file.type,
          upsert: false,
        })

      if (uploadError) throw new Error(uploadError.message)

      item.progress = 60

      // DB-Eintrag
      const { data: doc, error: dbError } = await supabase
        .from('documents')
        .insert({
          original_filename: item.file.name,
          mime_type: item.file.type,
          file_size: item.file.size,
          storage_path: storagePath,
          sha256,
          status: 'uploaded',
        })
        .select()
        .single()

      if (dbError) throw new Error(dbError.message)

      item.progress = 80
      item.documentId = doc.id
      item.status = 'processing'

      // Edge Function für OCR triggern
      const { error: fnError } = await supabase.functions.invoke('process-ocr', {
        body: { documentId: doc.id },
      })

      if (fnError) {
        console.warn('OCR-Trigger fehlgeschlagen, wird über Realtime verfolgt:', fnError)
      }

      item.progress = 100
      item.status = 'done'
    } catch (e) {
      item.status = 'error'
      item.error = e instanceof Error ? e.message : 'Upload fehlgeschlagen'
    }
  }

  async function uploadAll() {
    uploading.value = true
    const pending = items.value.filter((i) => i.status === 'pending')

    // Sequentiell hochladen (vermeidet Rate Limits)
    for (const item of pending) {
      await uploadFile(item)
    }

    uploading.value = false
  }

  function subscribeToDocumentUpdates() {
    return supabase
      .channel('upload-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documents' },
        (payload) => {
          const updated = payload.new as any
          const item = items.value.find((i) => i.documentId === updated.id)
          if (item) {
            if (updated.status === 'ready') {
              item.status = 'done'
              item.progress = 100
            } else if (updated.status === 'error') {
              item.status = 'error'
              item.error = updated.error_message || 'Verarbeitung fehlgeschlagen'
            } else if (['processing', 'ocr_done', 'extracted'].includes(updated.status)) {
              item.status = 'processing'
              item.progress = updated.status === 'ocr_done' ? 60 : updated.status === 'extracted' ? 80 : 40
            }
          }
        },
      )
      .subscribe()
  }

  return {
    items,
    uploading,
    pendingCount,
    doneCount,
    errorCount,
    addFiles,
    removeItem,
    clearCompleted,
    uploadAll,
    subscribeToDocumentUpdates,
  }
}
