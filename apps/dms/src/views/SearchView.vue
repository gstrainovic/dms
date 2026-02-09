<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSearch } from '@/composables/useSearch'
import { useDocumentsStore } from '@/stores/documents'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const router = useRouter()
const documentsStore = useDocumentsStore()
const { results, query, loading, error, searchMode, filterType, hasResults, search } = useSearch()

const searchInput = ref('')
const modeOptions = [
  { label: 'Volltext', value: 'fulltext' },
  { label: 'Hybrid (KI)', value: 'hybrid' },
]

onMounted(() => {
  if (!documentsStore.documents.length) {
    documentsStore.fetchDocuments()
  }
})

const documentTypes = computed(() => {
  const types = new Set(documentsStore.documents.map((d) => d.document_type).filter(Boolean))
  return [...types].sort()
})

async function onSearch() {
  if (!searchInput.value.trim()) return
  await search(searchInput.value)
}

function matchTypeLabel(type: string) {
  switch (type) {
    case 'fulltext': return 'Volltext'
    case 'vector': return 'Semantisch'
    case 'hybrid': return 'Hybrid'
    default: return type
  }
}

function matchTypeSeverity(type: string) {
  switch (type) {
    case 'fulltext': return 'info'
    case 'vector': return 'warn'
    case 'hybrid': return 'success'
    default: return 'secondary'
  }
}

function highlightExcerpt(text: string): string {
  if (!query.value) return text
  const words = query.value.split(/\s+/).filter(Boolean)
  let result = text
  for (const word of words) {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }
  return result
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold">Suche</h1>

    <!-- Suchleiste -->
    <div class="flex gap-2 items-end">
      <div class="flex-1">
        <InputText
          v-model="searchInput"
          placeholder="Dokumente durchsuchen..."
          class="w-full"
          @keyup.enter="onSearch"
        />
      </div>
      <Select
        v-model="filterType"
        :options="documentTypes"
        placeholder="Alle Typen"
        showClear
        class="w-40"
      />
      <SelectButton
        v-model="searchMode"
        :options="modeOptions"
        optionLabel="label"
        optionValue="value"
      />
      <Button label="Suchen" icon="pi pi-search" :loading="loading" @click="onSearch" />
    </div>

    <!-- Fehler -->
    <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded">
      {{ error }}
    </div>

    <!-- Ergebnisse -->
    <div v-if="hasResults" class="flex flex-col gap-3">
      <p class="text-surface-500 text-sm">{{ results.length }} Ergebnis{{ results.length !== 1 ? 'se' : '' }} für "{{ query }}"</p>

      <Card
        v-for="result in results"
        :key="result.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="router.push(`/documents/${result.id}`)"
      >
        <template #content>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-lg">{{ result.title }}</span>
              <div class="flex gap-2">
                <Tag v-if="result.document_type" :value="result.document_type" severity="secondary" />
                <Tag :value="matchTypeLabel(result.match_type)" :severity="matchTypeSeverity(result.match_type)" />
              </div>
            </div>
            <p class="text-sm text-surface-600" v-html="highlightExcerpt(result.excerpt)" />
            <div v-if="result.tags?.length" class="flex gap-1 flex-wrap">
              <Tag v-for="tag in result.tags" :key="tag" :value="tag" severity="info" />
            </div>
            <div v-if="result.score" class="text-xs text-surface-400">
              Relevanz: {{ (result.score * 100).toFixed(1) }}%
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Kein Ergebnis -->
    <div v-else-if="query && !loading" class="text-center p-8 text-surface-400">
      Keine Ergebnisse für "{{ query }}" gefunden.
    </div>

    <!-- Eingangszustand -->
    <div v-else-if="!loading" class="text-center p-12 text-surface-400">
      <i class="pi pi-search text-5xl mb-4 block" />
      <p>Geben Sie einen Suchbegriff ein, um Ihre Dokumente zu durchsuchen.</p>
      <p class="text-sm mt-2">Volltext durchsucht Titel und OCR-Text. Hybrid nutzt zusätzlich KI-Embeddings.</p>
    </div>
  </div>
</template>
