/**
 * Schwere Seiten aus ParseBench (LlamaIndex, Apache-2.0, huggingface.co/datasets/llamaindex/ParseBench): echte
 * Geschäftsdokumente mit Tabellen und einer von Hand geprüften Soll-Tabelle. Die Zellen mit Zahlen werden zu Feldern,
 * die eine Erkennung finden muss; einen Referenztext für die ganze Seite gibt es nicht.
 *
 *   node scripts/ocr-benchmark/parsebench.ts   # lädt die Auswahl nach .cache/parsebench, schreibt testset.parsebench.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://huggingface.co/datasets/llamaindex/ParseBench/resolve/main'

interface TableRow {
  pdf: string
  type: string
  expected_markdown?: string
}

/** Zellinhalte mit mindestens zwei Ziffern (Beträge, Prozente, Jahre), ohne Doppelte, höchstens `max` */
export function tableFields(html: string, max = 15): string[] {
  const cells = [...html.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())
  const fields: string[] = []
  for (const cell of cells) {
    if ((cell.match(/\d/g) ?? []).length < 2 || cell.length >= 30 || fields.includes(cell)) continue
    fields.push(cell)
    if (fields.length === max) break
  }
  return fields
}

/** `count` Seiten, gleichmässig über alle geeigneten verteilt, damit die Auswahl stabil und gemischt ist */
export function selectPages(rows: TableRow[], count: number, minFields = 8): { pdf: string, fields: string[] }[] {
  const eligible = rows
    .filter(r => r.type === 'expected_markdown' && r.expected_markdown)
    .map(r => ({ pdf: r.pdf, fields: tableFields(r.expected_markdown!) }))
    .filter(p => p.fields.length >= minFields)
  const step = eligible.length / count
  return Array.from({ length: Math.min(count, eligible.length) }, (_, i) => eligible[Math.floor(i * step)])
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const dir = path.join(here, '.cache', 'parsebench')
  fs.mkdirSync(dir, { recursive: true })
  const jsonl = await (await fetch(`${BASE}/table.jsonl`)).text()
  const rows: TableRow[] = jsonl.split('\n').filter(Boolean).map(line => JSON.parse(line))
  const pages = selectPages(rows, 30)
  const testset = []
  for (const page of pages) {
    const file = path.join(dir, path.basename(page.pdf))
    if (!fs.existsSync(file)) {
      const res = await fetch(`${BASE}/${page.pdf}`)
      if (!res.ok) throw new Error(`${page.pdf}: ${res.status}`)
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    }
    testset.push({ id: `pb-${path.basename(page.pdf, '.pdf')}`, source: path.relative(here, file), pdfPage: 1, fields: page.fields })
  }
  fs.writeFileSync(path.join(here, 'testset.parsebench.json'), `${JSON.stringify(testset, null, 1)}\n`)
  console.log(`${testset.length} Seiten aus ParseBench, ${testset.reduce((n, p) => n + p.fields.length, 0)} Felder`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
