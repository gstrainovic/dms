import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

describe('Supabase CRUD', () => {
  let supabase: SupabaseClient
  let testDocId: string
  let testTagId: string

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  })

  afterAll(async () => {
    // Cleanup
    if (testDocId) {
      await supabase.from('document_tags').delete().eq('document_id', testDocId)
      await supabase.from('document_fields').delete().eq('document_id', testDocId)
      await supabase.from('document_embeddings').delete().eq('document_id', testDocId)
      await supabase.from('documents').delete().eq('id', testDocId)
    }
    if (testTagId) {
      await supabase.from('tags').delete().eq('id', testTagId)
    }
  })

  it('verbindet zu Supabase', async () => {
    const { data, error } = await supabase.from('documents').select('count')
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('erstellt ein Dokument', async () => {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        original_filename: 'test.pdf',
        mime_type: 'application/pdf',
        file_size: 12345,
        storage_path: 'test/test.pdf',
        sha256: 'abc123def456' + Date.now(),
        status: 'uploaded',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data!.id).toBeDefined()
    expect(data!.original_filename).toBe('test.pdf')
    expect(data!.status).toBe('uploaded')
    testDocId = data!.id
  })

  it('liest ein Dokument', async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', testDocId)
      .single()

    expect(error).toBeNull()
    expect(data!.original_filename).toBe('test.pdf')
  })

  it('aktualisiert ein Dokument', async () => {
    const { data, error } = await supabase
      .from('documents')
      .update({ title: 'Test Dokument', status: 'processing' })
      .eq('id', testDocId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.title).toBe('Test Dokument')
    expect(data!.status).toBe('processing')
  })

  it('erstellt einen Tag', async () => {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name: 'test-tag-' + Date.now(), color: '#ff0000' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.id).toBeDefined()
    testTagId = data!.id
  })

  it('verknüpft Tag mit Dokument', async () => {
    const { error } = await supabase
      .from('document_tags')
      .insert({
        document_id: testDocId,
        tag_id: testTagId,
        confidence: 0.95,
        source: 'ai',
      })

    expect(error).toBeNull()
  })

  it('erstellt extrahierte Felder', async () => {
    const { error } = await supabase
      .from('document_fields')
      .insert([
        {
          document_id: testDocId,
          field_name: 'betrag',
          field_value: '42.50',
          field_type: 'currency',
          source: 'ai',
        },
        {
          document_id: testDocId,
          field_name: 'datum',
          field_value: '2026-02-08',
          field_type: 'date',
          source: 'ai',
        },
      ])

    expect(error).toBeNull()
  })

  it('liest Dokument mit Feldern', async () => {
    const { data: fields, error } = await supabase
      .from('document_fields')
      .select('*')
      .eq('document_id', testDocId)

    expect(error).toBeNull()
    expect(fields).toHaveLength(2)
    expect(fields!.map((f) => f.field_name).sort()).toEqual(['betrag', 'datum'])
  })

  it('liest vordefinierte Schemas', async () => {
    const { data, error } = await supabase
      .from('document_schemas')
      .select('*')

    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(3)
    const types = data!.map((s) => s.document_type)
    expect(types).toContain('invoice')
    expect(types).toContain('contract')
    expect(types).toContain('medical_letter')
  })

  it('löscht ein Dokument (kaskadiert)', async () => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', testDocId)

    expect(error).toBeNull()

    // Verifiziere Kaskade
    const { data: fields } = await supabase
      .from('document_fields')
      .select('*')
      .eq('document_id', testDocId)

    expect(fields).toHaveLength(0)

    const { data: tags } = await supabase
      .from('document_tags')
      .select('*')
      .eq('document_id', testDocId)

    expect(tags).toHaveLength(0)

    testDocId = '' // Prevent double-delete in afterAll
  })
})
