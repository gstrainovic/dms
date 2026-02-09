import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OcrPage {
  markdown?: string
  tables?: { id: string; content: string }[]
}

function processPages(rawPages: OcrPage[]): string[] {
  return rawPages.map((p) => {
    let md = p.markdown || ''
    if (p.tables?.length) {
      for (const tbl of p.tables) {
        md = md.replace(`[${tbl.id}](${tbl.id})`, tbl.content)
      }
    }
    return md
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
  const mistralKey = Deno.env.get('MISTRAL_API_KEY')!

  let documentId: string | null = null

  try {
    const body = await req.json()
    documentId = body.documentId

    if (!documentId) throw new Error('documentId fehlt')

    // Status auf "processing" setzen
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // Dokument laden
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (!doc) throw new Error('Dokument nicht gefunden')

    // Datei aus Storage laden
    const { data: fileData } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (!fileData) throw new Error('Datei nicht gefunden')

    const buffer = await fileData.arrayBuffer()
    const uint8 = new Uint8Array(buffer)

    // Base64-Encoding in Chunks (vermeidet Stack Overflow bei großen Dateien)
    let base64 = ''
    const chunkSize = 32768
    for (let i = 0; i < uint8.length; i += chunkSize) {
      base64 += btoa(String.fromCharCode(...uint8.subarray(i, i + chunkSize)))
    }

    let ocrText: string
    let pageCount: number

    const isPdf = doc.mime_type === 'application/pdf'
    const ocrPayload = isPdf
      ? {
          model: 'mistral-ocr-latest',
          document: { type: 'document_url', document_url: `data:application/pdf;base64,${base64}` },
          table_format: 'markdown',
        }
      : {
          model: 'mistral-ocr-latest',
          document: { type: 'image_url', image_url: `data:${doc.mime_type};base64,${base64}` },
          table_format: 'markdown',
        }

    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify(ocrPayload),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Mistral OCR failed (${response.status}): ${err}`)
    }

    const data = await response.json()
    const pages = processPages(data.pages || [])
    pageCount = pages.length
    ocrText = pages.join('\n\n')

    // OCR-Text speichern
    await supabase
      .from('documents')
      .update({
        ocr_text: ocrText,
        page_count: pageCount,
        status: 'ocr_done',
      })
      .eq('id', documentId)

    // Trigger extract-data asynchron
    const extractUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/extract-data`
    fetch(extractUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ documentId }),
    }).catch(console.error)

    return new Response(
      JSON.stringify({ status: 'ocr_done', pageCount }),
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
