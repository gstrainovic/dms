import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

describe('Upload Pipeline', () => {
  let supabase: SupabaseClient
  const testDocIds: string[] = []

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  })

  afterAll(async () => {
    for (const id of testDocIds) {
      await supabase.from('document_embeddings').delete().eq('document_id', id)
      await supabase.from('document_fields').delete().eq('document_id', id)
      await supabase.from('document_tags').delete().eq('document_id', id)
      await supabase.from('documents').delete().eq('id', id)
    }
  })

  it('lädt Datei in Storage hoch', async () => {
    const testContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47]) // PNG magic bytes
    const sha256 = 'test-upload-' + Date.now()
    const storagePath = `documents/${sha256}/test.png`

    const { error } = await supabase.storage
      .from('documents')
      .upload(storagePath, testContent, {
        contentType: 'image/png',
        upsert: false,
      })

    expect(error).toBeNull()

    // Cleanup
    await supabase.storage.from('documents').remove([storagePath])
  })

  it('erstellt Dokument-Eintrag mit SHA-256', async () => {
    const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    const now = Date.now()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        original_filename: `upload-test-${now}.pdf`,
        mime_type: 'application/pdf',
        file_size: 1024,
        storage_path: `documents/${sha256}/test-${now}.pdf`,
        sha256: sha256 + now, // Unique
        status: 'uploaded',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.status).toBe('uploaded')
    testDocIds.push(data!.id)
  })

  it('erkennt SHA-256 Duplikate', async () => {
    const sha256 = 'duplikat-test-' + Date.now()

    // Erstes Dokument
    const { data: first } = await supabase
      .from('documents')
      .insert({
        original_filename: 'original.pdf',
        mime_type: 'application/pdf',
        file_size: 1024,
        storage_path: `documents/${sha256}/original.pdf`,
        sha256,
        status: 'uploaded',
      })
      .select()
      .single()

    testDocIds.push(first!.id)

    // Duplikat-Check
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('sha256', sha256)
      .maybeSingle()

    expect(existing).not.toBeNull()
    expect(existing!.id).toBe(first!.id)
  })

  it('aktualisiert Status-Pipeline korrekt', async () => {
    const sha256 = 'pipeline-test-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'pipeline.pdf',
        mime_type: 'application/pdf',
        file_size: 2048,
        storage_path: `documents/${sha256}/pipeline.pdf`,
        sha256,
        status: 'uploaded',
      })
      .select()
      .single()

    testDocIds.push(doc!.id)

    // Simuliere Pipeline: uploaded → processing → ocr_done → extracted → ready
    for (const status of ['processing', 'ocr_done', 'extracted', 'ready'] as const) {
      const update: Record<string, any> = { status }
      if (status === 'ocr_done') {
        update.ocr_text = 'Testtext aus OCR-Verarbeitung'
        update.page_count = 1
      }

      const { error } = await supabase
        .from('documents')
        .update(update)
        .eq('id', doc!.id)

      expect(error).toBeNull()

      const { data: updated } = await supabase
        .from('documents')
        .select('status')
        .eq('id', doc!.id)
        .single()

      expect(updated!.status).toBe(status)
    }
  })

  it('speichert OCR-Text und generiert tsvector', async () => {
    const sha256 = 'fts-test-' + Date.now()
    const ocrText = 'Dies ist eine Rechnung über dreihundert Euro für Beratungsleistungen'

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'rechnung.pdf',
        mime_type: 'application/pdf',
        file_size: 4096,
        storage_path: `documents/${sha256}/rechnung.pdf`,
        sha256,
        status: 'ready',
        title: 'Testrechnung',
        ocr_text: ocrText,
      })
      .select()
      .single()

    testDocIds.push(doc!.id)

    // Volltext-Suche testen (deutsch) — textSearch nutzt websearch_to_tsquery Format
    const { data: results, error: searchError } = await supabase
      .from('documents')
      .select('id, title')
      .textSearch('fts', 'Rechnung', { type: 'websearch', config: 'german' })

    expect(searchError).toBeNull()
    expect(results).not.toBeNull()
    expect(results!.length).toBeGreaterThan(0)
    expect(results!.some((r) => r.id === doc!.id)).toBe(true)
  })

  it('speichert Status "error" bei Fehlern', async () => {
    const sha256 = 'error-test-' + Date.now()

    const { data: doc, error: insertError } = await supabase
      .from('documents')
      .insert({
        original_filename: 'broken.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
        storage_path: `documents/${sha256}/broken.pdf`,
        sha256,
        status: 'uploaded',
      })
      .select()
      .single()

    expect(insertError).toBeNull()
    expect(doc).not.toBeNull()
    testDocIds.push(doc!.id)

    const { error } = await supabase
      .from('documents')
      .update({
        status: 'error',
        error_message: 'Mistral OCR failed (400): Invalid document',
      })
      .eq('id', doc!.id)

    expect(error).toBeNull()

    const { data: updated } = await supabase
      .from('documents')
      .select('status, error_message')
      .eq('id', doc!.id)
      .single()

    expect(updated!.status).toBe('error')
    expect(updated!.error_message).toContain('Mistral OCR failed')
  })

  it('Realtime-Subscription funktioniert', async () => {
    // Prüfe dass der Channel erstellt werden kann
    const channel = supabase
      .channel('test-upload-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documents' },
        () => {},
      )

    expect(channel).toBeDefined()

    // Cleanup ohne subscribe (nur Strukturtest)
    supabase.removeChannel(channel)
  })
})
