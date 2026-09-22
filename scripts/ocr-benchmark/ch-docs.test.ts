import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CH_DOCS, htmlText } from './ch-docs.ts'
import { fieldRecall } from './metrics.ts'

test('htmlText liefert den sichtbaren Text ohne Tags, Stile und Skripte', () => {
  assert.equal(htmlText('<style>p{}</style><p>Total <b>CHF</b>&nbsp;1\'234.50</p><script>x()</script>'), "Total CHF 1'234.50")
})

test('es gibt mindestens sechs Schweizer Dokumente mit eindeutigen IDs', () => {
  assert.ok(CH_DOCS.length >= 6)
  assert.equal(new Set(CH_DOCS.map(d => d.id)).size, CH_DOCS.length)
})

test('jedes Feld steht im sichtbaren Text seines Dokuments', () => {
  for (const doc of CH_DOCS) {
    const { missing } = fieldRecall(htmlText(doc.html), doc.fields)
    assert.deepEqual(missing, [], doc.id)
  }
})

test('die Dokumente enthalten keine echten Personendaten des Nutzers', () => {
  for (const doc of CH_DOCS)
    assert.doesNotMatch(doc.html, /strainovic|steinach|bahnstrasse|218574/i, doc.id)
})
