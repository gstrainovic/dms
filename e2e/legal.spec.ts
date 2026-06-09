import { test, expect, acceptCookies } from './fixtures/test-fixtures'

test.describe('Legal-Seiten', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookies(page)
  })

  // --- Impressum ---

  test('Impressum: Überschrift und Firmenangaben', async ({ page }) => {
    await page.goto('/impressum')
    await expect(page.getByRole('heading', { name: 'Impressum' })).toBeVisible()
    await expect(page.getByText('Strainovic IT').first()).toBeVisible()
    await expect(page.getByText('Goran Strainovic').first()).toBeVisible()
    await expect(page.getByText('Bahnstr. 9b')).toBeVisible()
    await expect(page.getByText('9323 Steinach')).toBeVisible()
  })

  test('Impressum: Kontakt-E-Mail als Link', async ({ page }) => {
    await page.goto('/impressum')
    const emailLink = page.getByRole('link', { name: 'info@strainovic-it.ch' })
    await expect(emailLink).toBeVisible()
    await expect(emailLink).toHaveAttribute('href', 'mailto:info@strainovic-it.ch')
  })

  test('Impressum: Rechtsgrundlage und Sektionen', async ({ page }) => {
    await page.goto('/impressum')
    await expect(page.getByText('Art. 3 UWG')).toBeVisible()
    await expect(page.getByText('Vertretungsberechtigte Person')).toBeVisible()
    await expect(page.getByText('Haftungsausschluss')).toBeVisible()
  })

  test('Impressum: EU-Hinweis mit Link zu Datenschutz', async ({ page }) => {
    await page.goto('/impressum')
    await expect(page.getByText('Hinweis für EU-Nutzer')).toBeVisible()
    await expect(page.getByText('DSGVO')).toBeVisible()
    const dsLink = page.getByRole('link', { name: 'Datenschutzerklärung' })
    await expect(dsLink).toBeVisible()
    await dsLink.click()
    await expect(page).toHaveURL(/\/datenschutz/)
  })

  // --- Datenschutz ---

  test('Datenschutz: Überschrift und Verantwortlicher', async ({ page }) => {
    await page.goto('/datenschutz')
    await expect(page.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeVisible()
    await expect(page.getByText('Verantwortlicher')).toBeVisible()
    await expect(page.getByText('Strainovic IT').first()).toBeVisible()
    await expect(page.getByText('Goran Strainovic').first()).toBeVisible()
  })

  test('Datenschutz: Alle 9 Sektionen vorhanden', async ({ page }) => {
    await page.goto('/datenschutz')
    const sections = [
      '1. Verantwortlicher',
      '2. Rechtsgrundlagen',
      '3. Erhobene Daten',
      '4. Hosting & Infrastruktur',
      '5. Drittanbieter-Dienste',
      '6. Cookies & Local Storage',
      '7. Datenisolierung',
      '8. Ihre Rechte',
      '9. Änderungen',
    ]
    for (const section of sections) {
      await expect(page.getByText(section)).toBeVisible()
    }
  })

  test('Datenschutz: Rechtsgrundlagen DSG und DSGVO erwähnt', async ({ page }) => {
    await page.goto('/datenschutz')
    await expect(page.getByText('DSG')).toBeVisible()
    await expect(page.getByText('DSGVO', { exact: false })).toBeVisible()
  })

  test('Datenschutz: Drittanbieter Mistral AI erwähnt', async ({ page }) => {
    await page.goto('/datenschutz')
    await expect(page.getByText('Mistral AI API')).toBeVisible()
    await expect(page.getByText('Mistral AI, Paris, Frankreich')).toBeVisible()
  })

  test('Datenschutz: Betroffenenrechte aufgelistet', async ({ page }) => {
    await page.goto('/datenschutz')
    await expect(page.getByText('Recht auf Auskunft')).toBeVisible()
    await expect(page.getByText('Recht auf Löschung')).toBeVisible()
    await expect(page.getByText('Recht auf Datenübertragbarkeit')).toBeVisible()
  })

  test('Datenschutz: Row Level Security erwähnt', async ({ page }) => {
    await page.goto('/datenschutz')
    await expect(page.getByText('Row Level Security')).toBeVisible()
    await expect(page.getByText('isolierten Datenbereich')).toBeVisible()
  })
})
