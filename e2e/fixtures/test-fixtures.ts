import { test as base, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const TEST_EMAIL = 'e2e@test.local'

export function getSupabase(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

/** Erstellt Test-User per Admin API und gibt die User-ID zurück */
async function ensureTestUser(supabase: SupabaseClient): Promise<string> {
  // Prüfe ob User existiert
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existing = users?.find((u) => u.email === TEST_EMAIL)
  if (existing) return existing.id

  // User erstellen
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
  })
  if (error) throw new Error(`Test-User erstellen fehlgeschlagen: ${error.message}`)
  return data.user.id
}

/** Generiert einen Auth-Link per Admin API und extrahiert das Token */
async function getTestUserSession(supabase: SupabaseClient): Promise<{ access_token: string; refresh_token: string }> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
  })
  if (error) throw new Error(`Auth-Link generieren fehlgeschlagen: ${error.message}`)

  // Token aus dem Magic Link extrahieren und verifizieren
  const url = new URL(data.properties.action_link)
  const token = url.searchParams.get('token')
  if (!token) throw new Error('Kein Token im Magic Link')

  // Token verifizieren um Session zu bekommen
  const anonClient = createClient(SUPABASE_URL, ANON_KEY)
  const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
    token_hash: token,
    type: 'magiclink',
  })
  if (verifyError) throw new Error(`Token-Verifizierung fehlgeschlagen: ${verifyError.message}`)
  if (!verifyData.session) throw new Error('Keine Session nach Verifizierung')

  return {
    access_token: verifyData.session.access_token,
    refresh_token: verifyData.session.refresh_token,
  }
}

/** Loggt den Test-User im Browser ein (injiziert Session in localStorage) */
export async function loginAsTestUser(page: Page): Promise<string> {
  const supabase = getSupabase()
  const userId = await ensureTestUser(supabase)
  const session = await getTestUserSession(supabase)

  // Session in localStorage injizieren bevor die Seite lädt
  await page.addInitScript(({ url, anonKey, accessToken, refreshToken }) => {
    const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }))
    // Cookie Banner automatisch akzeptieren
    localStorage.setItem('cookie-consent', 'accepted')
  }, {
    url: SUPABASE_URL,
    anonKey: ANON_KEY,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  })

  return userId
}

/** Cookie Banner für Tests ohne Login akzeptieren */
export async function acceptCookies(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted')
  })
}

export interface SeedDocument {
  id: string
  title: string
  document_type: string
  status: string
}

