/**
 * Schweizer Testdokumente mit erfundenen Daten: QR-Rechnungen, Lohnausweis, Steuerrechnung, Leistungsabrechnung
 * der Krankenkasse, zweispaltige Versicherungspolice und eine Notiz in Schreibschrift. Öffentliche Testsätze haben
 * keine Schweizer Dokumente. IBAN und QR-IBAN sind die Beispielnummern aus den Implementation Guidelines von SIX.
 * generate-ch.ts rendert sie zu PDFs; Referenztext und Felder kommen aus dem HTML selbst.
 */
import { SwissQRBill } from 'swissqrbill/svg'
import { calculateQRReferenceChecksum, calculateSCORReferenceChecksum } from 'swissqrbill/utils'

export interface ChDoc {
  id: string
  html: string
  fields: string[]
}

const QR_IBAN = 'CH4431999123000889012'
const IBAN = 'CH9300762011623852957'

/** Sichtbarer Text eines HTML-Dokuments (für Referenz und Tests) */
export function htmlText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function qrReference(base: string): string {
  return base + calculateQRReferenceChecksum(base)
}

function scorReference(base: string): string {
  return `RF${calculateSCORReferenceChecksum(base)}${base}`
}

function qrBill(data: { amount: number, reference: string, iban: string, creditor: { name: string, address: string, buildingNumber: string, zip: number, city: string }, debtor: { name: string, address: string, buildingNumber: string, zip: number, city: string }, message?: string }): string {
  const bill = new SwissQRBill({
    currency: 'CHF',
    amount: data.amount,
    reference: data.reference,
    message: data.message,
    creditor: { ...data.creditor, account: data.iban, country: 'CH' },
    debtor: { ...data.debtor, country: 'CH' },
  }, { language: 'DE' })
  return `<div style="margin-top:24px">${bill.toString()}</div>`
}

const page = (body: string, font = 'Arial', head = '') =>
  `<!doctype html><html><head><meta charset="utf-8">${head}<style>
    body{font-family:${font},sans-serif;font-size:13px;margin:0;padding:36px;color:#111;width:740px}
    table{border-collapse:collapse;width:100%} td,th{padding:4px 6px;border-bottom:1px solid #ccc;text-align:left}
    td.r,th.r{text-align:right} h1{font-size:20px;margin:0 0 6px} h2{font-size:15px;margin:14px 0 6px}
  </style></head><body>${body}</body></html>`

const debtor = { name: 'Anna Beispiel', address: 'Musterweg', buildingNumber: '7', zip: 8001, city: 'Zürich' }

