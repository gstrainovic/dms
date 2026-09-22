/**
 * OCR-Vergleich: Mistral OCR gegen Vision-Modelle, die Schweizer Anbieter hosten (Infomaniak, kvant/Phoeniqs).
 * Gemessen wird die Modellqualität. Die offenen Modelle laufen dafür über OpenRouter mit denselben Gewichten; die
 * Kosten pro Seite rechnet summary.ts danach mit den Preislisten der Schweizer Anbieter.
 *
 *   node scripts/ocr-benchmark/run.ts                       # alle Modelle, alle Seiten, sauber und verzerrt
 *   node scripts/ocr-benchmark/run.ts --models=mistral-ocr  # nur ausgewählte Modelle
 *
 * Braucht MISTRAL_API_KEY (aus .env) und OPENROUTER_API_KEY. Ausgaben landen in .cache/ (gitignored),
 * die Auswertung in results.json.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEST_PAGES, type TestPage } from './testset.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const cache = path.join(here, '.cache')

export interface ModelSpec {
  id: string
  /** Wie das Modell bei den Schweizer Anbietern heisst bzw. wofür es steht */
  label: string
  api: 'mistral-ocr' | 'mistral-chat' | 'openrouter'
  model: string
}

export const MODELS: ModelSpec[] = [
  { id: 'mistral-ocr', label: 'Mistral OCR 4.1 (Referenz)', api: 'mistral-ocr', model: 'mistral-ocr-latest' },
  { id: 'mistral-ocr-3', label: 'Mistral OCR 3 (halber Preis)', api: 'mistral-ocr', model: 'mistral-ocr-2512' },
  // Label: Modell, Schweizer Anbieter, bei dem es im Angebot ist, und wo es für die Messung tatsächlich lief
  { id: 'mistral-small', label: 'Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral)', api: 'mistral-chat', model: 'mistral-small-latest' },
  { id: 'ministral-14b', label: 'Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral)', api: 'mistral-chat', model: 'ministral-14b-2512' },
  { id: 'qwen3-vl-235b', label: 'Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter)', api: 'openrouter', model: 'qwen/qwen3-vl-235b-a22b-instruct' },
  { id: 'qwen3-vl-32b', label: 'Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter)', api: 'openrouter', model: 'qwen/qwen3-vl-32b-instruct' },
  { id: 'qwen3-vl-8b', label: 'Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter)', api: 'openrouter', model: 'qwen/qwen3-vl-8b-instruct' },
  { id: 'qwen3.5-122b', label: 'Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter)', api: 'openrouter', model: 'qwen/qwen3.5-122b-a10b' },
  { id: 'gemma-4-31b', label: 'Gemma 4 31B (Angebot kvant, gemessen über OpenRouter)', api: 'openrouter', model: 'google/gemma-4-31b-it' },
  { id: 'llama-4-maverick', label: 'Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter)', api: 'openrouter', model: 'meta-llama/llama-4-maverick' },
  { id: 'llama-4-scout', label: 'Llama 4 Scout (Angebot kvant, gemessen über OpenRouter)', api: 'openrouter', model: 'meta-llama/llama-4-scout' },
]

const PROMPT = `Transkribiere den gesamten Text dieses Dokuments exakt als Markdown.
Tabellen als Markdown-Tabellen, Lesereihenfolge von oben nach unten.
Nichts hinzufügen, nichts weglassen, nichts korrigieren oder übersetzen. Keine Erklärungen, nur der Text.`

export interface RunResult {
  model: string
  page: string
  variant: 'sauber' | 'verzerrt' | 'echt'
  text: string
  ms: number
  inputTokens?: number
  outputTokens?: number
  pages?: number
  costUsd?: number
  error?: string
}

