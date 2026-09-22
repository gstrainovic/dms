/**
 * Auswertung von results.json: pro Modell und Fassung (sauber/verzerrt) Zeichenfehlerrate, gefundene Felder,
 * erfundene Wörter, Laufzeit und Kosten pro 1000 Seiten nach den Preisen der Schweizer Anbieter (prices.ts).
 *
 *   node scripts/ocr-benchmark/summary.ts   # schreibt results.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cer, fieldRecall, inventedWordRate } from './metrics.ts'
import { PRICES } from './prices.ts'
import { MODELS, type RunResult } from './run.ts'
import { TEST_PAGES, type TestPage } from './testset.ts'

/** Preis in CHF: entweder pro Seite (OCR-Dienst) oder pro Million Tokens (Vision-Modell) */
export interface Price {
  chfPerPage?: number
  inputChfPerM?: number
  outputChfPerM?: number
}

export interface SummaryRow {
  model: string
  variant: RunResult['variant']
  pages: number
  errors: number
  /** Mittlere Zeichenfehlerrate über die Seiten mit Referenz; null = keine solche Seite (echte Fotos) */
  cer: number | null
  fieldRecall: number | null
  inventedWords: number | null
  avgMs: number | null
  avgInputTokens: number | null
  avgOutputTokens: number | null
  chfPer1000Pages: number | null
}

/** Mittelwert; null, wenn es nichts zu mitteln gibt, damit «nicht gemessen» nicht wie «0 %» aussieht */
const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function summarize(results: RunResult[], pages: TestPage[], references: Record<string, string>, prices: Record<string, Price>): SummaryRow[] {
  const groups = new Map<string, RunResult[]>()
  for (const r of results) {
    const key = `${r.model}|${r.variant}`
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  return [...groups.values()].map((all) => {
    const { model, variant } = all[0]
    // Fehlgeschlagene Aufrufe (Guthaben, Timeout) sagen nichts über die Erkennung, sie zählen nur als Fehler
    const rs = all.filter(r => !r.error)
    const withRef = rs.filter(r => pages.find(p => p.id === r.page)?.reference)
    const refOf = (r: RunResult) => references[pages.find(p => p.id === r.page)!.reference!]
    const found = rs.flatMap(r => {
      const page = pages.find(p => p.id === r.page)!
      const { missing } = fieldRecall(r.text, page.fields)
      return [page.fields.length - missing.length, page.fields.length]
    })
    const totalFields = found.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0)
    const foundFields = found.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0)
    const price = prices[model]
    let chfPerPage: number | null = null
    if (price?.chfPerPage !== undefined) chfPerPage = price.chfPerPage
    else if (price?.inputChfPerM !== undefined) {
      const tokens = rs.map(r => ((r.inputTokens ?? 0) * price.inputChfPerM! + (r.outputTokens ?? 0) * (price.outputChfPerM ?? 0)) / 1e6)
      chfPerPage = mean(tokens)
    }
    return {
      model,
      variant,
      pages: rs.length,
      errors: all.length - rs.length,
      cer: mean(withRef.map(r => Math.min(1, cer(refOf(r), r.text)))),
      fieldRecall: totalFields ? foundFields / totalFields : null,
      inventedWords: mean(withRef.map(r => inventedWordRate(refOf(r), r.text))),
      avgMs: mean(rs.map(r => r.ms)),
      avgInputTokens: mean(rs.map(r => r.inputTokens ?? 0)),
      avgOutputTokens: mean(rs.map(r => r.outputTokens ?? 0)),
      chfPer1000Pages: chfPerPage === null ? null : Math.round(chfPerPage * 1000 * 100) / 100,
    }
  })
}

const pct = (x: number | null) => (x === null ? '–' : `${(x * 100).toFixed(1)} %`)

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  // Rohausgaben liegen in .cache (gitignored), weil sie bei echten Belegen Personendaten enthalten
  const results: RunResult[] = JSON.parse(fs.readFileSync(path.join(here, '.cache', 'results.json'), 'utf8'))
  const references = Object.fromEntries(TEST_PAGES.filter(p => p.reference)
    .map(p => [p.reference!, fs.readFileSync(path.join(here, 'references', p.reference!), 'utf8')]))
  const rows = summarize(results, TEST_PAGES, references, PRICES)
  const label = (id: string) => MODELS.find(m => m.id === id)?.label ?? id
  const order = MODELS.map(m => m.id)
  rows.sort((a, b) => order.indexOf(a.model) - order.indexOf(b.model) || a.variant.localeCompare(b.variant))

  const lines = [
    '| Modell | Fassung | Zeichenfehler | Felder gefunden | Erfundene Wörter | Sekunden/Seite | CHF/1000 Seiten | Fehler |',
    '|---|---|---:|---:|---:|---:|---:|---:|',
    ...rows.map(r => `| ${label(r.model)} | ${r.variant} | ${pct(r.cer)} | ${pct(r.fieldRecall)} | ${pct(r.inventedWords)} | ${r.avgMs === null ? '–' : (r.avgMs / 1000).toFixed(1)} | ${r.chfPer1000Pages ?? '–'} | ${r.errors} |`),
  ]
  // Verpasste Felder pro Modell, damit man sieht, woran es scheitert. Bei echten Belegen nur die Anzahl:
  // ihre Felder sind Personendaten (Namen, Kontrollschild, Fahrgestellnummer) und results.md liegt im Repo
  const misses = results.filter(r => r.variant !== 'sauber' || r.page === 'fahrzeugausweis').map((r) => {
    const page = TEST_PAGES.find(p => p.id === r.page)!
    return { model: r.model, page: r.page, variant: r.variant, real: !!page.real, total: page.fields.length, missing: fieldRecall(r.text, page.fields).missing }
  }).filter(m => m.missing.length)
  const missLines = misses.sort((a, b) => order.indexOf(a.model) - order.indexOf(b.model))
    .map(m => `- ${label(m.model)}, ${m.page} (${m.variant}): ${m.real ? `${m.missing.length} von ${m.total} Feldern` : m.missing.join(', ')}`)

  const real = TEST_PAGES.filter(p => p.real).length
  const md = `# OCR-Vergleich\n\nErzeugt von \`summary.ts\` aus \`results.json\`. Künstliche Seiten: ${TEST_PAGES.length - real}, je sauber und verzerrt (Fahrzeugausweis nur sauber); echte Handyfotos: ${real} (nur Felder, keine Referenztexte).\n\n${lines.join('\n')}\n\n## Nicht gefundene Felder (verzerrt, echt, Fahrzeugausweis)\n\n${missLines.join('\n') || 'keine'}\n`
  fs.writeFileSync(path.join(here, 'results.md'), md)
  console.log(md)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
