/**
 * Mehrbenutzer: Organisation besitzt Dokumente, Tags, Felder, Schemas und Chats; Zugriff über die Mitgliedschaft.
 * Integrationstest gegen das lokale Supabase (RLS, RPCs, Storage, hybrid_search, ai-proxy pro Organisation).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const ANON_KEY = process.env.SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const run = Date.now()

interface TestUser {
  id: string
  email: string
  token: string
  db: SupabaseClient
}

/** Meldet eine Person an; legt sie an, falls es sie noch nicht gibt */
async function login(email: string): Promise<TestUser> {
  await admin.auth.admin.createUser({ email, email_confirm: true })
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) throw error
  const db = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data } = await db.auth.verifyOtp({ token_hash: link.properties!.hashed_token, type: 'magiclink' })
  return { id: data.user!.id, email, token: data.session!.access_token, db }
}

async function orgOf(userId: string): Promise<{ org_id: string, role: string }> {
  const { data, error } = await admin.from('organization_members').select('org_id, role').eq('user_id', userId).single()
  if (error) throw error
  return data
}

/** Dokument direkt anlegen wie nach der Pipeline, mit Datei im Storage */
async function seedDocument(user: TestUser, title: string, documentType: string | null) {
  const { org_id } = await orgOf(user.id)
  const sha256 = crypto.randomUUID().replaceAll('-', '').padEnd(64, '0')
  const storagePath = `${org_id}/${sha256}/${title}.txt`
  const { error: upErr } = await user.db.storage.from('documents').upload(storagePath, new Blob([title]), { contentType: 'text/plain' })
  if (upErr) throw upErr
  const { data, error } = await user.db.from('documents').insert({
    title,
    original_filename: `${title}.txt`,
    mime_type: 'text/plain',
    file_size: title.length,
    storage_path: storagePath,
    sha256,
    status: 'ready',
    document_type: documentType,
    ocr_text: `${title} Geheimwort${run}`,
    user_id: user.id,
  }).select('id, org_id, storage_path').single()
  if (error) throw error
  await admin.from('document_fields').insert({ document_id: data.id, field_name: 'betrag', field_value: '4200', source: 'ai' })
  return data
}

async function visibleTitles(user: TestUser): Promise<string[]> {
  const { data, error } = await user.db.from('documents').select('title')
  if (error) throw error
  return data.map(d => d.title)
}

