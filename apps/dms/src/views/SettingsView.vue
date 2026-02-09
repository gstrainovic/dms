<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSchemasStore, type Schema } from '@/stores/schemas'
import { useTagsStore } from '@/stores/tags'
import { useSettingsStore } from '@/stores/settings'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import Chip from 'primevue/chip'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'

const schemasStore = useSchemasStore()
const tagsStore = useTagsStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const themeOptions = [
  { label: 'Dunkel', value: 'dark' },
  { label: 'Hell', value: 'light' },
  { label: 'System', value: 'system' },
]

const showSchemaDialog = ref(false)
const editingSchema = ref<Schema | null>(null)
const schemaForm = ref({
  name: '',
  document_type: '',
  description: '',
  schema: '{\n  "type": "object",\n  "properties": {}\n}',
})

onMounted(async () => {
  await Promise.all([schemasStore.fetchSchemas(), tagsStore.fetchTags()])
})

function openNewSchema() {
  editingSchema.value = null
  schemaForm.value = {
    name: '',
    document_type: '',
    description: '',
    schema: '{\n  "type": "object",\n  "properties": {}\n}',
  }
  showSchemaDialog.value = true
}

function openEditSchema(schema: Schema) {
  editingSchema.value = schema
  schemaForm.value = {
    name: schema.name,
    document_type: schema.document_type,
    description: schema.description ?? '',
    schema: JSON.stringify(schema.schema, null, 2),
  }
  showSchemaDialog.value = true
}

async function saveSchema() {
  try {
    const parsed = JSON.parse(schemaForm.value.schema)

    if (editingSchema.value) {
      await schemasStore.updateSchema(editingSchema.value.id, {
        name: schemaForm.value.name,
        description: schemaForm.value.description || null,
        schema: parsed,
      })
      toast.add({ severity: 'success', summary: 'Schema aktualisiert', life: 2000 })
    } else {
      await schemasStore.createSchema({
        name: schemaForm.value.name,
        document_type: schemaForm.value.document_type,
        description: schemaForm.value.description || undefined,
        schema: parsed,
      })
      toast.add({ severity: 'success', summary: 'Schema erstellt', life: 2000 })
    }

    showSchemaDialog.value = false
  } catch (e) {
    const msg = e instanceof SyntaxError ? 'Ungültiges JSON-Schema' : 'Fehler beim Speichern'
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  }
}

async function deleteSchema(schema: Schema) {
  try {
    await schemasStore.deleteSchema(schema.id)
    toast.add({ severity: 'success', summary: 'Schema gelöscht', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Fehler beim Löschen', life: 3000 })
  }
}

async function deleteTag(id: string) {
  try {
    await tagsStore.deleteTag(id)
    toast.add({ severity: 'success', summary: 'Tag gelöscht', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Fehler beim Löschen', life: 3000 })
  }
}

function schemaFieldCount(schema: Schema): number {
  const props = (schema.schema as any)?.properties
  return props ? Object.keys(props).length : 0
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold">Einstellungen</h1>

    <!-- Design -->
    <Card>
      <template #title>Design</template>
      <template #content>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Farbschema</label>
          <Select
            v-model="settingsStore.theme"
            :options="themeOptions"
            option-label="label"
            option-value="value"
            class="w-48"
          />
        </div>
      </template>
    </Card>

    <!-- Dokumenten-Schemas -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span>Dokumenten-Schemas</span>
          <Button label="Neues Schema" icon="pi pi-plus" size="small" @click="openNewSchema" />
        </div>
      </template>
      <template #content>
        <DataTable :value="schemasStore.schemas" :loading="schemasStore.loading" size="small" stripedRows>
          <Column field="name" header="Name" />
          <Column field="document_type" header="Typ" />
          <Column header="Felder" style="width: 100px">
            <template #body="{ data }">{{ schemaFieldCount(data) }}</template>
          </Column>
          <Column field="description" header="Beschreibung" />
          <Column header="Aktionen" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-pencil" text size="small" @click="openEditSchema(data)" />
                <Button icon="pi pi-trash" text severity="danger" size="small" @click="deleteSchema(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Tags verwalten -->
    <Card>
      <template #title>Tags</template>
      <template #content>
        <div v-if="tagsStore.loading" class="text-center p-4">
          <i class="pi pi-spin pi-spinner" />
        </div>
        <div v-else-if="tagsStore.tags.length" class="flex flex-wrap gap-2">
          <Chip
            v-for="tag in tagsStore.tags"
            :key="tag.id"
            :label="tag.name"
            :style="{ backgroundColor: tag.color || '#6366f1', color: 'white' }"
            removable
            @remove="deleteTag(tag.id)"
          />
        </div>
        <p v-else class="text-surface-500">Noch keine Tags vorhanden.</p>
      </template>
    </Card>

    <!-- Schema Dialog -->
    <Dialog
      v-model:visible="showSchemaDialog"
      :header="editingSchema ? 'Schema bearbeiten' : 'Neues Schema'"
      :style="{ width: '600px' }"
      modal
    >
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <InputText v-model="schemaForm.name" class="w-full" placeholder="z.B. Rechnung" />
        </div>
        <div v-if="!editingSchema">
          <label class="block text-sm font-medium mb-1">Dokumenttyp (eindeutig)</label>
          <InputText v-model="schemaForm.document_type" class="w-full" placeholder="z.B. invoice" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Beschreibung</label>
          <InputText v-model="schemaForm.description" class="w-full" placeholder="Wofür wird dieses Schema verwendet?" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">JSON-Schema (Felder)</label>
          <Textarea v-model="schemaForm.schema" class="w-full font-mono text-sm" :rows="10" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text @click="showSchemaDialog = false" />
        <Button label="Speichern" icon="pi pi-check" @click="saveSchema" />
      </template>
    </Dialog>
  </div>
</template>
