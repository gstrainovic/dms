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
  const mistralKey = Deno.env.get('MISTRAL_API_KEY')!

  try {
    const { message, history = [], filterDocumentType = null } = await req.json()

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Nachricht darf nicht leer sein' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 1. Query-Embedding generieren
    const embedResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [message],
      }),
    })

    if (!embedResponse.ok) {
      throw new Error(`Embedding failed: ${await embedResponse.text()}`)
    }

    const embedData = await embedResponse.json()
    const queryEmbedding = embedData.data[0].embedding

    // 2. Relevante Dokument-Chunks suchen
    const { data: searchResults } = await supabase.rpc('hybrid_search', {
      query_text: message,
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 5,
      fulltext_weight: 0.3,
      vector_weight: 0.7,
      filter_document_type: filterDocumentType,
    })

    // 3. Kontext zusammenbauen
    const context = (searchResults ?? [])
      .map((r: any, i: number) => `[Dokument ${i + 1}: "${r.title}" (${r.document_type || 'unbekannt'})]\n${r.excerpt}`)
      .join('\n\n')

    // 4. Chat mit Mistral
    const messages = [
      {
        role: 'system',
        content: `Du bist ein hilfreicher Assistent für ein Dokumenten-Management-System.
Du beantwortest Fragen basierend auf den dir bereitgestellten Dokumenten-Auszügen.
Wenn du keine relevante Information in den Dokumenten findest, sage das ehrlich.
Verweise auf konkrete Dokumente, wenn du Informationen aus ihnen zitierst.
Antworte auf Deutsch.

Verfügbare Dokument-Auszüge:
${context || 'Keine relevanten Dokumente gefunden.'}`,
      },
      ...history.slice(-10).map((h: any) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const chatResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages,
      }),
    })

    if (!chatResponse.ok) {
      throw new Error(`Chat failed: ${await chatResponse.text()}`)
    }

    const chatData = await chatResponse.json()
    const reply = chatData.choices[0].message.content

    // 5. Quellen zurückgeben
    const sources = (searchResults ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      documentType: r.document_type,
      score: r.score,
    }))

    return new Response(
      JSON.stringify({ reply, sources }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
