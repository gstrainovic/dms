import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

describe('Auto-Tagging + Schema-Extraktion', () => {
  let supabase: SupabaseClient
  const testDocIds: string[] = []
  const testTagIds: string[] = []

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  })

  afterAll(async () => {
    // Cleanup in richtiger Reihenfolge (FK-Constraints)
    for (const id of testDocIds) {
      await supabase.from('document_fields').delete().eq('document_id', id)
      await supabase.from('document_tags').delete().eq('document_id', id)
      await supabase.from('document_embeddings').delete().eq('document_id', id)
      await supabase.from('documents').delete().eq('id', id)
    }
    for (const id of testTagIds) {
      await supabase.from('document_tags').delete().eq('tag_id', id)
      await supabase.from('tags').delete().eq('id', id)
    }
  })

  // --- Tag CRUD ---

  it('erstellt Tag mit Name und Farbe', async () => {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name: 'Rechnung-Test', color: '#FF5733' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.name).toBe('Rechnung-Test')
    expect(data!.color).toBe('#FF5733')
    testTagIds.push(data!.id)
  })

  it('verhindert doppelte Tag-Namen', async () => {
    const name = 'unique-tag-' + Date.now()

    const { data: first } = await supabase
      .from('tags')
      .insert({ name })
      .select()
      .single()
    testTagIds.push(first!.id)

    const { error } = await supabase
      .from('tags')
      .insert({ name })
      .select()
      .single()

    expect(error).not.toBeNull()
  })

  // --- Tag ↔ Document Zuordnung ---

  it('verknüpft Tags mit Dokumenten (AI-Source)', async () => {
    const sha256 = 'tag-link-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'tagged.pdf',
        mime_type: 'application/pdf',
        file_size: 1024,
        storage_path: `documents/${sha256}/tagged.pdf`,
        sha256,
        status: 'extracted',
      })
      .select()
      .single()
    testDocIds.push(doc!.id)

    const { data: tag } = await supabase
      .from('tags')
      .insert({ name: 'ai-tag-' + Date.now() })
      .select()
      .single()
    testTagIds.push(tag!.id)

    const { error } = await supabase.from('document_tags').insert({
      document_id: doc!.id,
      tag_id: tag!.id,
      source: 'ai',
      confidence: 0.92,
    })

    expect(error).toBeNull()

    // Verifikation: Tag über Join laden
    const { data: linked } = await supabase
      .from('document_tags')
      .select('source, confidence, tags(name)')
      .eq('document_id', doc!.id)

    expect(linked).not.toBeNull()
    expect(linked!.length).toBe(1)
    expect(linked![0].source).toBe('ai')
    expect(linked![0].confidence).toBe(0.92)
  })

  it('verknüpft Tags manuell (user-Source)', async () => {
    const sha256 = 'manual-tag-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'manual-tagged.pdf',
        mime_type: 'application/pdf',
        file_size: 512,
        storage_path: `documents/${sha256}/manual.pdf`,
        sha256,
        status: 'ready',
      })
      .select()
      .single()
    testDocIds.push(doc!.id)

    const { data: tag } = await supabase
      .from('tags')
      .insert({ name: 'manual-tag-' + Date.now() })
      .select()
      .single()
    testTagIds.push(tag!.id)

    const { error } = await supabase.from('document_tags').insert({
      document_id: doc!.id,
      tag_id: tag!.id,
      source: 'manual',
    })

    expect(error).toBeNull()
  })

  it('entfernt Tag-Zuordnung', async () => {
    const sha256 = 'remove-tag-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'removable.pdf',
        mime_type: 'application/pdf',
        file_size: 256,
        storage_path: `documents/${sha256}/removable.pdf`,
        sha256,
        status: 'ready',
      })
      .select()
      .single()
    testDocIds.push(doc!.id)

    const { data: tag } = await supabase
      .from('tags')
      .insert({ name: 'remove-me-' + Date.now() })
      .select()
      .single()
    testTagIds.push(tag!.id)

    await supabase.from('document_tags').insert({
      document_id: doc!.id,
      tag_id: tag!.id,
      source: 'manual',
    })

    const { error } = await supabase
      .from('document_tags')
      .delete()
      .eq('document_id', doc!.id)
      .eq('tag_id', tag!.id)

    expect(error).toBeNull()

    const { data: remaining } = await supabase
      .from('document_tags')
      .select('tag_id')
      .eq('document_id', doc!.id)

    expect(remaining!.length).toBe(0)
  })

  // --- Document Fields (Schema-Extraktion) ---

  it('speichert extrahierte Felder', async () => {
    const sha256 = 'fields-test-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'invoice.pdf',
        mime_type: 'application/pdf',
        file_size: 4096,
        storage_path: `documents/${sha256}/invoice.pdf`,
        sha256,
        status: 'extracted',
        document_type: 'invoice',
        ocr_text: 'Rechnung Nr. 2024-001, Betrag: 250,00 EUR',
      })
      .select()
      .single()
    testDocIds.push(doc!.id)

    const fields = [
      { document_id: doc!.id, field_name: 'rechnungsnummer', field_value: '2024-001', field_type: 'text', source: 'ai' },
      { document_id: doc!.id, field_name: 'betrag', field_value: '250.00', field_type: 'number', source: 'ai' },
      { document_id: doc!.id, field_name: 'waehrung', field_value: 'EUR', field_type: 'text', source: 'ai' },
    ]

    const { error } = await supabase.from('document_fields').insert(fields)
    expect(error).toBeNull()

    const { data: saved } = await supabase
      .from('document_fields')
      .select('field_name, field_value, field_type, source')
      .eq('document_id', doc!.id)
      .order('field_name')

    expect(saved!.length).toBe(3)
    expect(saved![0].field_name).toBe('betrag')
    expect(saved![0].field_value).toBe('250.00')
    expect(saved![0].field_type).toBe('number')
    expect(saved![0].source).toBe('ai')
  })

  it('aktualisiert Felder manuell', async () => {
    const sha256 = 'update-field-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'editable.pdf',
        mime_type: 'application/pdf',
        file_size: 1024,
        storage_path: `documents/${sha256}/editable.pdf`,
        sha256,
        status: 'extracted',
      })
      .select()
      .single()
    testDocIds.push(doc!.id)

    // AI-extrahiertes Feld
    await supabase.from('document_fields').insert({
      document_id: doc!.id,
      field_name: 'absender',
      field_value: 'Max Muster',
      source: 'ai',
    })

    // User korrigiert
    const { error } = await supabase
      .from('document_fields')
      .update({ field_value: 'Max Mustermann', source: 'manual' as const })
      .eq('document_id', doc!.id)
      .eq('field_name', 'absender')

    expect(error).toBeNull()

    const { data: updated } = await supabase
      .from('document_fields')
      .select('field_value, source')
      .eq('document_id', doc!.id)
      .eq('field_name', 'absender')
      .single()

    expect(updated!.field_value).toBe('Max Mustermann')
    expect(updated!.source).toBe('manual')
  })

  // --- Document Schemas ---

  it('lädt vordefinierte Schemas', async () => {
    const { data, error } = await supabase
      .from('document_schemas')
      .select('document_type, name, schema')
      .order('document_type')

    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(3)

    const types = data!.map((s) => s.document_type)
    expect(types).toContain('invoice')
    expect(types).toContain('contract')
    expect(types).toContain('medical_letter')
  })

  it('ordnet Schema einem Dokument zu', async () => {
    const sha256 = 'schema-link-' + Date.now()

    const { data: schema } = await supabase
      .from('document_schemas')
      .select('id')
      .eq('document_type', 'invoice')
      .single()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'invoice-schema.pdf',
        mime_type: 'application/pdf',
        file_size: 2048,
        storage_path: `documents/${sha256}/invoice-schema.pdf`,
        sha256,
        status: 'extracted',
        document_type: 'invoice',
        schema_id: schema!.id,
      })
      .select('id, document_type, schema_id')
      .single()
    testDocIds.push(doc!.id)

    expect(doc!.document_type).toBe('invoice')
    expect(doc!.schema_id).toBe(schema!.id)
  })

  it('erstellt benutzerdefiniertes Schema', async () => {
    const { data, error } = await supabase
      .from('document_schemas')
      .insert({
        document_type: 'custom_test_' + Date.now(),
        name: 'Test-Schema',
        description: 'Automatisch erstelltes Test-Schema',
        schema: {
          type: 'object',
          properties: {
            titel: { type: 'string', description: 'Dokumenttitel' },
            datum: { type: 'string', description: 'Datum' },
          },
        },
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data!.name).toBe('Test-Schema')

    // Cleanup
    await supabase.from('document_schemas').delete().eq('id', data!.id)
  })

  // --- Filtern nach Tags ---

  it('filtert Dokumente nach Tag', async () => {
    const sha256 = 'filter-tag-' + Date.now()
    const tagName = 'filter-test-' + Date.now()

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'filterable.pdf',
        mime_type: 'application/pdf',
        file_size: 512,
        storage_path: `documents/${sha256}/filterable.pdf`,
        sha256,
        status: 'ready',
      })
      .select()
      .single()
    testDocIds.push(doc!.id)

    const { data: tag } = await supabase
      .from('tags')
      .insert({ name: tagName, color: '#00FF00' })
      .select()
      .single()
    testTagIds.push(tag!.id)

    await supabase.from('document_tags').insert({
      document_id: doc!.id,
      tag_id: tag!.id,
      source: 'manual',
    })

    // Filtern: Dokumente die den Tag haben (über document_tags als Filter)
    const { data: filtered, error: filterError } = await supabase
      .from('document_tags')
      .select('document_id')
      .eq('tag_id', tag!.id)

    expect(filterError).toBeNull()
    expect(filtered!.length).toBe(1)
    expect(filtered![0].document_id).toBe(doc!.id)
  })
})
