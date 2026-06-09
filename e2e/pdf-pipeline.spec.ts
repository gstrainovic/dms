import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect, getSupabase, cleanupAll, loginAsTestUser } from './fixtures/test-fixtures'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = path.join(__dirname, 'fixtures')

test.describe('PDF-Pipeline (lokale Text-Extraktion)', () => {
  test.beforeAll(async () => {
    await cleanupAll(getSupabase())
  })

  test.afterAll(async () => {
    await cleanupAll(getSupabase())
  })

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('PDF-Upload extrahiert Text und durchläuft Pipeline', async ({ page }) => {
    const supabase = getSupabase()

    // 1. PDF hochladen via UI
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(path.join(FIXTURE_DIR, 'test-arztbrief.pdf'))
    await expect(page.getByText('test-arztbrief.pdf')).toBeVisible()

    const uploadBtn = page.getByText(/hochladen/i).last()
    await uploadBtn.click()

    // 2. Warten bis Dokument in DB erscheint (statt auf UI-Text zu matchen)
    let docId: string | null = null
    const maxUploadWait = 15000
    const uploadStart = Date.now()
    while (Date.now() - uploadStart < maxUploadWait) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id')
        .eq('original_filename', 'test-arztbrief.pdf')
        .order('created_at', { ascending: false })
        .limit(1)

      if (docs && docs.length > 0) {
        docId = docs[0].id
        break
      }
      await page.waitForTimeout(500)
    }

    expect(docId).not.toBeNull()

    // 3. Warten bis Pipeline mindestens ocr_done erreicht
    const maxWaitMs = 30000
    const start = Date.now()
    let finalDoc: any = null
    while (Date.now() - start < maxWaitMs) {
      const { data } = await supabase
        .from('documents')
        .select('id, status, ocr_text, page_count, mime_type')
        .eq('id', docId!)
        .single()

      if (data && ['ocr_done', 'extracted', 'ready'].includes(data.status)) {
        finalDoc = data
        break
      }
      if (data?.status === 'error') {
        finalDoc = data
        break
      }
      await page.waitForTimeout(1000)
    }

    expect(finalDoc).not.toBeNull()

    // 4. Prüfen: Text wurde extrahiert
    expect(finalDoc.mime_type).toBe('application/pdf')
    expect(finalDoc.status).not.toBe('error')
    expect(['ocr_done', 'extracted', 'ready']).toContain(finalDoc.status)
    expect(finalDoc.ocr_text).not.toBeNull()
    expect(finalDoc.ocr_text.length).toBeGreaterThan(50)
    expect(finalDoc.page_count).toBeGreaterThanOrEqual(1)

    // 5. Detail-Seite: OCR-Text sichtbar
    await page.goto(`/documents/${finalDoc.id}`)
    await expect(page.getByText('OCR-Text')).toBeVisible({ timeout: 5000 })
  })
})
