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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Keine Datei hochgeladen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // SHA-256 Duplikat-Check
    const fileBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
    const sha256 = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('sha256', sha256)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Dokument existiert bereits', existingId: existing.id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Storage Upload
    const storagePath = `documents/${sha256}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    // DB-Eintrag
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        sha256,
        status: 'uploaded',
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Trigger OCR-Verarbeitung asynchron (aber mit Error-Handling)
    const ocrUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-ocr`
    triggerNext(ocrUrl, doc.id, supabase)

    return new Response(
      JSON.stringify({ id: doc.id, status: 'uploaded' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
