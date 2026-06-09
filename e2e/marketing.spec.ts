import { test, expect, acceptCookies } from './fixtures/test-fixtures'

test.describe('Marketing-Seiten', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookies(page)
  })

  test('Landing: Hero-Überschrift und CTA sichtbar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /intelligent verwaltet/i })).toBeVisible()
    await expect(page.getByText('Jetzt starten')).toBeVisible()
    await expect(page.getByText('Features ansehen')).toBeVisible()
  })

  test('Landing: Feature-Grid zeigt alle 6 Features', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('OCR-Erkennung').first()).toBeVisible()
    await expect(page.getByText('Auto-Tagging').first()).toBeVisible()
    await expect(page.getByText('Hybrid-Suche').first()).toBeVisible()
    await expect(page.getByText('RAG-Chat').first()).toBeVisible()
    await expect(page.getByText('Einfacher Upload')).toBeVisible()
    await expect(page.getByText('Datenschutz').first()).toBeVisible()
  })

  test('Landing: CTA navigiert zu Login', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Jetzt starten').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Features: Überschrift und alle Sektionen', async ({ page }) => {
    await page.goto('/features')
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible()
    await expect(page.getByText('Mistral OCR')).toBeVisible()
    await expect(page.getByText('Feld-Extraktion')).toBeVisible()
    await expect(page.getByText('Volltextsuche')).toBeVisible()
    await expect(page.getByText('Retrieval-Augmented Generation')).toBeVisible()
    await expect(page.getByText('Flexibler Upload')).toBeVisible()
    await expect(page.getByText('Sicherheit')).toBeVisible()
  })

  test('Preise: Starter und Pro Plan', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: 'Preise' })).toBeVisible()
    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('Gratis')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()
    await expect(page.getByText('CHF 19')).toBeVisible()
    await expect(page.getByText('Empfohlen')).toBeVisible()
  })

  test('Über uns: Firma und Kontakt', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { name: 'Über uns' })).toBeVisible()
    await expect(page.getByText('Strainovic IT').first()).toBeVisible()
    await expect(page.getByText('Steinach').first()).toBeVisible()
    await expect(page.getByText('info@strainovic-it.ch')).toBeVisible()
  })

  test('FAQ: Fragen und Antworten sichtbar', async ({ page }) => {
    await page.goto('/faq')
    await expect(page.getByRole('heading', { name: 'Häufig gestellte Fragen' })).toBeVisible()
    await expect(page.getByText('Welche Dateiformate werden unterstützt?')).toBeVisible()
    await expect(page.getByText('PNG, JPG und PDF')).toBeVisible()
    await expect(page.getByText('Sind meine Daten sicher?')).toBeVisible()
    await expect(page.getByText('Row Level Security')).toBeVisible()
  })

  test('Marketing-Header: Navigation-Links', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('header')
    await expect(header.getByText('DMS')).toBeVisible()
    await expect(header.getByText('Features')).toBeVisible()
    await expect(header.getByText('Preise')).toBeVisible()
    await expect(header.getByText('Über uns')).toBeVisible()
    await expect(header.getByText('FAQ')).toBeVisible()
    await expect(header.getByText('Anmelden')).toBeVisible()
  })

  test('Marketing-Footer: Impressum und Datenschutz Links', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer.getByText('Strainovic IT')).toBeVisible()
    await expect(footer.getByText('Impressum')).toBeVisible()
    await expect(footer.getByText('Datenschutz')).toBeVisible()
  })

  test('Header-Navigation funktioniert', async ({ page }) => {
    await page.goto('/')
    await page.locator('header').getByText('Features').click()
    await expect(page).toHaveURL(/\/features/)
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible()
  })
})
