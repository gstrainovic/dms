import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser } from './fixtures/test-fixtures'

test.describe('Suche', () => {
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

  test('Suchfeld und Suchen-Button sichtbar', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('heading', { name: 'Suche' })).toBeVisible()
    await expect(page.getByPlaceholder(/durchsuchen/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Suchen/i })).toBeVisible()
  })

  test('Initial-Zustand zeigt Suchhinweis', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByText(/Suchbegriff/i)).toBeVisible()
  })

  test('Volltext-Suche liefert Ergebnisse', async ({ page }) => {
    await page.goto('/search')
    await page.getByPlaceholder(/durchsuchen/i).fill('Rechnung')
    await page.getByRole('button', { name: /Suchen/i }).click()

    await expect(page.getByText(/Ergebnis/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Stromrechnung').first()).toBeVisible()
  })

  test('Ergebnis-Karten mit Titel', async ({ page }) => {
    await page.goto('/search')
    await page.getByPlaceholder(/durchsuchen/i).fill('München')
    await page.getByRole('button', { name: /Suchen/i }).click()

    await expect(page.getByText(/Ergebnis/)).toBeVisible({ timeout: 10000 })
  })

  test('Keine Ergebnisse für Unsinn-Query', async ({ page }) => {
    await page.goto('/search')
    await page.getByPlaceholder(/durchsuchen/i).fill('xyzquarkzypern42')
    await page.getByRole('button', { name: /Suchen/i }).click()

    await expect(page.getByText(/[Kk]eine Ergebnisse/)).toBeVisible({ timeout: 10000 })
  })

  test('Klick auf Ergebnis navigiert zu Detail', async ({ page }) => {
    await page.goto('/search')
    await page.getByPlaceholder(/durchsuchen/i).fill('Rechnung')
    await page.getByRole('button', { name: /Suchen/i }).click()

    await expect(page.getByText('Stromrechnung').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('Stromrechnung').first().click()
    await expect(page).toHaveURL(/\/documents\//)
  })

  test('Modus-Toggle sichtbar', async ({ page }) => {
    await page.goto('/search')
    // Volltext/Hybrid Toggle — entweder als SelectButton oder separate Buttons
    const volltextBtn = page.getByRole('button', { name: 'Volltext' })
    await expect(volltextBtn).toBeVisible()
  })
})
