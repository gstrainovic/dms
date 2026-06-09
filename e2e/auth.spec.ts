import { test, expect } from './fixtures/test-fixtures'

test.describe('Authentifizierung', () => {
  // --- Login-Seite ---

  test('Login: Überschrift und Email-Formular sichtbar', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'DMS' })).toBeVisible()
    await expect(page.getByText('Dokumentenmanagement-System')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible()
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Code senden' })).toBeVisible()
  })

  test('Login: Code-senden-Button disabled ohne Email', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Code senden' })).toBeDisabled()
  })

  test('Login: Code-senden-Button enabled mit Email', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-Mail').fill('test@beispiel.ch')
    await expect(page.getByRole('button', { name: 'Code senden' })).toBeEnabled()
  })

  // --- Auth Guard ---

  test('Auth Guard: Geschützte Route leitet zu /login um', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Auth Guard: /documents leitet zu /login um', async ({ page }) => {
    await page.goto('/documents')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Auth Guard: /upload leitet zu /login um', async ({ page }) => {
    await page.goto('/upload')
    await expect(page).toHaveURL(/\/login/)
  })

  // --- Öffentliche Routen ohne Auth erreichbar ---

  test('Öffentliche Routen ohne Auth erreichbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /intelligent verwaltet/i })).toBeVisible()

    await page.goto('/features')
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible()

    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: 'Preise' })).toBeVisible()

    await page.goto('/impressum')
    await expect(page.getByRole('heading', { name: 'Impressum' })).toBeVisible()

    await page.goto('/datenschutz')
    await expect(page.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeVisible()
  })

  // --- Login-Redirect nach Auth ---

  test('Login: /login leitet zu /dashboard wenn eingeloggt', async ({ page }) => {
    // loginAsTestUser muss VOR page.goto aufgerufen werden (injiziert via addInitScript)
    const { loginAsTestUser } = await import('./fixtures/test-fixtures')
    await loginAsTestUser(page)
    // Zuerst zu / um initScript auszuführen, dann zu /login
    await page.goto('/')
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })
})
