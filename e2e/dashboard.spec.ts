import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser, type SeedDocument } from './fixtures/test-fixtures'

let seeds: SeedDocument[] = []

test.describe('Dashboard', () => {
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

  test('Seite lädt mit Dashboard-Überschrift', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('4 Stat-Cards sichtbar', async ({ page }) => {
    await page.goto('/dashboard')
    // Aus Screenshot: "Gesamt", "Bereit", "Verarbeitung", "Fehler"
    await expect(page.getByText('Gesamt')).toBeVisible()
    await expect(page.getByText('Bereit')).toBeVisible()
    await expect(page.getByText('Verarbeitung').first()).toBeVisible()
    await expect(page.getByText('Fehler').first()).toBeVisible()
  })

  test('Stats zeigen korrekte Zahlen', async ({ page }) => {
    await page.goto('/dashboard')
    // 5 Dokumente geseedet: 3 ready, 1 processing, 1 error
    await expect(page.getByText('5').first()).toBeVisible()
  })

  test('Klick auf Gesamt navigiert zu /documents', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByText('Gesamt').click()
    await expect(page).toHaveURL(/\/documents/)
  })

  test('Neueste Dokumente angezeigt', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Neueste Dokumente')).toBeVisible()
    await expect(page.getByText('Stromrechnung').first()).toBeVisible()
  })

  test('Klick auf Dokument navigiert zu Detail', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByText('Stromrechnung').first().click()
    await expect(page).toHaveURL(/\/documents\//)
  })

  test('Tags-Sektion sichtbar', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/Tags \(\d+\)/)).toBeVisible()
  })

  test('Dokumenttypen-Verteilung angezeigt', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Dokumenttypen')).toBeVisible()
  })
})
