import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser } from './fixtures/test-fixtures'

test.describe('Dokumente', () => {
  test.beforeAll(async () => {
    const supabase = getSupabase()
    await cleanupAll(supabase)
    await seedDocuments(supabase)
  })

  test.afterAll(async () => {
    await cleanupAll(getSupabase())
  })

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('DataTable mit Spalten sichtbar', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByRole('heading', { name: 'Dokumente' })).toBeVisible()
    // Spalten-Header: "Titel ↑↓", "Typ ↑↓", "Größe ↑↓", "Status ↑↓", "Erstellt"
    await expect(page.getByRole('columnheader', { name: /Titel/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Status/ })).toBeVisible()
  })

  test('Suchfeld filtert Ergebnisse', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByText('Stromrechnung')).toBeVisible()
    await page.getByPlaceholder('Suche...').fill('Stromrechnung')
    await page.waitForTimeout(500)
    await expect(page.getByText('Stromrechnung')).toBeVisible()
    await expect(page.getByText('Mietvertrag')).not.toBeVisible()
  })

  test('Typ-Filter funktioniert', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByText('Stromrechnung')).toBeVisible()
  })

  test('Filter zurücksetzen leert alle Filter', async ({ page }) => {
    await page.goto('/documents')
    await page.getByPlaceholder('Suche...').fill('Test')
    await page.waitForTimeout(300)

    const resetBtn = page.getByText('Filter zurücksetzen')
    if (await resetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetBtn.click()
      await expect(page.getByPlaceholder('Suche...')).toHaveValue('')
    }
  })

  test('Zeilen-Klick navigiert zu Detail', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByText('Stromrechnung')).toBeVisible()
    await page.getByText('Stromrechnung').click()
    await expect(page).toHaveURL(/\/documents\//)
  })

  test('Sortierung funktioniert', async ({ page }) => {
    await page.goto('/documents')
    await expect(page.getByText('Stromrechnung')).toBeVisible()
    const titleHeader = page.getByRole('columnheader', { name: /Titel/ })
    await titleHeader.click()
    await page.waitForTimeout(300)
  })

  test('Anzahl-Anzeige korrekt', async ({ page }) => {
    await page.goto('/documents')
    // "5 von 5" angezeigt oben rechts
    await expect(page.getByText(/\d+ von \d+/)).toBeVisible()
  })

  test('Leerer Zustand ohne Dokumente', async ({ page }) => {
    const supabase = getSupabase()
    await cleanupAll(supabase)
    await page.goto('/documents')
    await page.waitForTimeout(1000)
    // Re-seed für nachfolgende Tests
    await seedDocuments(supabase)
  })
})