function loadEnv() {
  const file = path.resolve(here, '../../.env')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

/**
 * Seite als PNG (sauber) und als verzerrtes JPEG (schief, unscharf, verrauscht, stark komprimiert).
 * Echte Handyfotos (12 MP) werden nur auf 2000 px an der langen Seite verkleinert, wie ein Upload aus der App.
 */
function prepareImages(page: TestPage): Partial<Record<RunResult['variant'], string>> {
  const dir = path.join(cache, 'images')
  fs.mkdirSync(dir, { recursive: true })
  if (page.real) {
    const photo = path.join(dir, `${page.id}.jpg`)
    if (!fs.existsSync(photo))
      execFileSync('magick', [page.source, '-auto-orient', '-resize', '2000x2000>', '-quality', '85', photo])
    return { echt: photo }
  }
  const clean = path.join(dir, `${page.id}.png`)
  if (!fs.existsSync(clean)) {
    if (page.pdfPage) {
      const prefix = path.join(dir, `${page.id}-raster`)
      execFileSync('pdftoppm', ['-r', '150', '-png', '-singlefile', '-f', String(page.pdfPage), '-l', String(page.pdfPage), page.source, prefix])
      fs.renameSync(`${prefix}.png`, clean)
    }
    else {
      execFileSync('magick', [page.source, clean])
    }
  }
  const distorted = path.join(dir, `${page.id}-verzerrt.jpg`)
  if (!fs.existsSync(distorted)) {
    execFileSync('magick', [clean, '-background', 'white', '-rotate', '2.5', '-resize', '70%', '-blur', '0x1.2',
      '-attenuate', '0.5', '+noise', 'Gaussian', '-quality', '45', distorted])
  }
  return { sauber: clean, verzerrt: distorted }
}

function dataUrl(file: string): string {
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
}

async function postJson(url: string, key: string, body: unknown): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    })
    if (res.ok) return res.json()
    const text = await res.text()
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await new Promise(r => setTimeout(r, 5000 * (attempt + 1)))
      continue
    }
    throw new Error(`${res.status}: ${text.slice(0, 300)}`)
  }
}

async function runOne(spec: ModelSpec, image: string): Promise<Omit<RunResult, 'model' | 'page' | 'variant' | 'ms'>> {
  const image_url = dataUrl(image)
  if (spec.api === 'mistral-ocr') {
    const data = await postJson('https://api.mistral.ai/v1/ocr', process.env.MISTRAL_API_KEY!, {
      model: spec.model,
      document: { type: 'image_url', image_url },
    })
    return { text: data.pages.map((p: any) => p.markdown).join('\n\n'), pages: data.usage_info?.pages_processed }
  }
  const messages = [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: image_url } }] }]
  const [url, key, extra] = spec.api === 'mistral-chat'
    ? ['https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_API_KEY!, {}]
    : ['https://openrouter.ai/api/v1/chat/completions', process.env.OPENROUTER_API_KEY!, { usage: { include: true } }]
  const data = await postJson(url, key, { model: spec.model, messages, temperature: 0, max_tokens: 4096, ...extra })
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    inputTokens: data.usage?.prompt_tokens,
    outputTokens: data.usage?.completion_tokens,
    costUsd: data.usage?.cost,
  }
}

async function pool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  const queue = [...items]
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await worker(queue.shift()!)
  }))
}

async function main() {
  loadEnv()
  const only = process.argv.find(a => a.startsWith('--models='))?.slice(9).split(',')
  const onlyPages = process.argv.find(a => a.startsWith('--pages='))?.slice(8).split(',')
  const models = MODELS.filter(m => !only || only.includes(m.id))
  const pages = TEST_PAGES.filter(p => !onlyPages || onlyPages.includes(p.id))
  const resultsFile = path.join(cache, 'results.json')
  const previous: RunResult[] = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : []
  const results = previous.filter(r => !models.some(m => m.id === r.model) || !pages.some(p => p.id === r.page))

  const jobs = pages.flatMap(page => {
    const images = prepareImages(page)
    // Der Fahrzeugausweis ist schon ein echter Scan, eine zusätzliche Verzerrung wäre doppelt
    const variants: RunResult['variant'][] = page.real ? ['echt'] : page.id === 'fahrzeugausweis' ? ['sauber'] : ['sauber', 'verzerrt']
    return models.flatMap(spec => variants.map(variant => ({ spec, page, variant, image: images[variant]! })))
  })

  let done = 0
  await pool(jobs, 4, async ({ spec, page, variant, image }) => {
    const started = Date.now()
    let result: RunResult
    try {
      result = { model: spec.id, page: page.id, variant, ...(await runOne(spec, image)), ms: Date.now() - started }
    }
    catch (err) {
      result = { model: spec.id, page: page.id, variant, text: '', ms: Date.now() - started, error: (err as Error).message }
    }
    results.push(result)
    const out = path.join(cache, 'outputs', spec.id)
    fs.mkdirSync(out, { recursive: true })
    fs.writeFileSync(path.join(out, `${page.id}-${variant}.md`), result.text)
    done++
    console.log(`[${done}/${jobs.length}] ${spec.id} ${page.id} ${variant} ${result.error ? `FEHLER ${result.error}` : `${result.ms} ms`}`)
  })

  fs.writeFileSync(resultsFile, `${JSON.stringify(results, null, 1)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
