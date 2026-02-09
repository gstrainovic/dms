import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Document, DocumentField, Tag } from '@/lib/database.types'

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const documentCount = computed(() => documents.value.length)
  const readyCount = computed(() => documents.value.filter((d) => d.status === 'ready').length)
  const processingCount = computed(() =>
    documents.value.filter((d) => ['uploaded', 'processing', 'ocr_done', 'extracted'].includes(d.status)).length,
  )

  async function fetchDocuments() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      documents.value = data ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Fehler beim Laden'
    } finally {
      loading.value = false
    }
  }

  async function fetchDocument(id: string) {
    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (err) throw err
    return data
  }

  async function fetchDocumentFields(documentId: string): Promise<DocumentField[]> {
    const { data, error: err } = await supabase
      .from('document_fields')
      .select('*')
      .eq('document_id', documentId)

    if (err) throw err
    return data ?? []
  }

  async function fetchDocumentTags(documentId: string): Promise<Tag[]> {
    const { data, error: err } = await supabase
      .from('document_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('document_id', documentId)

    if (err) throw err
    return (data ?? []).map((dt: any) => dt.tags)
  }

  async function updateDocument(id: string, updates: Partial<Pick<Document, 'title' | 'document_type'>>) {
    const { error: err } = await supabase.from('documents').update(updates).eq('id', id)
    if (err) throw err
    const idx = documents.value.findIndex((d) => d.id === id)
    if (idx !== -1) Object.assign(documents.value[idx], updates)
  }

  async function addTagToDocument(documentId: string, tagId: string) {
    const { error: err } = await supabase
      .from('document_tags')
      .upsert({ document_id: documentId, tag_id: tagId, source: 'manual' })
    if (err) throw err
  }

  async function removeTagFromDocument(documentId: string, tagId: string) {
    const { error: err } = await supabase
      .from('document_tags')
      .delete()
      .eq('document_id', documentId)
      .eq('tag_id', tagId)
    if (err) throw err
  }

  async function updateField(fieldId: string, value: string) {
    const { error: err } = await supabase
      .from('document_fields')
      .update({ field_value: value, source: 'manual' })
      .eq('id', fieldId)
    if (err) throw err
  }

  async function addField(documentId: string, name: string, value: string, type = 'text') {
    const { data, error: err } = await supabase
      .from('document_fields')
      .insert({
        document_id: documentId,
        field_name: name,
        field_value: value,
        field_type: type,
        source: 'manual',
      })
      .select()
      .single()
    if (err) throw err
    return data
  }

  async function deleteField(fieldId: string) {
    const { error: err } = await supabase.from('document_fields').delete().eq('id', fieldId)
    if (err) throw err
  }

  async function deleteDocument(id: string) {
    const { error: err } = await supabase.from('documents').delete().eq('id', id)
    if (err) throw err
    documents.value = documents.value.filter((d) => d.id !== id)
  }

  function subscribeToChanges() {
    return supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            documents.value.unshift(payload.new as Document)
          } else if (payload.eventType === 'UPDATE') {
            const idx = documents.value.findIndex((d) => d.id === (payload.new as Document).id)
            if (idx !== -1) documents.value[idx] = payload.new as Document
          } else if (payload.eventType === 'DELETE') {
            documents.value = documents.value.filter((d) => d.id !== (payload.old as Document).id)
          }
        },
      )
      .subscribe()
  }

  return {
    documents,
    loading,
    error,
    documentCount,
    readyCount,
    processingCount,
    fetchDocuments,
    fetchDocument,
    fetchDocumentFields,
    fetchDocumentTags,
    updateDocument,
    addTagToDocument,
    removeTagFromDocument,
    updateField,
    addField,
    deleteField,
    deleteDocument,
    subscribeToChanges,
  }
})
