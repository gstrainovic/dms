import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'update_document_title',
      description: 'Aktualisiert den Titel eines Dokuments.',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'Die UUID des Dokuments.' },
          new_title: { type: 'string', description: 'Der neue Titel.' }
        },
        required: ['document_id', 'new_title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_tag',
      description: 'Fügt einem Dokument ein Schlagwort (Tag) hinzu. Erstellt das Tag, falls es noch nicht existiert.',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'Die UUID des Dokuments.' },
          tag_name: { type: 'string', description: 'Der Name des Schlagworts (z.B. "Privat", "Wichtig", "Steuern").' }
        },
        required: ['document_id', 'tag_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_tag',
      description: 'Entfernt ein Schlagwort (Tag) von einem Dokument.',
      parameters: {
        type: 'object',
        properties: {
          document_id: { type: 'string', description: 'Die UUID des Dokuments.' },
          tag_name: { type: 'string', description: 'Der Name des Schlagworts.' }
        },
        required: ['document_id', 'tag_name']
      }
    }
  }
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const mistralKey = Deno.env.get('MISTRAL_API_KEY')
  if (!mistralKey) {
    return new Response(
      JSON.stringify({ error: 'MISTRAL_API_KEY ist nicht konfiguriert' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Nicht authentifiziert' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

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
      match_count: 8, // Mehr Chunks für besseren Kontext
      fulltext_weight: 0.3,
      vector_weight: 0.7,
      filter_document_type: filterDocumentType,
    })

    // 3. Kontext zusammenbauen
    const docMap = new Map<string, { id: string; title: string; type: string; excerpts: string[]; tags: string[] }>()
    for (const r of searchResults ?? []) {
      const existing = docMap.get(r.id)
      if (existing) {
        existing.excerpts.push(r.excerpt)
      } else {
        docMap.set(r.id, { 
          id: r.id, 
          title: r.title, 
          type: r.document_type || 'unbekannt', 
          excerpts: [r.excerpt],
          tags: r.tags || []
        })
      }
    }
    const context = Array.from(docMap.values())
      .map((doc) => `[ID: ${doc.id}] Dokument: "${doc.title}" (Typ: ${doc.type}, Tags: ${doc.tags.join(', ')})\n${doc.excerpts.join('\n---\n')}`)
      .join('\n\n')

    // 4. Chat mit Mistral
    const messages = [
      {
        role: 'system',
        content: `Du bist ein hilfreicher Assistent für ein Dokumenten-Management-System (DMS).
Du beantwortest Fragen basierend auf den dir bereitgestellten Dokumenten-Auszügen.
Du kannst Dokumente verwalten (Titel ändern, Tags hinzufügen/entfernen).

Regeln:
- Antworte auf Deutsch.
- Wenn du eine Information nicht in den Dokumenten findest, sage das.
- Nenne Dokumente beim Titel, wenn du Informationen daraus verwendest.
- Wenn der User dich bittet, etwas zu ändern (z.B. "Nenne das Dokument XY um" oder "Füge Tag Z zu Dokument W hinzu"), nutze die entsprechenden Tools.
- Nutze die Dokument-IDs aus dem Kontext für die Tool-Aufrufe.

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
        tools: TOOLS,
        tool_choice: 'auto'
      }),
    })

    if (!chatResponse.ok) {
      throw new Error(`Chat failed: ${await chatResponse.text()}`)
    }

    let chatData = await chatResponse.json()
    let responseMessage = chatData.choices[0].message

    // 5. Tool Calls verarbeiten
    if (responseMessage.tool_calls) {
      const toolResults = []
      
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)
        let result = { success: false, message: '' }

        try {
          if (functionName === 'update_document_title') {
            const { error } = await supabase
              .from('documents')
              .update({ title: args.new_title })
              .eq('id', args.document_id)
            
            if (error) throw error
            result = { success: true, message: `Titel wurde auf "${args.new_title}" aktualisiert.` }
          } 
          else if (functionName === 'add_tag') {
            // Tag finden oder erstellen
            let { data: tag, error: tagErr } = await supabase
              .from('tags')
              .select('id')
              .eq('name', args.tag_name)
              .maybeSingle()
            
            if (!tag) {
              const { data: newTag, error: insErr } = await supabase
                .from('tags')
                .insert({ name: args.tag_name, user_id: user.id })
                .select()
                .single()
              if (insErr) throw insErr
              tag = newTag
            }

            // Verknüpfung erstellen
            const { error: linkErr } = await supabase
              .from('document_tags')
              .upsert({ document_id: args.document_id, tag_id: tag.id, source: 'manual' })
            
            if (linkErr) throw linkErr
            result = { success: true, message: `Tag "${args.tag_name}" wurde hinzugefügt.` }
          }
          else if (functionName === 'remove_tag') {
            const { data: tag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', args.tag_name)
              .maybeSingle()
            
            if (tag) {
              const { error } = await supabase
                .from('document_tags')
                .delete()
                .eq('document_id', args.document_id)
                .eq('tag_id', tag.id)
              
              if (error) throw error
              result = { success: true, message: `Tag "${args.tag_name}" wurde entfernt.` }
            } else {
              result = { success: false, message: `Tag "${args.tag_name}" nicht gefunden.` }
            }
          }
        } catch (e) {
          result = { success: false, message: `Fehler: ${e.message}` }
        }

        toolResults.push({
          role: 'tool',
          name: functionName,
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        })
      }

      // Finalen Response mit Tool-Ergebnissen einholen
      const finalResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            ...messages,
            responseMessage,
            ...toolResults
          ]
        }),
      })

      if (!finalResponse.ok) {
        throw new Error(`Final chat failed: ${await finalResponse.text()}`)
      }

      chatData = await finalResponse.json()
      responseMessage = chatData.choices[0].message
    }

    const reply = responseMessage.content

    // 6. Quellen zurückgeben
    const sourceMap = new Map<string, { id: string; title: string; documentType: string; score: number }>()
    for (const r of searchResults ?? []) {
      const existing = sourceMap.get(r.id)
      if (!existing || r.score > existing.score) {
        sourceMap.set(r.id, { id: r.id, title: r.title, documentType: r.document_type, score: r.score })
      }
    }
    const sources = Array.from(sourceMap.values())

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
