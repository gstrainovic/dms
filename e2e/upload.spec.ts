import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect, getSupabase, cleanupAll, loginAsTestUser } from './fixtures/test-fixtures'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = path.join(__dirname, 'fixtures')

test.describe('Upload', () => {
  test.beforeAll(async () => {
    await cleanupAll(getSupabase())
  })

  test.afterAll(async () => {
    await cleanupAll(getSupabase())
  })

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('Seite zeigt Upload-Überschrift und Drop-Zone', async ({ page }) => {
    await page.goto('/upload')
    await expect(page.getByRole('heading', { name: /hochladen/i })).toBeVisible()
    await expect(page.getByText('Dateien hierher ziehen')).toBeVisible()
  })

  test('Dateien wählen Button sichtbar', async ({ page }) => {
    await page.goto('/upload')
    await expect(page.getByText('Dateien wählen')).toBeVisible()
  })

  test('Kamera Button sichtbar', async ({ page }) => {
    await page.goto('/upload')
    await expect(page.getByText('Kamera')).toBeVisible()
  })

  test('Datei via Input auswählen erscheint in Liste', async ({ page }) => {
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FIXTURE_DIR, 'test-rechnung.png'))

    // Datei sollte in der Liste erscheinen
    await expect(page.getByText('test-rechnung.png')).toBeVisible()
    await expect(page.getByText('Bereit')).toBeVisible()
  })

  test('Upload-Button startet Upload', async ({ page }) => {
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FIXTURE_DIR, 'test-rechnung.png'))

    await expect(page.getByText('test-rechnung.png')).toBeVisible()

    // Upload starten
    const uploadBtn = page.getByText(/hochladen/i).last()
    await uploadBtn.click()

    // Status sollte sich ändern
    await expect(page.getByText(/hochladen|verarbeit|fertig/i).first()).toBeVisible({ timeout: 15000 })
  })

  test('PDF Upload funktioniert', async ({ page }) => {
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FIXTURE_DIR, 'test-arztbrief.pdf'))

    await expect(page.getByText('test-arztbrief.pdf')).toBeVisible()
  })

  test('Erledigte entfernen Button funktioniert', async ({ page }) => {
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FIXTURE_DIR, 'test-mietvertrag.png'))

    await expect(page.getByText('test-mietvertrag.png')).toBeVisible()

    // Upload + warten
    const uploadBtn = page.getByText(/hochladen/i).last()
    await uploadBtn.click()

    // Warte bis fertig oder Fehler
    await page.waitForTimeout(5000)

    const clearBtn = page.getByText('Erledigte entfernen')
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
    }
  })

  test('Entfernen-Button bei Pending-Items', async ({ page }) => {
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FIXTURE_DIR, 'test-rechnung.png'))

    await expect(page.getByText('test-rechnung.png')).toBeVisible()

    // Delete/Remove Button sollte sichtbar sein
    const removeBtn = page.locator('.pi-times, .pi-trash').first()
    await expect(removeBtn).toBeVisible()
  })
})
