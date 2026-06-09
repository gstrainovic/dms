import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(__dirname, 'fixtures')

async function generatePage(html: string, filename: string, height = 1000) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 800, height } })
  await page.setContent(html)
  const outputPath = path.join(dir, filename)
  await page.screenshot({ path: outputPath, fullPage: true })
  await browser.close()
  console.log(`Created: ${outputPath}`)
}

async function generatePdf(html: string, filename: string) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html)
  const outputPath = path.join(dir, filename)
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true })
  await browser.close()
  console.log(`Created: ${outputPath}`)
}

async function main() {
  fs.mkdirSync(dir, { recursive: true })

  // 1. Rechnung (PNG)
  await generatePage(`
    <div style="font-family: Arial; padding: 40px; max-width: 600px; background: white;">
      <h1 style="margin-top:0">Stadtwerke München GmbH</h1>
      <p>Renatastraße 14, 80639 München</p>
      <hr>
      <p><strong>Rechnung Nr:</strong> SM-2024-001</p>
      <p><strong>Datum:</strong> 15.11.2024</p>
      <p><strong>Kunde:</strong> Max Mustermann</p>
      <p><strong>Kundennr:</strong> 12345678</p>
      <hr>
      <h3>Stromlieferung 01.10.2024 – 31.10.2024</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ccc;">
          <th style="text-align: left; padding: 8px;">Position</th>
          <th style="text-align: right; padding: 8px;">Betrag</th>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">Arbeitspreis (285 kWh × 0,32 €)</td>
          <td style="text-align: right; padding: 8px;">91,20 €</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">Grundpreis</td>
          <td style="text-align: right; padding: 8px;">12,50 €</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">Netzentgelt</td>
          <td style="text-align: right; padding: 8px;">23,80 €</td>
        </tr>
        <tr style="font-weight: bold; border-top: 2px solid #000;">
          <td style="padding: 8px;">Gesamt (inkl. MwSt.)</td>
          <td style="text-align: right; padding: 8px;">127,50 €</td>
        </tr>
      </table>
      <hr>
      <p style="font-size: 12px;">Zahlbar innerhalb von 14 Tagen. IBAN: DE89 3704 0044 0532 0130 00</p>
    </div>
  `, 'test-rechnung.png')

  // 2. Mietvertrag (PNG)
  await generatePage(`
    <div style="font-family: Arial; padding: 40px; max-width: 600px; background: white;">
      <h1 style="margin-top:0; text-align: center;">Mietvertrag</h1>
      <hr>
      <h3>Vermieter</h3>
      <p>Hans Schmidt, Leopoldstraße 42, 80802 München</p>
      <h3>Mieter</h3>
      <p>Anna Müller, bisherige Anschrift: Karlstraße 8, 80333 München</p>
      <hr>
      <h3>Mietobjekt</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px; width: 200px;"><strong>Adresse:</strong></td><td style="padding: 6px;">Schwabing, Hohenzollernstr. 15, 80801 München</td></tr>
        <tr><td style="padding: 6px;"><strong>Stockwerk:</strong></td><td style="padding: 6px;">3. OG links</td></tr>
        <tr><td style="padding: 6px;"><strong>Zimmer:</strong></td><td style="padding: 6px;">3 Zimmer, Küche, Bad</td></tr>
        <tr><td style="padding: 6px;"><strong>Wohnfläche:</strong></td><td style="padding: 6px;">78 m²</td></tr>
        <tr><td style="padding: 6px;"><strong>Mietbeginn:</strong></td><td style="padding: 6px;">01.02.2025</td></tr>
      </table>
      <hr>
      <h3>Miete</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px; width: 200px;"><strong>Kaltmiete:</strong></td><td style="padding: 6px;">1.200,00 € monatlich</td></tr>
        <tr><td style="padding: 6px;"><strong>Nebenkosten:</strong></td><td style="padding: 6px;">250,00 € monatlich (Vorauszahlung)</td></tr>
        <tr><td style="padding: 6px;"><strong>Kaution:</strong></td><td style="padding: 6px;">3.600,00 € (3 Monatsmieten)</td></tr>
      </table>
      <hr>
      <p><strong>Vertragsdatum:</strong> 15.01.2025</p>
      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="border-top: 1px solid #000; padding-top: 4px; width: 200px; text-align: center;">Vermieter</div>
        <div style="border-top: 1px solid #000; padding-top: 4px; width: 200px; text-align: center;">Mieter</div>
      </div>
    </div>
  `, 'test-mietvertrag.png', 900)

  // 3. Arztbrief (PDF)
  await generatePdf(`
    <div style="font-family: Arial; padding: 40px; max-width: 600px; background: white;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h2 style="margin-top:0">Dr. med. Thomas Weber</h2>
          <p style="margin:0">Facharzt für Innere Medizin</p>
          <p style="margin:0">Sendlinger Str. 23, 80331 München</p>
          <p style="margin:0">Tel: 089 / 12345-0</p>
        </div>
        <div style="text-align: right;">
          <p style="margin:0"><strong>Datum:</strong> 10.12.2024</p>
        </div>
      </div>
      <hr>
      <h3>Arztbrief</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 4px; width: 150px;"><strong>Patient:</strong></td><td style="padding: 4px;">Max Mustermann, geb. 15.03.1985</td></tr>
        <tr><td style="padding: 4px;"><strong>Versicherung:</strong></td><td style="padding: 4px;">AOK Bayern, Vers.-Nr. A123456789</td></tr>
      </table>
      <h4>Diagnose</h4>
      <p>Grippaler Infekt (ICD-10: J06.9) mit Pharyngitis und leichtem Fieber (38,2°C).</p>
      <h4>Anamnese</h4>
      <p>Patient stellt sich vor mit seit 3 Tagen bestehenden Halsschmerzen, Schnupfen und allgemeinem Krankheitsgefühl. Kein Husten, keine Atemnot.</p>
      <h4>Befund</h4>
      <p>Rachen gerötet, Tonsillen leicht geschwollen ohne Beläge. Lunge auskultatorisch frei. Temperatur: 38,2°C.</p>
      <h4>Therapie</h4>
      <ul>
        <li>Bettruhe für 3 Tage</li>
        <li>Ibuprofen 400mg bei Bedarf (max. 3x täglich)</li>
        <li>Ausreichend Flüssigkeitszufuhr</li>
      </ul>
      <h4>Arbeitsunfähigkeit</h4>
      <p>AU vom 10.12.2024 bis einschließlich 13.12.2024.</p>
      <hr>
      <p style="margin-top: 30px;">Mit freundlichen Grüßen</p>
      <p style="margin-top: 30px; border-top: 1px solid #000; display: inline-block; padding-top: 4px;">Dr. med. Thomas Weber</p>
    </div>
  `, 'test-arztbrief.pdf')

  console.log('\nAlle Fixtures generiert!')
}

main()
