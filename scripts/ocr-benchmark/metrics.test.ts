import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cer, fieldRecall, inventedWordRate, normalize } from './metrics.ts'

test('normalize entfernt Markdown-Syntax und vereinheitlicht Zeichen', () => {
  const md = '# Garage Meier AG\n\n| Position | CHF |\n|---|---:|\n| **Ölfilter** | 24.80 |\n\n92’300 km – Total CHF'
  assert.equal(normalize(md), "Garage Meier AG Position CHF Ölfilter 24.80 92'300 km - Total CHF")
})

test('normalize entfernt Bild-Links und HTML-Tags aus der OCR-Ausgabe', () => {
  assert.equal(normalize('![img-0.jpeg](img-0.jpeg)\nText<br>mehr'), 'Text mehr')
})

test('normalize entfernt Codeblock-Zäune, Trennlinien, Escapes und LaTeX-Abstände', () => {
  const md = '```markdown\n# Reifen Keller GmbH\n\n---\n***\nTotal  148.00\n------------- -------\n```\n\\_\\_\\_\\_ Vermieter $\\quad \\quad$ Mieter\n\\*\\*8600'
  assert.equal(normalize(md), 'Reifen Keller GmbH Total 148.00 Vermieter Mieter 8600')
})

test('cer ist 0 bei gleichem Text und zählt Fehler relativ zur Referenz', () => {
  assert.equal(cer('Total CHF 606.45', '**Total** CHF 606.45'), 0)
  assert.equal(cer('abcdefghij', 'abcdefghiX'), 0.1)
  assert.equal(cer('abcde', ''), 1)
})

test('fieldRecall findet Felder unabhängig von Leerzeichen, Apostroph und Tausendertrenner', () => {
  const out = "IBAN: DE89370400440532013000 · km 92’300 · Total 1'395.55"
  const r = fieldRecall(out, ['DE89 3704 0044 0532 0130 00', "92'300", '1395.55', 'fehlt'])
  assert.deepEqual(r.missing, ['fehlt'])
  assert.equal(r.recall, 0.75)
})

test('fieldRecall findet Nummern mit Punkten auch vor weiteren Zahlen in einer Tabellenzeile', () => {
  assert.deepEqual(fieldRecall('| 18 | Stammnummer | 180.88.125 | | 32 |', ['180.88.125']).missing, [])
  assert.deepEqual(fieldRecall('Kaution 3.600,00 € 3 Monatsmieten', ['3.600,00']).missing, [])
})

test('inventedWordRate zählt Wörter der Ausgabe, die in der Referenz nicht vorkommen', () => {
  assert.equal(inventedWordRate('Total CHF 606.45', 'Total CHF 606.45'), 0)
  assert.equal(inventedWordRate('Total CHF 606.45', 'Total CHF 606.45 Rabatt'), 0.25)
  // Wiederholung zählt: die Referenz hat «CHF» nur einmal
  assert.equal(inventedWordRate('Total CHF', 'Total CHF CHF CHF'), 0.5)
})
