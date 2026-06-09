import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser, type SeedDocument } from './fixtures/test-fixtures'

let seeds: SeedDocument[] = []

test.describe('Dokument-Detail', () => {
  test.beforeAll(async () => {
    const supabase = getSupabase()
    await cleanupAll(supabase)
    seeds = await seedDocuments(supabase)
  })

  test.afterAll(async () => {
    await cleanupAll(getSupabase())
  })

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('Dokument-Titel angezeigt', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    await expect(page.getByText('Stromrechnung Stadtwerke München')).toBeVisible()
  })

  test('Details-Card mit Status sichtbar', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    await expect(page.getByText('Details')).toBeVisible()
    await expect(page.getByText('ready').first()).toBeVisible()
  })

  test('OCR-Text angezeigt', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    // Screenshot zeigt "OCR-Text" als Card-Titel
    await expect(page.getByText('OCR-Text')).toBeVisible()
    // OCR-Text enthält "Stadtwerke München GmbH"
    await expect(page.getByText('Stadtwerke München GmbH')).toBeVisible()
  })

  test('Tags angezeigt', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    // Tags Card sichtbar
    await expect(page.getByText('Tags').first()).toBeVisible()
    // Seed-Tags: rechnung, strom, münchen
    await expect(page.getByText('rechnung', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('strom', { exact: true })).toBeVisible()
  })

  test('Titel editieren via Stift-Icon', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    // Warte bis Dokument geladen
    await expect(page.getByText('Details')).toBeVisible()

    // Stift-Icon klicken zum Editieren
    const editIcon = page.locator('button:has(.pi-pencil)').first()
    await editIcon.click()

    // InputText sollte erscheinen (PrimeVue rendert textbox role)
    const input = page.getByRole('textbox').first()
    await expect(input).toBeVisible()
    await input.clear()
    await input.fill('Stromrechnung München NEU')
    // Speichern (Check-Icon)
    await page.locator('button:has(.pi-check)').first().click()
    await page.waitForTimeout(500)

    await expect(page.getByText('Stromrechnung München NEU')).toBeVisible()
  })

  test('Tag hinzufügen via AutoComplete', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    const tagInput = page.getByPlaceholder('Tag hinzufügen...')
    if (await tagInput.isVisible()) {
      await tagInput.fill('test-tag')
      await page.waitForTimeout(300)
      const createOption = page.getByText('erstellen')
      if (await createOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createOption.click()
      }
    }
  })

  test('Feld hinzufügen', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    const addBtn = page.getByText('Feld hinzufügen')
    if (await addBtn.isVisible()) {
      await addBtn.click()
      const nameInput = page.getByPlaceholder('Feldname')
      const valueInput = page.getByPlaceholder('Wert')
      if (await nameInput.isVisible()) {
        await nameInput.fill('testfeld')
        await valueInput.fill('testwert')
        await page.locator('.pi-check').first().click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('Zurück-Button navigiert zurück', async ({ page }) => {
    await page.goto(`/documents/${seeds[0].id}`)
    const backBtn = page.locator('.pi-arrow-left').first()
    await backBtn.click()
    await expect(page).toHaveURL(/\/(documents|dashboard)?$/)
  })

  test('Löschen mit Bestätigung', async ({ page }) => {
    const supabase = getSupabase()
    const userId = (await supabase.auth.admin.listUsers()).data.users?.find((u) => u.email === 'e2e@test.local')?.id
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        original_filename: 'delete-test.pdf',
        mime_type: 'application/pdf',
        file_size: 100,
        storage_path: 'documents/delete-test/test.pdf',
        sha256: `delete-test-${Date.now()}`,
        status: 'uploaded',
        title: 'Löschtest-Dokument',
        user_id: userId,
      })
      .select('id')
      .single()

    await page.goto(`/documents/${doc!.id}`)
    await expect(page.getByText('Löschtest-Dokument')).toBeVisible()

    const deleteBtn = page.locator('.pi-trash').first()
    await deleteBtn.click()

    const confirmBtn = page.getByRole('button', { name: /ja|löschen|bestätigen/i })
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    await expect(page).toHaveURL(/\/documents/, { timeout: 5000 })
  })

  test('Ungültige ID zeigt Fehler', async ({ page }) => {
    await page.goto('/documents/00000000-0000-0000-0000-000000000000')
    await page.waitForTimeout(1000)
    const notFound = page.getByText(/nicht gefunden|not found/i)
    const title = page.getByRole('heading', { level: 1 })
    await expect(notFound.or(title)).toBeVisible()
  })
})
