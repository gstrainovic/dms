import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

describe('Suche', () => {
  let supabase: SupabaseClient
  const testDocIds: string[] = []

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Test-Dokumente mit OCR-Text für Volltextsuche anlegen
    const docs = [
      {
        original_filename: 'rechnung-2024.pdf',
        mime_type: 'application/pdf',
        file_size: 4096,
        storage_path: 'documents/search-test-1/rechnung.pdf',
        sha256: 'search-fulltext-1-' + Date.now(),
        status: 'ready',
        title: 'Rechnung von Stadtwerke München',
        ocr_text: 'Stadtwerke München GmbH. Rechnung für Stromlieferung. Rechnungsnummer: SM-2024-001. Betrag: 127,50 EUR.',
        document_type: 'invoice',
      },
      {
        original_filename: 'vertrag-mietvertrag.pdf',
        mime_type: 'application/pdf',
        file_size: 8192,
        storage_path: 'documents/search-test-2/vertrag.pdf',
        sha256: 'search-fulltext-2-' + Date.now(),
        status: 'ready',
        title: 'Mietvertrag Wohnung Schwabing',
        ocr_text: 'Mietvertrag zwischen Vermieter Hans Schmidt und Mieter Anna Müller. Objekt: 3-Zimmer-Wohnung in München-Schwabing. Kaltmiete: 1.200 EUR monatlich.',
        document_type: 'contract',
      },
      {
        original_filename: 'arztbrief.pdf',
        mime_type: 'application/pdf',
        file_size: 2048,
        storage_path: 'documents/search-test-3/arztbrief.pdf',
        sha256: 'search-fulltext-3-' + Date.now(),
        status: 'ready',
        title: 'Arztbrief Dr. Weber',
        ocr_text: 'Dr. med. Weber, Praxis für Innere Medizin. Diagnose: Grippaler Infekt. Therapie: Bettruhe und Ibuprofen.',
        document_type: 'medical_letter',
      },
    ]

    for (const doc of docs) {
      const { data, error } = await supabase
        .from('documents')
        .insert(doc)
        .select('id')
        .single()
      if (error) throw error
      testDocIds.push(data!.id)
    }
  })

  afterAll(async () => {
    for (const id of testDocIds) {
      await supabase.from('document_embeddings').delete().eq('document_id', id)
      await supabase.from('document_fields').delete().eq('document_id', id)
      await supabase.from('document_tags').delete().eq('document_id', id)
      await supabase.from('documents').delete().eq('id', id)
    }
  })

  // --- Volltext-Suche (deutsche Konfiguration) ---

  it('findet Dokumente per Volltext (deutsch)', async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title')
      .textSearch('fts', 'Rechnung', { type: 'websearch', config: 'german' })

    expect(error).toBeNull()
    expect(data!.some((d) => d.id === testDocIds[0])).toBe(true)
  })

  it('Volltextsuche findet nach Wörtern im OCR-Text', async () => {
    const { data } = await supabase
      .from('documents')
      .select('id, title')
      .textSearch('fts', 'München', { type: 'websearch', config: 'german' })

    expect(data!.length).toBeGreaterThanOrEqual(2) // Rechnung + Vertrag
  })

  it('Volltext liefert keine Ergebnisse für unbekannte Begriffe', async () => {
    const { data } = await supabase
      .from('documents')
      .select('id, title')
      .textSearch('fts', 'Zypern Elefant', { type: 'websearch', config: 'german' })

    const testResults = data!.filter((d) => testDocIds.includes(d.id))
    expect(testResults.length).toBe(0)
  })

  // --- hybrid_search RPC ---

  it('hybrid_search RPC mit Dummy-Embedding liefert Volltext-Ergebnisse', async () => {
    // Null-Embedding (1024 Nullen) → Vector-Rank ist 0, nur Fulltext zählt
    const zeroEmbedding = JSON.stringify(new Array(1024).fill(0))

    const { data, error } = await supabase.rpc('hybrid_search', {
      query_text: 'Stromlieferung Rechnung',
      query_embedding: zeroEmbedding,
      match_count: 10,
      fulltext_weight: 1.0,
      vector_weight: 0.0,
    })

    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(1)
    expect(data![0].title).toContain('Rechnung')
  })

  it('hybrid_search kann nach document_type filtern', async () => {
    const zeroEmbedding = JSON.stringify(new Array(1024).fill(0))

    const { data, error } = await supabase.rpc('hybrid_search', {
      query_text: 'München',
      query_embedding: zeroEmbedding,
      match_count: 10,
      fulltext_weight: 1.0,
      vector_weight: 0.0,
      filter_document_type: 'contract',
    })

    expect(error).toBeNull()
    // Nur Verträge, keine Rechnungen
    for (const result of data!) {
      expect(result.document_type).toBe('contract')
    }
  })

  // --- Suche mit Filterung ---

  it('kombiniert Volltextsuche mit Status-Filter', async () => {
    const { data } = await supabase
      .from('documents')
      .select('id, title, status')
      .textSearch('fts', 'München', { type: 'websearch', config: 'german' })
      .eq('status', 'ready')

    expect(data!.length).toBeGreaterThanOrEqual(1)
    for (const doc of data!) {
      expect(doc.status).toBe('ready')
    }
  })
})
