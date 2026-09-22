import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Person, der Testdokumente gehören. Dokumente und Tags brauchen eine Organisation; die ergibt sich beim Anlegen aus
 * `user_id` (Trigger set_org_from_user), jede neue Person bekommt ihr Privatkonto automatisch.
 */
export async function ensureTestOwner(admin: SupabaseClient, email: string): Promise<string> {
  const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (created.user) return created.user.id
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const existing = data.users.find(u => u.email === email)
  if (!existing) throw new Error(`Testperson ${email} fehlt`)
  return existing.id
}
