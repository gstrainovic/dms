/**
 * Testsatz für den OCR-Vergleich: Fixtures aus dms `e2e/fixtures` und die Testrechnungen aus wartungsheft
 * `testdateien/`. Alle ausser dem Fahrzeugausweis sind aus HTML erzeugt, also sauberer als echte Scans; darum
 * gibt es von jeder Seite zusätzlich eine verzerrte Fassung (schief, unscharf, verrauscht, JPEG), siehe run.ts.
 * Referenzen: PDFs aus der Textebene (pdftotext), PNGs aus dem HTML der Generatoren, von Hand geprüft.
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CH_DOCS } from './ch-docs.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const dms = path.resolve(here, '../../e2e/fixtures')
const wartungsheft = path.resolve(here, '../../../wartungsheft/testdateien')

export interface TestPage {
  id: string
  /** Bild oder PDF */
  source: string
  /** Seite im PDF (1-basiert); PDFs werden wie ein Scan mit 150 dpi gerastert */
  pdfPage?: number
  /** Referenztext in references/; fehlt beim Fahrzeugausweis (mehrsprachiges Formular ohne eindeutige Lesereihenfolge) */
  reference?: string
  /** Felder, die eine Extraktion finden muss: Beträge, Daten, Nummern, IBAN */
  fields: string[]
  /** Echtes Handyfoto: läuft nur als Fassung «echt», ohne künstliche Verzerrung */
  real?: boolean
}

/**
 * Echte Belege (Handyfotos aus wartungsheft `tmp/test-images`, gitignored) stehen mit abgelesenen Feldern in
 * testset.local.json, weil sie Personendaten enthalten. Fehlt die Datei, läuft nur der künstliche Satz.
 */
function localPages(): TestPage[] {
  const file = path.join(here, 'testset.local.json')
  if (!fs.existsSync(file)) return []
  const pages: TestPage[] = JSON.parse(fs.readFileSync(file, 'utf8'))
  return pages.map(p => ({ ...p, source: path.resolve(here, p.source), real: true }))
}

const CH_INVOICE_FIELDS = ['25-1182', '03.03.2025', 'CHE-123.456.789', 'TMBJJ7NE5L0123456', "92'300", 'ZH 123456', '561.00', '45.45', '606.45']
const WORKSHOP_DE_FIELDS = ['2024-0847', '15.01.2025', 'M-AB 1234', '47.500', '187,50', '486,90']

export const TEST_PAGES: TestPage[] = [
  { id: 'rechnung-de', source: `${dms}/test-rechnung.png`, reference: 'rechnung-de.txt',
    fields: ['SM-2024-001', '15.11.2024', '12345678', '91,20', '127,50', 'DE89 3704 0044 0532 0130 00'] },
  { id: 'mietvertrag', source: `${dms}/test-mietvertrag.png`, reference: 'mietvertrag.txt',
    fields: ['1.200,00', '250,00', '3.600,00', '01.02.2025', '15.01.2025', 'Hohenzollernstr. 15'] },
  { id: 'arztbrief', source: `${dms}/test-arztbrief.pdf`, pdfPage: 1, reference: 'arztbrief.txt',
    fields: ['10.12.2024', 'J06.9', 'A123456789', '15.03.1985', '38,2', '13.12.2024'] },
  { id: 'werkstatt-de', source: `${wartungsheft}/test-invoice.png`, reference: 'werkstatt-de.txt', fields: WORKSHOP_DE_FIELDS },
  { id: 'werkstatt-de-quer', source: `${wartungsheft}/test-invoice-landscape.png`, reference: 'werkstatt-de.txt', fields: WORKSHOP_DE_FIELDS },
  { id: 'kaufvertrag', source: `${wartungsheft}/test-kaufvertrag.png`, reference: 'kaufvertrag.txt',
    fields: ['WVWZZZ1KZMP012345', 'B-HS 4321', '38.500', '22.500,00', '20.01.2025', '03/2021'] },
  { id: 'serviceheft', source: `${wartungsheft}/test-service-heft.png`, reference: 'serviceheft.txt',
    fields: ['WVWZZZ1KZMP012345', '15.03.2022', '15.200', '28.400', '10.06.2024', '90.000'] },
  { id: 'rechnung-ch-foto', source: `${wartungsheft}/test-rechnung-ch.png`, reference: 'rechnung-ch.txt', fields: CH_INVOICE_FIELDS },
  { id: 'rechnung-ch-scan', source: `${wartungsheft}/test-rechnung-ch.pdf`, pdfPage: 1, reference: 'rechnung-ch.txt', fields: CH_INVOICE_FIELDS },
  { id: 'sammel-1', source: `${wartungsheft}/test-rechnungen-sammel.pdf`, pdfPage: 1, reference: 'sammel-1.txt',
    fields: ['R-4471', '28.10.2024', "41'200", '60.00', '148.00'] },
  { id: 'sammel-2', source: `${wartungsheft}/test-rechnungen-sammel.pdf`, pdfPage: 2, reference: 'sammel-2.txt',
    fields: ['88213', '17.04.2025', '14.04.2025', "49'850", '380.00', '34.60'] },
  { id: 'sammel-3', source: `${wartungsheft}/test-rechnungen-sammel.pdf`, pdfPage: 3, reference: 'sammel-3.txt',
    fields: ['520.00', '210.00', '1291.00', '104.55', '1395.55'] },
  { id: 'fahrzeugausweis', source: `${wartungsheft}/fahrzeugausweis-schweiz.jpg`,
    fields: ['HEIDIPOST', 'VETERANENFAHRZEUG', 'GESELLSCHAFTSWAGEN', 'SAURER 3 DUX', '2 100 728', '180.88.125', '10300',
      '8600', '4000', '12600', '03.64', '17.12.02/10M', '09.02/BS', '11.11.2002', '405260', 'A10', 'GELB', '52,46'] },
  ...localPages(),
  ...parseBenchPages(),
  ...swissPages(),
]

/** Schweizer Dokumente mit erfundenen Daten (ch-docs.ts); die PDFs erzeugt generate-ch.ts in .cache/ch */
function swissPages(): TestPage[] {
  return CH_DOCS
    .map(doc => ({ id: doc.id, source: path.join(here, '.cache', 'ch', `${doc.id}.pdf`), pdfPage: 1, reference: `${doc.id}.txt`, fields: doc.fields }))
    .filter(p => fs.existsSync(p.source))
}

/**
 * 30 Tabellenseiten aus ParseBench (Apache-2.0), Auswahl und Felder in testset.parsebench.json (erzeugt von
 * parsebench.ts). Die PDFs liegen in .cache/parsebench; fehlen sie, fällt der Teil weg.
 */
function parseBenchPages(): TestPage[] {
  const file = path.join(here, 'testset.parsebench.json')
  if (!fs.existsSync(file)) return []
  const pages: TestPage[] = JSON.parse(fs.readFileSync(file, 'utf8'))
  return pages.map(p => ({ ...p, source: path.resolve(here, p.source) })).filter(p => fs.existsSync(p.source))
}
