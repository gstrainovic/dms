import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const {
      query,
      matchCount = 20,
      fulltextWeight = 0.4,
      vectorWeight = 0.6,
      filterDocumentType = null,
      filterTags = null,
    } = await req.json()

    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query darf nicht leer sein' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Query-Embedding generieren
    const embedResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [query],
      }),
    })

    if (!embedResponse.ok) {
      throw new Error(`Mistral Embed failed: ${await embedResponse.text()}`)
    }

    const embedData = await embedResponse.json()
    const queryEmbedding = embedData.data[0].embedding

    // Hybrid Search via DB-Funktion
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_text: query,
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: matchCount,
      fulltext_weight: fulltextWeight,
      vector_weight: vectorWeight,
      filter_document_type: filterDocumentType,
      filter_tags: filterTags,
    })

    if (error) throw new Error(`Search failed: ${error.message}`)

    return new Response(
      JSON.stringify({ results: data ?? [], query }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
