<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentsStore } from '@/stores/documents'
import type { DocumentField } from '@/lib/database.types'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
  documentId: string
  modelValue: DocumentField[]
}>()

const emit = defineEmits<{
  'update:modelValue': [fields: DocumentField[]]
}>()

const store = useDocumentsStore()
const toast = useToast()

const editingId = ref<string | null>(null)
const editValue = ref('')
const newFieldName = ref('')
const newFieldValue = ref('')
const showAddForm = ref(false)

function startEdit(field: DocumentField) {
  editingId.value = field.id
  editValue.value = field.field_value ?? ''
}

function cancelEdit() {
  editingId.value = null
  editValue.value = ''
}

async function saveEdit(field: DocumentField) {
  try {
    await store.updateField(field.id, editValue.value)
    const updated = props.modelValue.map((f) =>
      f.id === field.id ? { ...f, field_value: editValue.value, source: 'manual' as const } : f,
    )
    emit('update:modelValue', updated)
    editingId.value = null
    toast.add({ severity: 'success', summary: 'Gespeichert', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Fehler beim Speichern', life: 3000 })
  }
}

async function addField() {
  const name = newFieldName.value.trim()
  const value = newFieldValue.value.trim()
  if (!name) return

  try {
    const created = await store.addField(props.documentId, name, value)
    emit('update:modelValue', [...props.modelValue, created])
    newFieldName.value = ''
    newFieldValue.value = ''
    showAddForm.value = false
    toast.add({ severity: 'success', summary: 'Feld hinzugefügt', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Fehler', detail: 'Feld konnte nicht erstellt werden', life: 3000 })
  }
}

async function deleteField(field: DocumentField) {
  try {
    await store.deleteField(field.id)
    emit('update:modelValue', props.modelValue.filter((f) => f.id !== field.id))
  } catch {
    toast.add({ severity: 'error', summary: 'Fehler beim Löschen', life: 3000 })
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="field in modelValue" :key="field.id" class="flex items-center gap-2 py-1 border-b border-surface-200">
      <span class="font-medium min-w-32 text-sm">{{ field.field_name }}</span>
      <template v-if="editingId === field.id">
        <InputText v-model="editValue" class="flex-1" size="small" @keyup.enter="saveEdit(field)" />
        <Button icon="pi pi-check" size="small" severity="success" text @click="saveEdit(field)" />
        <Button icon="pi pi-times" size="small" severity="secondary" text @click="cancelEdit" />
      </template>
      <template v-else>
        <span class="flex-1 text-sm">{{ field.field_value || '–' }}</span>
        <span v-if="field.source === 'ai'" class="text-xs text-blue-500" title="KI-extrahiert">KI</span>
        <Button icon="pi pi-pencil" size="small" severity="secondary" text @click="startEdit(field)" />
        <Button icon="pi pi-trash" size="small" severity="danger" text @click="deleteField(field)" />
      </template>
    </div>

    <div v-if="showAddForm" class="flex items-center gap-2 pt-2">
      <InputText v-model="newFieldName" placeholder="Feldname" size="small" class="w-32" />
      <InputText v-model="newFieldValue" placeholder="Wert" size="small" class="flex-1" @keyup.enter="addField" />
      <Button icon="pi pi-check" size="small" severity="success" text @click="addField" />
      <Button icon="pi pi-times" size="small" severity="secondary" text @click="showAddForm = false" />
    </div>
    <Button
      v-else
      label="Feld hinzufügen"
      icon="pi pi-plus"
      size="small"
      severity="secondary"
      text
      @click="showAddForm = true"
    />
  </div>
</template>
