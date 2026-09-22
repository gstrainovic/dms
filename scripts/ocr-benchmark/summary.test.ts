import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize } from './summary.ts'
import type { TestPage } from './testset.ts'

const pages: TestPage[] = [
  { id: 'a', source: 'a.png', reference: 'a', fields: ['606.45', '25-1182'] },
  { id: 'b', source: 'b.png', fields: ['GELB'] },
]
const refs = { a: 'Total CHF 606.45 Nr 25-1182' }

test('summarize mittelt pro Modell und Fassung, CER nur für Seiten mit Referenz', () => {
  const rows = summarize([
    { model: 'm', page: 'a', variant: 'sauber', text: 'Total CHF 606.45 Nr 25-1182', ms: 1000, inputTokens: 1000, outputTokens: 100 },
    { model: 'm', page: 'b', variant: 'sauber', text: 'ROT', ms: 3000, inputTokens: 3000, outputTokens: 300 },
    { model: 'm', page: 'a', variant: 'verzerrt', text: 'Total CHF 606.46 Nr 25-1182', ms: 2000 },
  ], pages, refs, { m: { inputChfPerM: 1, outputChfPerM: 10 } })

  const clean = rows.find(r => r.model === 'm' && r.variant === 'sauber')!
  assert.equal(clean.cer, 0)
  assert.equal(clean.fieldRecall, 2 / 3)
  assert.equal(clean.pages, 2)
  assert.equal(clean.avgMs, 2000)
  // (1000 + 3000) Input-Tokens à 1 CHF/M und 400 Output à 10 CHF/M auf 2 Seiten, hochgerechnet auf 1000 Seiten
  assert.equal(clean.chfPer1000Pages, Math.round(((4000 * 1 + 400 * 10) / 1e6 / 2) * 1000 * 100) / 100)

  const distorted = rows.find(r => r.variant === 'verzerrt')!
  assert.ok((distorted.cer ?? 0) > 0)
  assert.equal(distorted.fieldRecall, 0.5)
})

test('summarize meldet null statt 0, wo es nichts zu messen gibt', () => {
  const rows = summarize([
    { model: 'm', page: 'b', variant: 'sauber', text: 'GELB', ms: 5 },
    { model: 'x', page: 'a', variant: 'sauber', text: '', ms: 5, error: '402' },
  ], pages, refs, {})
  const noRef = rows.find(r => r.model === 'm')!
  assert.equal(noRef.cer, null)
  assert.equal(noRef.inventedWords, null)
  assert.equal(noRef.fieldRecall, 1)
  const failed = rows.find(r => r.model === 'x')!
  assert.equal(failed.fieldRecall, null)
  assert.equal(failed.avgMs, null)
})

test('summarize lässt fehlgeschlagene Aufrufe aus der Wertung und weist sie nur als Fehler aus', () => {
  const [row] = summarize([
    { model: 'ocr', page: 'a', variant: 'sauber', text: '', ms: 10, error: '402' },
    { model: 'ocr', page: 'a', variant: 'sauber', text: 'Total CHF 606.45 Nr 25-1182', ms: 30 },
  ], pages, refs, { ocr: { chfPerPage: 0.002 } })
  assert.equal(row.errors, 1)
  assert.equal(row.pages, 1)
  assert.equal(row.cer, 0)
  assert.equal(row.fieldRecall, 1)
  assert.equal(row.avgMs, 30)
  assert.equal(row.chfPer1000Pages, 2)
})
