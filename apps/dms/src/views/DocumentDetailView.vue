<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import type { Document, DocumentField, Tag as TagType } from '@/lib/database.types'
import TagEditor from '@/components/TagEditor.vue'
import FieldsEditor from '@/components/FieldsEditor.vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useDocumentsStore()
const toast = useToast()
const confirm = useConfirm()

const document = ref<Document | null>(null)
const fields = ref<DocumentField[]>([])
const tags = ref<TagType[]>([])
const loading = ref(true)

const editingTitle = ref(false)
const titleDraft = ref('')

const statusSeverity = computed(() => {
  if (!document.value) return undefined
  const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
    ready: 'success',
    extracted: 'info',
    ocr_done: 'info',
    processing: 'warn',
    uploaded: 'warn',
    error: 'danger',
  }
  return map[document.value.status] ?? undefined
})

const formattedSize = computed(() => {
  if (!document.value) return ''
  const bytes = document.value.file_size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})

onMounted(async () => {
  try {
    const [doc, docFields, docTags] = await Promise.all([
      store.fetchDocument(props.id),
      store.fetchDocumentFields(props.id),
      store.fetchDocumentTags(props.id),
    ])
    document.value = doc
    fields.value = docFields
    tags.value = docTags
  } finally {
    loading.value = false
  }
})

function startEditTitle() {
  if (!document.value) return
  titleDraft.value = document.value.title || document.value.original_filename
  editingTitle.value = true
}

async function saveTitle() {
  if (!document.value) return
  try {
    await store.updateDocument(document.value.id, { title: titleDraft.value })
    document.value = { ...document.value, title: titleDraft.value }
    editingTitle.value = false
    toast.add({ severity: 'success', summary: 'Titel gespeichert', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Fehler beim Speichern', life: 3000 })
  }
}

function confirmDelete() {
  if (!document.value) return
  confirm.require({
    message: `"${document.value.title || document.value.original_filename}" wirklich löschen?`,
    header: 'Dokument löschen',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.deleteDocument(document.value!.id)
        toast.add({ severity: 'success', summary: 'Gelöscht', life: 2000 })
        router.push('/documents')
      } catch {
        toast.add({ severity: 'error', summary: 'Fehler beim Löschen', life: 3000 })
      }
    },
  })
}
</script>

<template>
  <div v-if="loading" class="flex justify-center p-8">
    <i class="pi pi-spin pi-spinner text-4xl" />
  </div>
  <div v-else-if="document" class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 flex-1">
        <Button icon="pi pi-arrow-left" text severity="secondary" @click="router.push('/documents')" />
        <template v-if="editingTitle">
          <InputText v-model="titleDraft" class="flex-1 text-xl" @keyup.enter="saveTitle" />
          <Button icon="pi pi-check" text severity="success" @click="saveTitle" />
          <Button icon="pi pi-times" text severity="secondary" @click="editingTitle = false" />
        </template>
        <template v-else>
          <h1 class="text-2xl font-bold cursor-pointer hover:text-primary" @click="startEditTitle">
            {{ document.title || document.original_filename }}
          </h1>
          <Button icon="pi pi-pencil" text severity="secondary" size="small" @click="startEditTitle" />
        </template>
      </div>
      <Button icon="pi pi-trash" severity="danger" text @click="confirmDelete" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Metadaten -->
      <Card>
        <template #title>Details</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <div class="flex justify-between">
              <span class="text-surface-500">Status</span>
              <Tag :value="document.status" :severity="statusSeverity" />
            </div>
            <div v-if="document.error_message" class="text-red-500 text-sm">
              {{ document.error_message }}
            </div>
            <div class="flex justify-between">
              <span class="text-surface-500">Typ</span>
              <span>{{ document.document_type ?? 'Nicht klassifiziert' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-500">Dateiname</span>
              <span class="text-sm truncate max-w-48">{{ document.original_filename }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-500">Größe</span>
              <span>{{ formattedSize }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-500">Seiten</span>
              <span>{{ document.page_count ?? '–' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-surface-500">Erstellt</span>
              <span>{{ new Date(document.created_at).toLocaleDateString('de-DE') }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Tags -->
      <Card>
        <template #title>Tags</template>
        <template #content>
          <TagEditor v-model="tags" :document-id="document.id" />
        </template>
      </Card>

      <!-- Extrahierte Felder -->
      <Card>
        <template #title>Extrahierte Felder</template>
        <template #content>
          <FieldsEditor v-model="fields" :document-id="document.id" />
        </template>
      </Card>

      <!-- OCR-Text -->
      <Card v-if="document.ocr_text">
        <template #title>OCR-Text</template>
        <template #content>
          <pre class="whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">{{ document.ocr_text }}</pre>
        </template>
      </Card>
    </div>
  </div>
  <div v-else class="text-center p-8 text-surface-500">
    Dokument nicht gefunden.
  </div>
</template>
