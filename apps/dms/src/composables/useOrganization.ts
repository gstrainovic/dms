import { computed, ref, readonly, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import type { Organization, OrganizationRole } from '@/lib/database.types'

/**
 * Organisation der angemeldeten Person. Jede Person gehört genau einer an; ein Privatkonto ist eine Organisation
 * mit einer Person. Beim Laden wird eine offene Einladung angenommen (RPC accept_invitation).
 */
const organization = ref<Organization | null>(null)
const role = ref<OrganizationRole | null>(null)
let loading: Promise<void> | null = null

async function load(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Nicht angemeldet')
  await supabase.rpc('accept_invitation')
  // Mitglieder sehen alle Mitglieder ihrer Organisation, darum auf die eigene Zeile filtern
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, organizations(*)')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (error) throw error
  organization.value = (data?.organizations as Organization | null) ?? null
  role.value = data?.role ?? null
}

/** Lädt einmal pro Anmeldung; mit `force` erneut (z. B. nach Umbenennen) */
function ensureLoaded(force = false): Promise<void> {
  if (!loading || force) loading = load().catch((e) => {
    loading = null
    throw e
  })
  return loading
}

let watching = false

export function useOrganization() {
  const { user } = useAuth()
  if (!watching) {
    watching = true
    watch(user, (next, prev) => {
      if (next?.id === prev?.id) return
      organization.value = null
      role.value = null
      loading = null
    })
  }

  /** Organisationsordner im Storage; Voraussetzung für jeden Upload */
  async function orgId(): Promise<string> {
    await ensureLoaded()
    if (!organization.value) throw new Error('Keine Organisation gefunden')
    return organization.value.id
  }

  async function rename(name: string) {
    const { error } = await supabase.from('organizations').update({ name }).eq('id', await orgId())
    if (error) throw error
    organization.value = { ...organization.value!, name }
  }

  return {
    organization: readonly(organization),
    role: readonly(role),
    isAdmin: computed(() => role.value === 'admin'),
    ensureLoaded,
    orgId,
    rename,
  }
}
