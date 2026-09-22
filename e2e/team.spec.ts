import { test, expect, getSupabase, seedDocuments, cleanupAll, loginAsTestUser, orgOf, testUserId } from './fixtures/test-fixtures'

const INVITED = `e2e-team-${Date.now()}@test.local`

async function removeInvited() {
  const supabase = getSupabase()
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  for (const user of data.users.filter(u => u.email?.startsWith('e2e-team-')))
    await supabase.auth.admin.deleteUser(user.id)
}

test.describe('Team und Rechte', () => {
  test.beforeAll(async () => {
    const supabase = getSupabase()
    await cleanupAll(supabase)
    await seedDocuments(supabase)
  })

  test.afterAll(async () => {
    const supabase = getSupabase()
    await removeInvited()
    const orgId = await orgOf(supabase, await testUserId(supabase))
    await supabase.from('restricted_document_types').delete().eq('org_id', orgId)
    await supabase.from('organizations').update({ name: 'e2e@test.local', kind: 'privat' }).eq('id', orgId)
    await cleanupAll(supabase)
  })

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('Team zeigt die angemeldete Person als Admin', async ({ page }) => {
    await page.goto('/settings')
    const team = page.getByTestId('team-card')
    await expect(team.getByText('Team', { exact: true })).toBeVisible()
    const me = team.getByTestId('member-row').filter({ hasText: 'e2e@test.local' })
    await expect(me).toContainText('Admin')
  })

  test('Admin benennt die Organisation', async ({ page }) => {
    await page.goto('/settings')
    const team = page.getByTestId('team-card')
    await team.getByLabel('Name der Organisation').fill('Muster Treuhand AG')
    await team.getByRole('button', { name: 'Namen speichern' }).click()
    await expect(page.getByText('Name gespeichert')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('team-card').getByLabel('Name der Organisation')).toHaveValue('Muster Treuhand AG')
  })

  test('Admin lädt per E-Mail ein, ändert die Rolle und entfernt die Person wieder', async ({ page }) => {
    await page.goto('/settings')
    const team = page.getByTestId('team-card')
    await team.getByLabel('E-Mail der neuen Person').fill(INVITED)
    await team.getByRole('button', { name: 'Einladen' }).click()
    await expect(page.getByText('Einladung verschickt')).toBeVisible()

    const row = team.getByTestId('member-row').filter({ hasText: INVITED })
    await expect(row).toContainText('Mitglied')

    await row.getByRole('button', { name: 'Zum Admin machen' }).click()
    await expect(row).toContainText('Admin')
    await row.getByRole('button', { name: 'Zum Mitglied machen' }).click()
    await expect(row).toContainText('Mitglied')

    await row.getByRole('button', { name: 'Entfernen' }).click()
    await page.getByRole('button', { name: 'Ja, entfernen' }).click()
    await expect(team.getByTestId('member-row').filter({ hasText: INVITED })).toHaveCount(0)
  })

  test('Admin sperrt einen Dokumenttyp für Mitglieder', async ({ page }) => {
    await page.goto('/settings')
    const row = page.getByRole('row').filter({ hasText: 'Arztbrief' })
    await row.getByLabel('Nur Admins').check()
    await expect(page.getByText('Arztbrief nur noch für Admins')).toBeVisible()

    const supabase = getSupabase()
    const orgId = await orgOf(supabase, await testUserId(supabase))
    const { data } = await supabase.from('restricted_document_types').select('document_type').eq('org_id', orgId)
    expect(data!.map(r => r.document_type)).toContain('medical_letter')
  })

  test('Protokoll zeigt, wer was hochgeladen und geändert hat', async ({ page }) => {
    await page.goto('/settings')
    const log = page.getByTestId('audit-card')
    await expect(log.getByText('Protokoll')).toBeVisible()
    await expect(log.getByText('Stromrechnung Stadtwerke München').first()).toBeVisible()
    await expect(log.getByText('hochgeladen').first()).toBeVisible()
  })
})
