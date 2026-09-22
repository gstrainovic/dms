import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser } from './fixtures/test-fixtures'

test.describe('Einstellungen', () => {
  // Eigene Schemas sind pro Organisation eindeutig; ein Rest aus einem früheren Lauf liesse «Schema erstellen» scheitern
  const removeTestSchema = () => getSupabase().from('document_schemas').delete().eq('document_type', 'e2e_test')

  test.beforeAll(async () => {
    const supabase = getSupabase()
    await cleanupAll(supabase)
    await removeTestSchema()
    await seedDocuments(supabase)
  })

  test.afterAll(async () => {
    await removeTestSchema()
    await cleanupAll(getSupabase())
  })

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('Seite lädt mit Überschrift', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
  })

  test('Design/Theme-Auswahl sichtbar', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('Design')).toBeVisible()
    await expect(page.getByText('Farbschema')).toBeVisible()
  })

  test('Abo & Nutzung zeigt Plan, Zähler und Upgrade', async ({ page }) => {
    await page.goto('/settings')
    const card = page.getByTestId('billing-card')
    await expect(card).toBeVisible()
    await expect(card.getByText('Abo & Nutzung')).toBeVisible()
    await expect(card.getByTestId('current-plan')).toHaveText(/Starter/)
    await expect(card.getByText('Texterkennung (Seiten)')).toBeVisible()
    await expect(card.getByText('KI-Tokens')).toBeVisible()
    await expect(card.getByTestId('usage-ocrPages')).toHaveText(/\d+ von 100/)
    await expect(card.getByTestId('usage-chatTokens')).toHaveText(/von 500’000/)
    await expect(card.getByRole('button', { name: /Pro/ })).toBeVisible()
  })

  test('Schemas-Tabelle sichtbar', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('Dokumenten-Schemas')).toBeVisible()
  })

  test('Neues Schema Button öffnet Dialog', async ({ page }) => {
    await page.goto('/settings')
    const newSchemaBtn = page.getByText('Neues Schema')
    await expect(newSchemaBtn).toBeVisible()
    await newSchemaBtn.click()

    // Dialog sollte erscheinen
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Speichern', exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeVisible()
  })

  test('Schema erstellen', async ({ page }) => {
    await page.goto('/settings')
    await page.getByText('Neues Schema').click()

    // Formular ausfüllen
    const inputs = page.locator('.p-dialog input, .p-dialog textarea')

    if (await inputs.first().isVisible()) {
      // Name
      await inputs.nth(0).fill('E2E Test Schema')
      // Typ
      await inputs.nth(1).fill('e2e_test')
      // Beschreibung
      await inputs.nth(2).fill('Schema für E2E Tests')

      await page.getByRole('dialog').getByRole('button', { name: 'Speichern', exact: true }).click()
      await expect(page.getByText('Schema erstellt')).toBeVisible()
    }
  })

  test('Tags als Chips angezeigt', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('Tags')).toBeVisible()
    // Mindestens ein Tag aus Seed-Daten
    await expect(page.getByText('rechnung', { exact: true }).first()).toBeVisible()
  })

  test('Schema bearbeiten öffnet Dialog', async ({ page }) => {
    await page.goto('/settings')
    // Warte auf Schema-Tabelle
    await page.waitForTimeout(500)

    // Mitgelieferte Schemas sind nicht änderbar, das eigene aus «Schema erstellen» schon
    await expect(page.getByRole('row').filter({ hasText: 'Rechnung' }).first()).toContainText('mitgeliefert')
    await page.getByRole('row').filter({ hasText: 'E2E Test Schema' }).locator('.pi-pencil').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Speichern', exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('Tag entfernen', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(500)

    // Chip mit Remove-Button
    const removeBtn = page.locator('.p-chip .pi-times, .p-chip-remove-icon').first()
    if (await removeBtn.isVisible()) {
      await removeBtn.click()
      await page.waitForTimeout(500)
    }
  })
})
