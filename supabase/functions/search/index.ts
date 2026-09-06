import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { aiFetchAsUser, aiJson, AiProxyError } from '../_shared/ai-proxy.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  // User-scoped client for RPC (hybrid_search uses auth.uid())
  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Nicht authentifiziert' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
    const embedResponse = await aiFetchAsUser('/v1/embeddings', authHeader, { model: 'mistral-embed', input: [query] })
    const embedData = await aiJson(embedResponse, 'Mistral Embed')
    const queryEmbedding = embedData.data[0].embedding

    // Hybrid Search via DB-Funktion (user-scoped through auth.uid())
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
    // 402 = Monatslimit erreicht: Meldung und Status unverändert ans Frontend
    const status = error instanceof AiProxyError ? error.status : 500
    return new Response(
      JSON.stringify({ error: error.message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
