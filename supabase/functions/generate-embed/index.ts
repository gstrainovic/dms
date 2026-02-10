import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end))
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }

  return chunks
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const mistralKey = Deno.env.get('MISTRAL_API_KEY')
  if (!mistralKey) {
    return new Response(
      JSON.stringify({ error: 'MISTRAL_API_KEY ist nicht konfiguriert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let documentId: string | null = null

  try {
    const body = await req.json()
    documentId = body.documentId
    if (!documentId) throw new Error('documentId fehlt')

    const { data: doc } = await supabase
      .from('documents')
      .select('id, ocr_text')
      .eq('id', documentId)
      .single()

    if (!doc?.ocr_text) throw new Error('Kein OCR-Text vorhanden')

    // Alte Embeddings löschen
    await supabase
      .from('document_embeddings')
      .delete()
      .eq('document_id', documentId)

    // Text in Chunks aufteilen
    const chunks = chunkText(doc.ocr_text)

    // Embeddings generieren (batch)
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: chunks,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Mistral Embed failed: ${err}`)
    }

    const embedData = await response.json()

    // Embeddings speichern (pgvector erwartet '[x,y,z,...]' String-Format)
    const inserts = embedData.data.map((item: any, index: number) => ({
      document_id: documentId,
      chunk_index: index,
      chunk_text: chunks[index],
      embedding: JSON.stringify(item.embedding),
    }))

    const { error: insertError } = await supabase
      .from('document_embeddings')
      .insert(inserts)

    if (insertError) throw insertError

    // Status auf "ready" setzen
    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', documentId)

    return new Response(
      JSON.stringify({ status: 'ready', chunks: chunks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    if (documentId) {
      await supabase
        .from('documents')
        .update({ status: 'error', error_message: error.message })
        .eq('id', documentId)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
