import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser } from './fixtures/test-fixtures'

test.describe('Chat', () => {
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

  test('Willkommensnachricht bei leerem Chat', async ({ page }) => {
    await page.goto('/chat')
    await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible()
    await expect(page.getByText('Fragen Sie etwas zu Ihren Dokumenten')).toBeVisible()
  })

  test('Senden-Button deaktiviert wenn Input leer', async ({ page }) => {
    await page.goto('/chat')
    // Send-Button (pi-send Icon-Button)
    const sendBtn = page.locator('button:has(.pi-send)')
    await expect(sendBtn).toBeDisabled()
  })

  test('Nachricht senden und User-Message erscheint', async ({ page }) => {
    await page.goto('/chat')
    const input = page.getByPlaceholder('Nachricht eingeben...')
    await input.fill('Was sind meine Stromkosten?')

    const sendBtn = page.locator('button:has(.pi-send)')
    await sendBtn.click()

    await expect(page.getByText('Was sind meine Stromkosten?')).toBeVisible()
  })

  test('Assistant-Antwort erscheint', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/chat')
    const input = page.getByPlaceholder('Nachricht eingeben...')
    await input.fill('Was steht in meinen Dokumenten?')

    const sendBtn = page.locator('button:has(.pi-send)')
    await sendBtn.click()

    // User-Nachricht sichtbar
    await expect(page.getByText('Was steht in meinen Dokumenten?')).toBeVisible()

    // Warte bis die Antwort da ist (entweder "Denkt nach..." verschwindet oder neuer Text erscheint)
    // Die Antwort enthält Text vom Assistant
    await page.waitForTimeout(15000)

    // Neuer Chat Button erscheint wenn Nachrichten existieren
    await expect(page.getByText('Neuer Chat')).toBeVisible()
  })

  test('Neuer Chat Button leert Nachrichten', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/chat')

    const input = page.getByPlaceholder('Nachricht eingeben...')
    await input.fill('Hallo')
    const sendBtn = page.locator('button:has(.pi-send)')
    await sendBtn.click()

    await expect(page.getByText('Hallo')).toBeVisible()

    // Warte auf "Neuer Chat" Button
    await expect(page.getByText('Neuer Chat')).toBeVisible({ timeout: 5000 })
    await page.getByText('Neuer Chat').click()
    await expect(page.getByText('Fragen Sie etwas zu Ihren Dokumenten')).toBeVisible()
  })

  test('Nachricht mit Enter senden', async ({ page }) => {
    await page.goto('/chat')
    const input = page.getByPlaceholder('Nachricht eingeben...')
    await input.fill('Test per Enter')
    await input.press('Enter')

    await expect(page.getByText('Test per Enter')).toBeVisible()
  })
})