/** Erstellt Test-Dokumente direkt in der DB (mit user_id) */
export async function seedDocuments(supabase: SupabaseClient, userId?: string): Promise<SeedDocument[]> {
  // Falls keine userId, Test-User sicherstellen
  if (!userId) {
    userId = await ensureTestUser(supabase)
  }

  const docs = [
    {
      original_filename: 'e2e-rechnung.pdf',
      mime_type: 'application/pdf',
      file_size: 4096,
      storage_path: `documents/e2e-seed-1/rechnung.pdf`,
      sha256: `e2e-seed-rechnung-${Date.now()}`,
      status: 'ready',
      title: 'Stromrechnung Stadtwerke München',
      ocr_text: 'Stadtwerke München GmbH. Rechnung Nr SM-2024-001. Stromlieferung. Betrag: 127,50 EUR. Kunde: Max Mustermann. Kundennr: 12345678.',
      document_type: 'invoice',
      user_id: userId,
    },
    {
      original_filename: 'e2e-vertrag.pdf',
      mime_type: 'application/pdf',
      file_size: 8192,
      storage_path: `documents/e2e-seed-2/vertrag.pdf`,
      sha256: `e2e-seed-vertrag-${Date.now()}`,
      status: 'ready',
      title: 'Mietvertrag Wohnung Schwabing',
      ocr_text: 'Mietvertrag zwischen Vermieter Hans Schmidt und Mieter Anna Müller. 3-Zimmer-Wohnung in München-Schwabing. Kaltmiete: 1.200 EUR monatlich.',
      document_type: 'contract',
      user_id: userId,
    },
    {
      original_filename: 'e2e-arztbrief.pdf',
      mime_type: 'application/pdf',
      file_size: 2048,
      storage_path: `documents/e2e-seed-3/arztbrief.pdf`,
      sha256: `e2e-seed-arztbrief-${Date.now()}`,
      status: 'ready',
      title: 'Arztbrief Dr. Weber',
      ocr_text: 'Dr. med. Weber, Praxis für Innere Medizin. Diagnose: Grippaler Infekt. Therapie: Bettruhe und Ibuprofen 400mg.',
      document_type: 'medical_letter',
      user_id: userId,
    },
    {
      original_filename: 'e2e-processing.png',
      mime_type: 'image/png',
      file_size: 1024,
      storage_path: `documents/e2e-seed-4/processing.png`,
      sha256: `e2e-seed-processing-${Date.now()}`,
      status: 'processing',
      title: 'Dokument in Verarbeitung',
      user_id: userId,
    },
    {
      original_filename: 'e2e-error.png',
      mime_type: 'image/png',
      file_size: 512,
      storage_path: `documents/e2e-seed-5/error.png`,
      sha256: `e2e-seed-error-${Date.now()}`,
      status: 'error',
      error_message: 'Mistral OCR failed (400): Invalid document',
      title: 'Fehlerhaftes Dokument',
      user_id: userId,
    },
  ]

  const results: SeedDocument[] = []
  for (const doc of docs) {
    const { data, error } = await supabase
      .from('documents')
      .insert(doc)
      .select('id, title, document_type, status')
      .single()
    if (error) throw new Error(`Seed failed: ${error.message}`)
    results.push(data as SeedDocument)
  }

  // Tags erstellen (mit user_id)
  const tagNames = ['rechnung', 'strom', 'vertrag', 'miete', 'arztbrief', 'münchen']
  for (const name of tagNames) {
    await supabase.from('tags').upsert(
      { name, user_id: userId },
      { onConflict: 'name,user_id' },
    )
  }

  // Tags zuweisen
  const { data: allTags } = await supabase.from('tags').select('id, name').eq('user_id', userId)
  const tagMap = new Map((allTags ?? []).map((t: any) => [t.name, t.id]))

  const tagAssignments = [
    { docIdx: 0, tags: ['rechnung', 'strom', 'münchen'] },
    { docIdx: 1, tags: ['vertrag', 'miete', 'münchen'] },
    { docIdx: 2, tags: ['arztbrief'] },
  ]

  for (const assignment of tagAssignments) {
    for (const tagName of assignment.tags) {
      const tagId = tagMap.get(tagName)
      if (tagId) {
        await supabase
          .from('document_tags')
          .upsert({ document_id: results[assignment.docIdx].id, tag_id: tagId, source: 'ai' })
      }
    }
  }

  return results
}

/** Löscht alle Test-Daten aus DB und Storage */
export async function cleanupAll(supabase: SupabaseClient) {
  // Zuerst Storage-Pfade der Dokumente sammeln und löschen
  const { data: docs } = await supabase.from('documents').select('storage_path')
  if (docs?.length) {
    const paths = docs.map((d: any) => d.storage_path).filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('documents').remove(paths)
    }
  }

  await supabase.from('document_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('document_fields').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('document_tags').delete().neq('document_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // Chat-Sessions löschen (CASCADE löscht automatisch chat_messages)
  await supabase.from('chat_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Bekannte harmlose Fehler ignorieren
        if (text.includes('Failed to load resource') && text.includes('favicon'))
          return
        consoleErrors.push(`[console.error] ${text}`)
      }
    })

    page.on('pageerror', (error) => {
      consoleErrors.push(`[pageerror] ${error.message || String(error)}`)
    })

    await use(page)

    if (consoleErrors.length > 0) {
      console.warn(`Console errors in test:\n${consoleErrors.join('\n')}`)
    }
  },
})

export { expect }
