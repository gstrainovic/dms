<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { supabase } from '@/lib/supabase'
import { functionErrorMessage } from '@/lib/edge-errors'
import { useAuth } from '@/composables/useAuth'
import { useOrganization } from '@/composables/useOrganization'
import type { OrganizationInvitation, OrganizationRole } from '@/lib/database.types'

interface Member {
  user_id: string
  email: string
  role: OrganizationRole
  joined_at: string
}

const toast = useToast()
const confirm = useConfirm()
const { user } = useAuth()
const { organization, isAdmin, ensureLoaded, rename } = useOrganization()

const members = ref<Member[]>([])
const invitations = ref<OrganizationInvitation[]>([])
const orgName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<OrganizationRole>('member')
const busy = ref(false)

const roleOptions = [
  { label: 'Mitglied', value: 'member' },
  { label: 'Admin', value: 'admin' },
]
const roleLabel = (role: string) => (role === 'admin' ? 'Admin' : 'Mitglied')

/** Meldung je Ergebnis der Einladung (RPC invite_member) */
const INVITE_RESULTS: Record<string, { severity: 'success' | 'info' | 'warn', summary: string, detail?: string }> = {
  invited: { severity: 'success', summary: 'Einladung verschickt' },
  added: { severity: 'success', summary: 'Person hinzugefügt' },
  member: { severity: 'info', summary: 'Die Person ist schon im Team' },
  pending: {
    severity: 'warn',
    summary: 'Einladung offen',
    detail: 'Diese E-Mail hat bereits ein Konto mit eigenen Dokumenten. Bitte eine andere Adresse verwenden.',
  },
}

async function load() {
  await ensureLoaded()
  orgName.value = organization.value?.name ?? ''
  const { data, error } = await supabase.rpc('list_members')
  if (error) throw error
  members.value = (data ?? []) as Member[]
  if (isAdmin.value) {
    const { data: open } = await supabase.from('organization_invitations').select('*').order('created_at')
    invitations.value = open ?? []
  }
}

async function run(action: () => Promise<void>, errorSummary: string) {
  busy.value = true
  try {
    await action()
  } catch (e) {
    toast.add({ severity: 'error', summary: errorSummary, detail: e instanceof Error ? e.message : undefined, life: 4000 })
  } finally {
    busy.value = false
  }
}

function saveName() {
  return run(async () => {
    await rename(orgName.value.trim())
    toast.add({ severity: 'success', summary: 'Name gespeichert', life: 2000 })
  }, 'Name nicht gespeichert')
}

function invite() {
  return run(async () => {
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: { email: inviteEmail.value, role: inviteRole.value },
    })
    if (error) throw new Error(await functionErrorMessage(error))
    const message = INVITE_RESULTS[data.result] ?? INVITE_RESULTS.invited
    toast.add({ ...message, life: 4000 })
    inviteEmail.value = ''
    await load()
  }, 'Einladung fehlgeschlagen')
}

function setRole(member: Member, role: OrganizationRole) {
  return run(async () => {
    const { error } = await supabase.rpc('set_member_role', { p_user_id: member.user_id, p_role: role })
    if (error) throw error
    await load()
  }, 'Rolle nicht geändert')
}

function remove(member: Member) {
  confirm.require({
    message: `${member.email} aus dem Team entfernen? Die Person sieht danach keine Dokumente der Organisation mehr.`,
    header: 'Person entfernen',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, entfernen',
    rejectLabel: 'Abbrechen',
    acceptClass: 'p-button-danger',
    accept: () => run(async () => {
      const { error } = await supabase.rpc('remove_member', { p_user_id: member.user_id })
      if (error) throw error
      toast.add({ severity: 'success', summary: 'Person entfernt', life: 2000 })
      await load()
    }, 'Entfernen fehlgeschlagen'),
  })
}

function withdraw(invitation: OrganizationInvitation) {
  return run(async () => {
    const { error } = await supabase.from('organization_invitations').delete()
      .eq('org_id', invitation.org_id).eq('email', invitation.email)
    if (error) throw error
    await load()
  }, 'Einladung nicht zurückgezogen')
}

onMounted(() => load().catch((e) => toast.add({ severity: 'error', summary: 'Team nicht geladen', detail: e.message, life: 4000 })))
watch(isAdmin, () => load().catch(() => {}))
</script>

<template>
  <Card data-testid="team-card">
    <template #title>Team</template>
    <template #content>
      <div class="flex flex-col gap-4">
        <div v-if="isAdmin" class="flex flex-wrap items-end gap-2">
          <div class="flex flex-col gap-1">
            <label for="org-name" class="text-sm font-medium">Name der Organisation</label>
            <InputText id="org-name" v-model="orgName" class="w-72" />
          </div>
          <Button label="Namen speichern" size="small" :disabled="busy || !orgName.trim()" @click="saveName" />
        </div>
        <p v-else class="text-surface-500">{{ organization?.name }}</p>

        <ul class="flex flex-col divide-y divide-surface-200 dark:divide-surface-700">
          <li
            v-for="member in members"
            :key="member.user_id"
            data-testid="member-row"
            class="flex flex-wrap items-center justify-between gap-2 py-2"
          >
            <div class="flex items-center gap-2">
              <span>{{ member.email }}</span>
              <Tag :value="roleLabel(member.role)" :severity="member.role === 'admin' ? 'info' : 'secondary'" />
            </div>
            <div v-if="isAdmin && member.user_id !== user?.id" class="flex gap-1">
              <Button
                v-if="member.role === 'member'"
                label="Zum Admin machen" text size="small" :disabled="busy"
                @click="setRole(member, 'admin')"
              />
              <Button
                v-else
                label="Zum Mitglied machen" text size="small" :disabled="busy"
                @click="setRole(member, 'member')"
              />
              <Button label="Entfernen" text severity="danger" size="small" :disabled="busy" @click="remove(member)" />
            </div>
          </li>
        </ul>

        <template v-if="isAdmin">
          <form class="flex flex-wrap items-end gap-2" @submit.prevent="invite">
            <div class="flex flex-col gap-1">
              <label for="invite-email" class="text-sm font-medium">E-Mail der neuen Person</label>
              <InputText id="invite-email" v-model="inviteEmail" type="email" class="w-72" placeholder="name@firma.ch" />
            </div>
            <Select v-model="inviteRole" :options="roleOptions" option-label="label" option-value="value" class="w-36" />
            <Button type="submit" label="Einladen" icon="pi pi-send" size="small" :disabled="busy || !inviteEmail.trim()" />
          </form>
          <p class="text-sm text-surface-500">
            Mitglieder sehen alle Dokumente der Organisation ausser den Typen, die unten bei den Schemas auf «Nur Admins» stehen.
            Admins verwalten zusätzlich Team, Schemas und Abo und sehen das Protokoll.
          </p>

          <div v-if="invitations.length" class="flex flex-col gap-1">
            <span class="text-sm font-medium">Offene Einladungen</span>
            <div v-for="inv in invitations" :key="inv.email" class="flex items-center justify-between gap-2">
              <span>{{ inv.email }} ({{ roleLabel(inv.role) }})</span>
              <Button label="Zurückziehen" text size="small" :disabled="busy" @click="withdraw(inv)" />
            </div>
          </div>
        </template>
      </div>
    </template>
  </Card>
</template>
