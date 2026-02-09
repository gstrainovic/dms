import { withRetry } from './retry.js'

export interface OcrResult {
  text: string
  pages: OcrPage[]
  model: string
}

export interface OcrPage {
  pageNumber: number
  markdown: string
}

interface MistralOcrPage {
  markdown?: string
  tables?: { id: string; content: string }[]
}

function processPages(rawPages: MistralOcrPage[]): OcrPage[] {
  return rawPages.map((p, i) => {
    let md = p.markdown || ''
    if (p.tables?.length) {
      for (const tbl of p.tables) {
        md = md.replace(`[${tbl.id}](${tbl.id})`, tbl.content)
      }
    }
    return { pageNumber: i + 1, markdown: md }
  })
}

export async function callMistralOcr(
  imageBase64: string,
  apiKey: string,
  mimeType: string = 'image/jpeg',
): Promise<OcrResult> {
  return withRetry(async () => {
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'image_url',
          image_url: `data:${mimeType};base64,${imageBase64}`,
        },
        table_format: 'markdown',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Mistral OCR failed (${response.status}): ${error}`)
    }

    const data = await response.json()
    const pages = processPages(data.pages || [])

    return {
      text: pages.map((p) => p.markdown).join('\n\n'),
      pages,
      model: data.model,
    }
  })
}

export async function callMistralOcrPdf(
  pdfBase64: string,
  apiKey: string,
): Promise<OcrResult> {
  return withRetry(async () => {
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: `data:application/pdf;base64,${pdfBase64}`,
        },
        table_format: 'markdown',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Mistral OCR PDF failed (${response.status}): ${error}`)
    }

    const data = await response.json()
    const pages = processPages(data.pages || [])

    return {
      text: pages.map((p) => p.markdown).join('\n\n'),
      pages,
      model: data.model,
    }
  })
}
