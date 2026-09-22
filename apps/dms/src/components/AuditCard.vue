<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import { supabase } from '@/lib/supabase'

/** Protokoll der Organisation: wer hat was hochgeladen, geändert, gelöscht. RLS gibt es nur Admins heraus. */
const PAGE = 50

// Eigener Typ statt Tables<'audit_log'>: das jsonb-Feld details löst sonst TS2589 aus (wie bei den Schemas)
interface AuditLogEntry {
  id: number
  user_id: string | null
  action: string
  document_id: string | null
  details: Record<string, any> | null
  created_at: string
}

const entries = ref<AuditLogEntry[]>([])
const emails = ref<Record<string, string>>({})
const loading = ref(false)
const hasMore = ref(false)

const ACTIONS: Record<string, string> = {
  'document.created': 'hochgeladen',
  'document.updated': 'geändert',
  'document.deleted': 'gelöscht',
  'tag.added': 'Tag hinzugefügt',
  'tag.removed': 'Tag entfernt',
  'field.added': 'Feld erfasst',
  'field.changed': 'Feld geändert',
  'field.removed': 'Feld entfernt',
  'member.removed': 'Person entfernt',
}

function who(entry: AuditLogEntry): string {
  if (!entry.user_id) return 'Automatisch'
  return emails.value[entry.user_id] ?? 'Ehemaliges Mitglied'
}

/** Worum es ging: Dokumenttitel, Tag, Feld oder Person */
function what(entry: AuditLogEntry): string {
  const d = (entry.details ?? {}) as Record<string, any>
  if (typeof d.title === 'string') return d.title
  if (d.title?.to !== undefined) return `${d.title.from || '—'} → ${d.title.to}`
  if (d.document_type) return `Typ ${d.document_type.from ?? '—'} → ${d.document_type.to ?? '—'}`
  if (d.tag) return d.tag
  if (d.field) return d.value == null ? d.field : `${d.field}: ${d.value}`
  if (d.email) return d.email
  return ''
}

const dateFormat = new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' })

async function load(more = false) {
  loading.value = true
  try {
    const from = more ? entries.value.length : 0
    const [{ data, error }, { data: members }] = await Promise.all([
      supabase.from('audit_log').select('id, user_id, action, document_id, details, created_at')
        .order('id', { ascending: false }).range(from, from + PAGE - 1) as unknown as Promise<{ data: AuditLogEntry[] | null, error: Error | null }>,
      supabase.rpc('list_members'),
    ])
    if (error) throw error
    emails.value = Object.fromEntries((members ?? []).map((m: { user_id: string, email: string }) => [m.user_id, m.email]))
    entries.value = more ? [...entries.value, ...(data ?? [])] : (data ?? [])
    hasMore.value = (data ?? []).length === PAGE
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <Card data-testid="audit-card">
    <template #title>Protokoll</template>
    <template #content>
      <DataTable :value="entries" :loading="loading" size="small" striped-rows>
        <Column header="Wann" style="width: 140px">
          <template #body="{ data }">{{ dateFormat.format(new Date(data.created_at)) }}</template>
        </Column>
        <Column header="Wer">
          <template #body="{ data }">{{ who(data) }}</template>
        </Column>
        <Column header="Was">
          <template #body="{ data }">{{ ACTIONS[data.action] ?? data.action }}</template>
        </Column>
        <Column header="Worum">
          <template #body="{ data }">{{ what(data) }}</template>
        </Column>
        <template #empty>Noch keine Einträge.</template>
      </DataTable>
      <Button v-if="hasMore" label="Ältere Einträge" text size="small" class="mt-2" :loading="loading" @click="load(true)" />
    </template>
  </Card>
</template>
