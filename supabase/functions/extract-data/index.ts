import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Nächste Pipeline-Stufe triggern mit Fehlerbehandlung */
function triggerNext(url: string, documentId: string, supabase: SupabaseClient) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ documentId }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => 'unknown')
        throw new Error(`${url} antwortete mit ${res.status}: ${body}`)
      }
    })
    .catch(async (err) => {
      console.error(`Pipeline-Trigger fehlgeschlagen: ${err.message}`)
      await supabase
        .from('documents')
        .update({ status: 'error', error_message: `Pipeline-Trigger fehlgeschlagen: ${err.message}` })
        .eq('id', documentId)
    })
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
      .select('*')
      .eq('id', documentId)
      .single()

    if (!doc || !doc.ocr_text) throw new Error('Kein OCR-Text vorhanden')

    // Alle Schemas laden
    const { data: schemas } = await supabase
      .from('document_schemas')
      .select('*')

    const schemaList = (schemas ?? [])
      .map((s: any) => `- ${s.document_type}: ${s.description}`)
      .join('\n')

    // Schritt 1: Dokumenttyp erkennen
    const typeResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Du bist ein Dokumenten-Klassifizierer. Analysiere den Text und bestimme den Dokumenttyp.
Bekannte Typen:
${schemaList}
- other: Unbekannter Typ

Antworte als JSON: {"document_type": "...", "title": "...", "tags": ["tag1", "tag2"]}
- title: Kurzer beschreibender Titel
- tags: 2-5 relevante Tags`,
          },
          {
            role: 'user',
            content: doc.ocr_text.substring(0, 4000),
          },
        ],
      }),
    })

    if (!typeResponse.ok) throw new Error('Typ-Erkennung fehlgeschlagen')

    const typeResult = await typeResponse.json()
    const classification = JSON.parse(typeResult.choices[0].message.content)

    // Schema für den erkannten Typ finden
    const matchingSchema = (schemas ?? []).find(
      (s: any) => s.document_type === classification.document_type,
    )

    // Schritt 2: Felder extrahieren
    let extractedFields: Record<string, any> = {}

    if (matchingSchema) {
      const fieldNames = Object.keys(matchingSchema.schema.properties || {})
      const extractResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Extrahiere die folgenden Felder aus dem Dokument als JSON.
Felder: ${fieldNames.join(', ')}
Schema: ${JSON.stringify(matchingSchema.schema)}
Gib nur die gefundenen Felder zurück. Nutze null für nicht gefundene Felder.`,
            },
            {
              role: 'user',
              content: doc.ocr_text.substring(0, 8000),
            },
          ],
        }),
      })

      if (extractResponse.ok) {
        const extractResult = await extractResponse.json()
        extractedFields = JSON.parse(extractResult.choices[0].message.content)
      }
    } else {
      // Dynamischer Fallback: Felder automatisch erkennen
      const fallbackResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Extrahiere alle wichtigen Schlüssel-Wert-Paare aus diesem Dokument als flaches JSON-Objekt.
Beispiel: {"absender": "Max Mustermann", "datum": "2024-01-15", "betrag": "123.45"}
Maximal 10 Felder. Nutze deutsche Feldnamen in snake_case.`,
            },
            {
              role: 'user',
              content: doc.ocr_text.substring(0, 8000),
            },
          ],
        }),
      })

      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json()
        extractedFields = JSON.parse(fallbackResult.choices[0].message.content)
      }
    }

    // Dokument updaten
    await supabase
      .from('documents')
      .update({
        title: classification.title || doc.original_filename,
        document_type: classification.document_type,
        schema_id: matchingSchema?.id ?? null,
        status: 'extracted',
      })
      .eq('id', documentId)

    // Tags speichern
    for (const tagName of classification.tags ?? []) {
      // Tag erstellen oder finden
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .maybeSingle()

      const tagId = existingTag?.id ?? (
        await supabase.from('tags').insert({ name: tagName }).select('id').single()
      ).data?.id

      if (tagId) {
        await supabase
          .from('document_tags')
          .upsert({ document_id: documentId, tag_id: tagId, source: 'ai' })
      }
    }

    // Felder speichern
    const fieldInserts = Object.entries(extractedFields)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([key, value]) => ({
        document_id: documentId,
        field_name: key,
        field_value: String(value),
        field_type: typeof value === 'number' ? 'number' : 'text',
        source: 'ai' as const,
      }))

    if (fieldInserts.length) {
      await supabase.from('document_fields').upsert(fieldInserts, {
        onConflict: 'document_id,field_name',
      })
    }

    // Trigger embedding generation mit Fehlerbehandlung
    const embedUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embed`
    triggerNext(embedUrl, documentId, supabase)

    return new Response(
      JSON.stringify({
        status: 'extracted',
        documentType: classification.document_type,
        title: classification.title,
        tags: classification.tags,
        fields: Object.keys(extractedFields),
      }),
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
