<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useTagsStore } from '@/stores/tags'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'

const router = useRouter()
const store = useDocumentsStore()
const tagsStore = useTagsStore()

const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const selectedType = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([store.fetchDocuments(), tagsStore.fetchTags()])
})

const documentTypes = computed(() => {
  const types = new Set(store.documents.map((d) => d.document_type).filter(Boolean))
  return [...types].sort()
})

const statusOptions = ['uploaded', 'processing', 'ocr_done', 'extracted', 'ready', 'error']

const filteredDocuments = computed(() => {
  let docs = store.documents

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.original_filename.toLowerCase().includes(q) ||
        d.document_type?.toLowerCase().includes(q),
    )
  }

  if (selectedType.value) {
    docs = docs.filter((d) => d.document_type === selectedType.value)
  }

  if (selectedStatus.value) {
    docs = docs.filter((d) => d.status === selectedStatus.value)
  }

  return docs
})

function statusSeverity(status: string) {
  switch (status) {
    case 'ready': return 'success'
    case 'error': return 'danger'
    case 'processing': case 'uploaded': return 'warn'
    default: return 'info'
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE')
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function clearFilters() {
  searchQuery.value = ''
  selectedTags.value = []
  selectedType.value = null
  selectedStatus.value = null
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Dokumente</h1>
      <span class="text-surface-500">{{ filteredDocuments.length }} von {{ store.documents.length }}</span>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-2 items-center">
      <InputText
        v-model="searchQuery"
        placeholder="Suche..."
        class="w-64"
        size="small"
      />
      <Select
        v-model="selectedType"
        :options="documentTypes"
        placeholder="Alle Typen"
        showClear
        class="w-40"
        size="small"
      />
      <Select
        v-model="selectedStatus"
        :options="statusOptions"
        placeholder="Alle Status"
        showClear
        class="w-40"
        size="small"
      />
      <button
        v-if="searchQuery || selectedType || selectedStatus || selectedTags.length"
        class="text-sm text-primary cursor-pointer underline"
        @click="clearFilters"
      >
        Filter zurücksetzen
      </button>
    </div>

    <DataTable
      :value="filteredDocuments"
      :loading="store.loading"
      paginator
      :rows="20"
      stripedRows
      sortField="created_at"
      :sortOrder="-1"
      @row-click="(e: any) => router.push(`/documents/${e.data.id}`)"
      class="cursor-pointer"
    >
      <Column field="title" header="Titel" sortable>
        <template #body="{ data }">
          {{ data.title || data.original_filename }}
        </template>
      </Column>
      <Column field="document_type" header="Typ" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag v-if="data.document_type" :value="data.document_type" severity="secondary" />
          <span v-else class="text-surface-400">–</span>
        </template>
      </Column>
      <Column field="file_size" header="Größe" sortable style="width: 100px">
        <template #body="{ data }">{{ formatSize(data.file_size) }}</template>
      </Column>
      <Column field="status" header="Status" sortable style="width: 120px">
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column field="created_at" header="Erstellt" sortable style="width: 120px">
        <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
      </Column>
    </DataTable>
  </div>
</template>
