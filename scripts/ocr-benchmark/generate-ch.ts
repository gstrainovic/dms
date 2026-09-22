/**
 * Rendert die Schweizer Testdokumente (ch-docs.ts) mit Chromium zu A4-PDFs in .cache/ch und schreibt den
 * sichtbaren Text als Referenz nach references/<id>.txt. Danach wie jede PDF-Seite: gerastert und verzerrt.
 *
 *   node scripts/ocr-benchmark/generate-ch.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { CH_DOCS, htmlText } from './ch-docs.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(here, '.cache', 'ch')
fs.mkdirSync(dir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()
for (const doc of CH_DOCS) {
  // networkidle: die Handschrift-Schrift kommt von Google Fonts
  await page.setContent(doc.html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.pdf({ path: path.join(dir, `${doc.id}.pdf`), format: 'A4', printBackground: true })
  fs.writeFileSync(path.join(here, 'references', `${doc.id}.txt`), `${htmlText(doc.html)}\n`)
}
await browser.close()
console.log(`${CH_DOCS.length} Schweizer Dokumente in ${path.relative(process.cwd(), dir)}`)