export const CH_DOCS: ChDoc[] = [
  {
    id: 'ch-praemienrechnung',
    fields: ['756.1234.5678.97', '412.30', '38.90', '451.20', '01.10.2026', '31.10.2026', '300', 'KV-2026-104877'],
    html: page(`
      <h1>Krankenkasse Beispiel AG</h1><p>Postfach, 3000 Bern</p>
      <p>Anna Beispiel<br>Musterweg 7<br>8001 Zürich</p>
      <h2>Prämienrechnung Oktober 2026</h2>
      <p>Rechnungsnummer: KV-2026-104877 · Versichertennummer: 756.1234.5678.97</p>
      <p>Periode: 01.10.2026 – 31.10.2026 · Franchise: CHF 300</p>
      <table><tr><th>Versicherung</th><th class="r">CHF</th></tr>
        <tr><td>Grundversicherung KVG, Modell Hausarzt</td><td class="r">412.30</td></tr>
        <tr><td>Spitalzusatz halbprivat VVG</td><td class="r">38.90</td></tr>
        <tr><td><b>Total</b></td><td class="r"><b>451.20</b></td></tr></table>
      ${qrBill({ amount: 451.20, reference: qrReference('21000000000313947143000901'), iban: QR_IBAN,
        creditor: { name: 'Krankenkasse Beispiel AG', address: 'Postfach', buildingNumber: '1', zip: 3000, city: 'Bern' }, debtor })}`),
  },
  {
    id: 'ch-handwerkerrechnung',
    fields: ['CHE-111.222.333', '2026-0418', '12.09.2026', '1\'280.00', '345.60', '96.00', '1\'721.60', '139.45', '1\'861.05'],
    html: page(`
      <h1>Malerei Muster GmbH</h1><p>Farbweg 3, 6003 Luzern · MWST-Nr. CHE-111.222.333 MWST</p>
      <h2>Rechnung Nr. 2026-0418</h2><p>Datum: 12.09.2026 · Zahlbar innert 30 Tagen</p>
      <table><tr><th>Position</th><th class="r">Menge</th><th class="r">Ansatz</th><th class="r">CHF</th></tr>
        <tr><td>Wände streichen, Wohnzimmer</td><td class="r">16 Std.</td><td class="r">80.00</td><td class="r">1'280.00</td></tr>
        <tr><td>Dispersionsfarbe weiss</td><td class="r">24 l</td><td class="r">14.40</td><td class="r">345.60</td></tr>
        <tr><td>Abdeckmaterial</td><td class="r">1</td><td class="r">96.00</td><td class="r">96.00</td></tr>
        <tr><td>Total netto</td><td></td><td></td><td class="r">1'721.60</td></tr>
        <tr><td>MWST 8.1 %</td><td></td><td></td><td class="r">139.45</td></tr>
        <tr><td><b>Total CHF</b></td><td></td><td></td><td class="r"><b>1'861.05</b></td></tr></table>
      ${qrBill({ amount: 1861.05, reference: scorReference('20260418'), iban: IBAN, message: 'Rechnung 2026-0418',
        creditor: { name: 'Malerei Muster GmbH', address: 'Farbweg', buildingNumber: '3', zip: 6003, city: 'Luzern' }, debtor })}`),
  },
  {
    id: 'ch-lohnausweis',
    fields: ['756.1234.5678.97', '01.01.2025', '31.12.2025', '78\'000', '6\'500', '84\'500', '5\'441', '4\'212', '74\'847', '1\'200', 'CHE-444.555.666'],
    html: page(`
      <h1>Lohnausweis – Certificat de salaire</h1><p>Formular 11 (Nachbildung mit erfundenen Werten)</p>
      <table><tr><td>A</td><td>Lohnausweis</td><td>AHV-Nr. 756.1234.5678.97</td></tr>
        <tr><td>E</td><td>Jahr / Zeitraum</td><td>von 01.01.2025 bis 31.12.2025</td></tr>
        <tr><td>H</td><td>Arbeitnehmer</td><td>Anna Beispiel, Musterweg 7, 8001 Zürich</td></tr></table>
      <h2>Einkünfte</h2>
      <table><tr><th>Ziff.</th><th>Bezeichnung</th><th class="r">CHF</th></tr>
        <tr><td>1.</td><td>Lohn soweit nicht unter Ziffer 2–7 aufzuführen</td><td class="r">78'000</td></tr>
        <tr><td>3.</td><td>Unregelmässige Leistungen (Bonus)</td><td class="r">6'500</td></tr>
        <tr><td>8.</td><td>Bruttolohn total / Rente</td><td class="r">84'500</td></tr>
        <tr><td>9.</td><td>Beiträge AHV/IV/EO/ALV/NBUV</td><td class="r">5'441</td></tr>
        <tr><td>10.1</td><td>Berufliche Vorsorge 2. Säule, ordentliche Beiträge</td><td class="r">4'212</td></tr>
        <tr><td>11.</td><td>Nettolohn / Rente</td><td class="r">74'847</td></tr>
        <tr><td>13.1.2</td><td>Spesenvergütungen, Pauschalspesen Übrige</td><td class="r">1'200</td></tr></table>
      <p>Arbeitgeber: Beispiel Treuhand AG, Seestrasse 20, 8002 Zürich, UID CHE-444.555.666</p>`),
  },
  {
    id: 'ch-steuerrechnung',
    fields: ['84\'300', '152\'000', '118', '2\'946.10', '3\'476.40', '6\'422.50', '31.03.2026', '30.09.2026', '8430.17'],
    html: page(`
      <h1>Gemeinde Musterwil</h1><p>Steueramt, Dorfplatz 1, 8400 Musterwil</p>
      <h2>Provisorische Steuerrechnung 2026 – Staats- und Gemeindesteuern</h2>
      <p>Steuerregister-Nr. 8430.17 · Anna Beispiel, Musterweg 7, 8001 Zürich</p>
      <table><tr><th>Grundlage</th><th class="r">CHF</th></tr>
        <tr><td>Steuerbares Einkommen</td><td class="r">84'300</td></tr>
        <tr><td>Steuerbares Vermögen</td><td class="r">152'000</td></tr>
        <tr><td>Steuerfuss Gemeinde in %</td><td class="r">118</td></tr></table>
      <table style="margin-top:10px"><tr><th>Steuer</th><th class="r">CHF</th></tr>
        <tr><td>Staatssteuer</td><td class="r">2'946.10</td></tr>
        <tr><td>Gemeindesteuer</td><td class="r">3'476.40</td></tr>
        <tr><td><b>Total provisorisch</b></td><td class="r"><b>6'422.50</b></td></tr></table>
      <p>1. Rate fällig am 31.03.2026, 2. Rate fällig am 30.09.2026</p>
      ${qrBill({ amount: 3211.25, reference: qrReference('84301700000000000000202601'), iban: QR_IBAN,
        creditor: { name: 'Gemeinde Musterwil Steueramt', address: 'Dorfplatz', buildingNumber: '1', zip: 8400, city: 'Musterwil' }, debtor })}`),
  },
  {
    id: 'ch-leistungsabrechnung',
    fields: ['14.02.2026', '186.40', '03.03.2026', '92.15', '21.04.2026', '1\'240.00', '1\'518.55', '300.00', '121.86', '1\'096.69'],
    html: page(`
      <h1>Krankenkasse Beispiel AG</h1><h2>Leistungsabrechnung vom 30.04.2026</h2>
      <p>Versicherte Person: Anna Beispiel, geb. 12.05.1984</p>
      <table><tr><th>Datum</th><th>Leistungserbringer</th><th class="r">Rechnung</th><th class="r">Franchise</th><th class="r">Selbstbehalt</th><th class="r">Vergütung</th></tr>
        <tr><td>14.02.2026</td><td>Dr. med. Muster, Hausarzt</td><td class="r">186.40</td><td class="r">186.40</td><td class="r">0.00</td><td class="r">0.00</td></tr>
        <tr><td>03.03.2026</td><td>Apotheke Beispiel</td><td class="r">92.15</td><td class="r">92.15</td><td class="r">0.00</td><td class="r">0.00</td></tr>
        <tr><td>21.04.2026</td><td>Kantonsspital, ambulant</td><td class="r">1'240.00</td><td class="r">21.45</td><td class="r">121.86</td><td class="r">1'096.69</td></tr>
        <tr><td colspan="2"><b>Total</b></td><td class="r">1'518.55</td><td class="r">300.00</td><td class="r">121.86</td><td class="r">1'096.69</td></tr></table>
      <p>Die Vergütung von CHF 1'096.69 wird auf Ihr Konto überwiesen.</p>`),
  },
  {
    id: 'ch-police-zweispaltig',
    fields: ['HR-7781-2026', '80\'000', '312.40', '200', '01.01.2026', '31.12.2028', '5\'000'],
    html: page(`
      <h1>Beispiel Versicherungen AG</h1><h2>Police Hausrat Nr. HR-7781-2026</h2>
      <table><tr><td>Versicherungsdauer</td><td>01.01.2026 bis 31.12.2028</td></tr>
        <tr><td>Versicherungssumme Hausrat</td><td>CHF 80'000</td></tr>
        <tr><td>Einfacher Diebstahl auswärts</td><td>CHF 5'000</td></tr>
        <tr><td>Selbstbehalt je Schadenfall</td><td>CHF 200</td></tr>
        <tr><td>Jahresprämie inkl. Stempelabgabe</td><td>CHF 312.40</td></tr></table>
      <div style="column-count:2;column-gap:28px;font-size:11px;margin-top:14px;text-align:justify">
        <p><b>Art. 1 Gegenstand.</b> Versichert ist der Hausrat am Versicherungsort gegen Feuer, Elementarereignisse, Diebstahl und Wasser. Als Hausrat gelten alle beweglichen Sachen, die dem privaten Gebrauch dienen und Eigentum der versicherten Personen sind.</p>
        <p><b>Art. 2 Unterversicherung.</b> Ist die Versicherungssumme niedriger als der Ersatzwert, wird der Schaden nur im Verhältnis der Versicherungssumme zum Ersatzwert vergütet. Eine Anpassung der Summe ist jederzeit möglich.</p>
        <p><b>Art. 3 Kündigung.</b> Der Vertrag verlängert sich jeweils um ein Jahr, wenn er nicht drei Monate vor Ablauf schriftlich gekündigt wird. Nach jedem Schadenfall können beide Parteien den Vertrag kündigen.</p>
        <p><b>Art. 4 Pflichten im Schadenfall.</b> Ein Schaden ist sofort zu melden. Bei Diebstahl ist die Polizei zu benachrichtigen. Beschädigte Sachen sind bis zur Besichtigung aufzubewahren.</p>
      </div>`),
  },
  {
    id: 'ch-notiz-schreibschrift',
    fields: ['24.08.2026', '380.–', '1\'150.–', 'CH93 0076 2011 6238 5295 7', '15.09.'],
    html: page(`
      <div style="font-size:24px;line-height:1.6;transform:rotate(-1.5deg)">
        <p>Notiz vom 24.08.2026</p>
        <p>Velo-Reparatur bezahlt: 380.– bar<br>Kaution Wohnung Bern: 1'150.– überweisen<br>
        an CH93 0076 2011 6238 5295 7 bis spätestens 15.09.</p>
        <p>Nicht vergessen: Garantieschein in den Ordner!</p>
      </div>`, '"Caveat",cursive',
    // Handschrift-Schrift (OFL), lokal ist keine installiert
    '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=block" rel="stylesheet">'),
  },
]
