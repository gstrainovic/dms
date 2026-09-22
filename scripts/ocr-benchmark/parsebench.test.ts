import { test } from 'node:test'
import assert from 'node:assert/strict'
import { selectPages, tableFields } from './parsebench.ts'

const html = `<table>
<tr><th>Company</th><th>Share Capital</th><th>% held</th></tr>
<tr><td colspan="3"><strong>JOINT VENTURES</strong></td></tr>
<tr><td><strong>NAVIRIS S.p.A.</strong><br/>Shipbuilding</td><td>EUR 5,000,000</td><td>50.00</td></tr>
<tr><td>ETIHAD</td><td>AED 2,500,000</td><td>35.00</td></tr>
<tr><td>Other</td><td>1</td><td>50.00</td></tr>
</table>`

test('tableFields nimmt Zellen mit Ziffern, ohne Doppelte und ohne einzelne Ziffern', () => {
  assert.deepEqual(tableFields(html), ['EUR 5,000,000', '50.00', 'AED 2,500,000', '35.00'])
})

test('tableFields begrenzt die Anzahl und lässt überlange Zellen weg', () => {
  const rows = Array.from({ length: 30 }, (_, i) => `<tr><td>${1000 + i}</td><td>${'9'.repeat(40)}</td></tr>`).join('')
  const fields = tableFields(`<table>${rows}</table>`, 12)
  assert.equal(fields.length, 12)
  assert.ok(fields.every(f => f.length < 30))
})

test('selectPages nimmt gleichmässig verteilte Seiten mit genug Zahlenzellen', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({
    pdf: `docs/table/p${i}.pdf`,
    type: 'expected_markdown',
    expected_markdown: i % 2 ? html : '<table><tr><td>ohne Zahl</td></tr></table>',
  }))
  const pages = selectPages(rows, 2, 3)
  assert.deepEqual(pages.map(p => p.pdf), ['docs/table/p1.pdf', 'docs/table/p5.pdf'])
  assert.ok(pages.every(p => p.fields.length >= 3))
})
