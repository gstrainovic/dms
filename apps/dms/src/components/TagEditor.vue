<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useDocumentsStore } from '@/stores/documents'
import type { Tag } from '@/lib/database.types'
import AutoComplete from 'primevue/autocomplete'
import Chip from 'primevue/chip'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
  documentId: string
  modelValue: Tag[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tags: Tag[]]
}>()

const tagsStore = useTagsStore()
const documentsStore = useDocumentsStore()
const toast = useToast()

const searchQuery = ref('')
const suggestions = ref<Tag[]>([])

onMounted(async () => {
  if (!tagsStore.tags.length) {
    await tagsStore.fetchTags()
  }
})

const assignedTagIds = computed(() => new Set(props.modelValue.map((t) => t.id)))

function searchTags(event: { query: string }) {
  const q = event.query.toLowerCase()
  suggestions.value = tagsStore.tags.filter(
    (t) => t.name.toLowerCase().includes(q) && !assignedTagIds.value.has(t.id),
  )
  // Option zum Erstellen anbieten, wenn kein exakter Treffer
  if (q && !tagsStore.tags.some((t) => t.name.toLowerCase() === q)) {
    suggestions.value.push({ id: '__new__', name: `"${event.query}" erstellen`, color: null, created_at: '' })
  }
}

async function selectTag(event: { value: Tag | string }) {
  const selected = typeof event.value === 'string' ? null : event.value
  if (!selected) return

  try {
    let tag: Tag
    if (selected.id === '__new__') {
      // Neuen Tag erstellen
      const name = searchQuery.value.trim()
      if (!name) return
      tag = await tagsStore.findOrCreateTag(name)
    } else {
      tag = selected
    }

    await documentsStore.addTagToDocument(props.documentId, tag.id)
    emit('update:modelValue', [...props.modelValue, tag])
    searchQuery.value = ''
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Fehler', detail: 'Tag konnte nicht hinzugefügt werden', life: 3000 })
  }
}

async function removeTag(tag: Tag) {
  try {
    await documentsStore.removeTagFromDocument(props.documentId, tag.id)
    emit('update:modelValue', props.modelValue.filter((t) => t.id !== tag.id))
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Fehler', detail: 'Tag konnte nicht entfernt werden', life: 3000 })
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-1">
      <Chip
        v-for="tag in modelValue"
        :key="tag.id"
        :label="tag.name"
        :style="{ backgroundColor: tag.color || '#6366f1', color: 'white' }"
        removable
        @remove="removeTag(tag)"
      />
    </div>
    <AutoComplete
      v-model="searchQuery"
      :suggestions="suggestions"
      option-label="name"
      placeholder="Tag hinzufügen..."
      @complete="searchTags"
      @item-select="selectTag"
      class="w-full"
    />
  </div>
</template>