describe('Organisationen und Rechte', () => {
  let chefin: TestUser
  let mitarbeiter: TestUser
  let fremd: TestUser
  let firma: string
  let offen: { id: string, storage_path: string }
  let lohn: { id: string, storage_path: string }

  beforeAll(async () => {
    chefin = await login(`chefin-${run}@test.local`)
    fremd = await login(`fremd-${run}@test.local`)
    firma = (await orgOf(chefin.id)).org_id
  })

  afterAll(async () => {
    const ids = [chefin, mitarbeiter, fremd].filter(Boolean).map(u => u.id)
    const { data: orgs } = await admin.from('organization_members').select('org_id').in('user_id', ids)
    for (const id of ids) await admin.auth.admin.deleteUser(id)
    const orgIds = [...new Set([firma, ...(orgs ?? []).map(o => o.org_id)])]
    await admin.from('organizations').delete().in('id', orgIds)
  })

  it('jede neue Person bekommt ein eigenes Privatkonto als Admin', async () => {
    const member = await orgOf(chefin.id)
    expect(member.role).toBe('admin')
    const { data: org } = await chefin.db.from('organizations').select('id, kind').single()
    expect(org).toMatchObject({ id: firma, kind: 'privat' })
    expect((await orgOf(fremd.id)).org_id).not.toBe(firma)
  })

  it('Admin lädt per E-Mail ein, die neue Person landet als Mitglied in der Firma', async () => {
    await chefin.db.from('organizations').update({ name: 'Muster AG', kind: 'betrieb' }).eq('id', firma)
    const email = `mitarbeiter-${run}@test.local`
    const { data, error } = await chefin.db.rpc('invite_member', { p_email: email, p_role: 'member' })
    expect(error).toBeNull()
    expect(data).toBe('invited')

    mitarbeiter = await login(email)
    expect(await orgOf(mitarbeiter.id)).toEqual({ org_id: firma, role: 'member' })

    const { data: members } = await mitarbeiter.db.rpc('list_members')
    expect(members.map((m: any) => [m.email, m.role]).sort()).toEqual([[chefin.email, 'admin'], [email, 'member']].sort())
  })

  it('Einladung über die Edge Function legt das Konto an und verschickt die Einladungsmail', async () => {
    const email = `per-mail-${run}@test.local`
    const invite = (user: TestUser) => fetch(`${SUPABASE_URL}/functions/v1/invite-member`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'member' }),
    })

    expect((await invite(mitarbeiter)).status).toBe(403)

    const res = await invite(chefin)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ result: 'invited' })
    const { data } = await admin.auth.admin.listUsers()
    const invited = data.users.find(u => u.email === email)
    expect(invited?.invited_at).toBeTruthy()
    expect((await orgOf(invited!.id))).toEqual({ org_id: firma, role: 'member' })
    await admin.auth.admin.deleteUser(invited!.id)
  }, 20000)

  it('Mitglieder derselben Firma teilen Dokumente, Tags und Felder, andere Organisationen sehen nichts', async () => {
    offen = await seedDocument(chefin, `Offerte-${run}`, 'invoice')
    const { data: tag, error } = await mitarbeiter.db.from('tags').insert({ name: `Kunde-${run}`, user_id: mitarbeiter.id }).select('org_id').single()
    expect(error).toBeNull()
    expect(tag!.org_id).toBe(firma)

    expect(await visibleTitles(mitarbeiter)).toContain(`Offerte-${run}`)
    expect((await mitarbeiter.db.from('document_fields').select('field_value').eq('document_id', offen.id)).data).toHaveLength(1)
    expect((await mitarbeiter.db.from('tags').select('name').eq('name', `Kunde-${run}`)).data).toHaveLength(1)
    expect((await mitarbeiter.db.storage.from('documents').download(offen.storage_path)).error).toBeNull()

    expect(await visibleTitles(fremd)).not.toContain(`Offerte-${run}`)
    expect((await fremd.db.from('document_fields').select('id').eq('document_id', offen.id)).data).toHaveLength(0)
    expect((await fremd.db.from('tags').select('id').eq('name', `Kunde-${run}`)).data).toHaveLength(0)
    expect((await fremd.db.storage.from('documents').download(offen.storage_path)).error).not.toBeNull()
  })

  it('niemand lädt Dateien in den Ordner einer fremden Organisation', async () => {
    const { error } = await fremd.db.storage.from('documents').upload(`${firma}/fremd-${run}.txt`, new Blob(['x']))
    expect(error).not.toBeNull()
  })

  it('gesperrte Dokumenttypen sehen nur Admins, auch in Feldern und in der Suche', async () => {
    lohn = await seedDocument(chefin, `Lohnausweis-${run}`, 'payroll')
    expect((await mitarbeiter.db.from('restricted_document_types').insert({ org_id: firma, document_type: 'payroll' })).error).not.toBeNull()
    expect((await chefin.db.from('restricted_document_types').insert({ org_id: firma, document_type: 'payroll' })).error).toBeNull()

    expect(await visibleTitles(chefin)).toContain(`Lohnausweis-${run}`)
    expect(await visibleTitles(mitarbeiter)).not.toContain(`Lohnausweis-${run}`)
    expect((await mitarbeiter.db.from('document_fields').select('id').eq('document_id', lohn.id)).data).toHaveLength(0)
    expect((await mitarbeiter.db.storage.from('documents').download(lohn.storage_path)).error).not.toBeNull()

    const zero = JSON.stringify(Array(1024).fill(0))
    const search = (user: TestUser) => user.db.rpc('hybrid_search', { query_text: `Geheimwort${run}`, query_embedding: zero })
    const forMember = (await search(mitarbeiter)).data!.map((r: any) => r.title)
    const forAdmin = (await search(chefin)).data!.map((r: any) => r.title)
    const forStranger = (await search(fremd)).data!.map((r: any) => r.title)
    expect(forAdmin).toEqual(expect.arrayContaining([`Offerte-${run}`, `Lohnausweis-${run}`]))
    expect(forMember).toContain(`Offerte-${run}`)
    expect(forMember).not.toContain(`Lohnausweis-${run}`)
    expect(forStranger).toEqual([])
  })

  it('wer ein Dokument hochlädt, sieht es auch nach der Einstufung als gesperrt', async () => {
    const eigenes = await seedDocument(mitarbeiter, `Eigener-Lohn-${run}`, 'payroll')
    expect(await visibleTitles(mitarbeiter)).toContain(`Eigener-Lohn-${run}`)
    await admin.from('documents').delete().eq('id', eigenes.id)
  })

  it('nur Admins laden ein, entfernen und ändern Rollen', async () => {
    expect((await mitarbeiter.db.rpc('invite_member', { p_email: `x-${run}@test.local`, p_role: 'member' })).error).not.toBeNull()
    expect((await mitarbeiter.db.rpc('remove_member', { p_user_id: chefin.id })).error).not.toBeNull()
    expect((await mitarbeiter.db.rpc('set_member_role', { p_user_id: mitarbeiter.id, p_role: 'admin' })).error).not.toBeNull()
    expect((await mitarbeiter.db.from('organizations').update({ name: 'Gekapert' }).eq('id', firma).select()).data).toHaveLength(0)
  })

  it('der letzte Admin kann weder entfernt noch herabgestuft werden', async () => {
    expect((await chefin.db.rpc('remove_member', { p_user_id: chefin.id })).error?.message).toContain('Admin')
    expect((await chefin.db.rpc('set_member_role', { p_user_id: chefin.id, p_role: 'member' })).error?.message).toContain('Admin')
  })

  it('Protokoll hält fest, wer was hochgeladen, geändert und gelöscht hat; lesen dürfen nur Admins', async () => {
    const doc = await seedDocument(mitarbeiter, `Protokoll-${run}`, null)
    await mitarbeiter.db.from('documents').update({ title: `Protokoll-neu-${run}` }).eq('id', doc.id)
    await mitarbeiter.db.from('documents').delete().eq('id', doc.id)

    const { data: log } = await chefin.db.from('audit_log').select('action, user_id, details').eq('document_id', doc.id).like('action', 'document.%').order('id')
    expect(log!.map(e => e.action)).toEqual(['document.created', 'document.updated', 'document.deleted'])
    expect(log!.every(e => e.user_id === mitarbeiter.id)).toBe(true)
    expect(log![1].details).toMatchObject({ title: { from: `Protokoll-${run}`, to: `Protokoll-neu-${run}` } })
    expect(log![2].details).toMatchObject({ title: `Protokoll-neu-${run}` })

    expect((await mitarbeiter.db.from('audit_log').select('id')).data).toHaveLength(0)
  })

  it('Abo, Testzeit und Verbrauch zählen im ai-proxy pro Organisation', async () => {
    const month = new Date().toISOString().slice(0, 7)
    await admin.from('ai_usage').upsert({ user_id: firma, month, ocr_pages: 17, chat_tokens: 5 })
    const usage = async (user: TestUser) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy/me/usage`, { headers: { Authorization: `Bearer ${user.token}` } })
      expect(res.status).toBe(200)
      return (await res.json()).usage
    }
    expect(await usage(chefin)).toEqual({ ocrPages: 17, chatTokens: 5 })
    expect(await usage(mitarbeiter)).toEqual({ ocrPages: 17, chatTokens: 5 })
    expect(await usage(fremd)).toEqual({ ocrPages: 0, chatTokens: 0 })
    const { data: sub } = await admin.from('ai_subscriptions').select('status').eq('user_id', firma).single()
    expect(sub!.status).toBe('trial')
  }, 20000)

  it('Entfernen nimmt den Zugriff sofort, die Person bekommt ein neues leeres Privatkonto', async () => {
    const { error } = await chefin.db.rpc('remove_member', { p_user_id: mitarbeiter.id })
    expect(error).toBeNull()
    expect(await visibleTitles(mitarbeiter)).toEqual([])
    expect((await mitarbeiter.db.storage.from('documents').download(offen.storage_path)).error).not.toBeNull()
    const neu = await orgOf(mitarbeiter.id)
    expect(neu.org_id).not.toBe(firma)
    expect(neu.role).toBe('admin')
  })

  it('bestehende Person mit leerem Privatkonto wird direkt Mitglied, mit eigenen Daten bleibt die Einladung offen', async () => {
    expect((await chefin.db.rpc('invite_member', { p_email: mitarbeiter.email, p_role: 'member' })).data).toBe('added')
    expect(await orgOf(mitarbeiter.id)).toEqual({ org_id: firma, role: 'member' })

    await seedDocument(fremd, `Fremd-eigen-${run}`, null)
    expect((await chefin.db.rpc('invite_member', { p_email: fremd.email, p_role: 'member' })).data).toBe('pending')
    expect((await orgOf(fremd.id)).org_id).not.toBe(firma)
  })
})
