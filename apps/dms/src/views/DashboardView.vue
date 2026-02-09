<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents'
import { useTagsStore } from '@/stores/tags'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import type { RealtimeChannel } from '@supabase/supabase-js'

const router = useRouter()
const documentsStore = useDocumentsStore()
const tagsStore = useTagsStore()

let channel: RealtimeChannel | null = null

onMounted(async () => {
  await Promise.all([documentsStore.fetchDocuments(), tagsStore.fetchTags()])
  channel = documentsStore.subscribeToChanges()
})

onUnmounted(() => {
  if (channel) channel.unsubscribe()
})

const errorCount = computed(() => documentsStore.documents.filter((d) => d.status === 'error').length)
const recentDocs = computed(() => documentsStore.documents.slice(0, 5))

const typeStats = computed(() => {
  const counts: Record<string, number> = {}
  for (const doc of documentsStore.documents) {
    const type = doc.document_type || 'Unklassifiziert'
    counts[type] = (counts[type] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

function statusSeverity(status: string) {
  switch (status) {
    case 'ready': return 'success'
    case 'error': return 'danger'
    case 'processing': case 'uploaded': return 'warn'
    default: return 'info'
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold">Dashboard</h1>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card class="cursor-pointer" @click="router.push('/documents')">
        <template #content>
          <p class="text-sm text-surface-500">Gesamt</p>
          <p class="text-3xl font-bold">{{ documentsStore.documentCount }}</p>
        </template>
      </Card>
      <Card>
        <template #content>
          <p class="text-sm text-surface-500">Bereit</p>
          <p class="text-3xl font-bold text-green-600">{{ documentsStore.readyCount }}</p>
        </template>
      </Card>
      <Card>
        <template #content>
          <p class="text-sm text-surface-500">Verarbeitung</p>
          <p class="text-3xl font-bold text-orange-500">{{ documentsStore.processingCount }}</p>
        </template>
      </Card>
      <Card>
        <template #content>
          <p class="text-sm text-surface-500">Fehler</p>
          <p class="text-3xl font-bold" :class="errorCount ? 'text-red-500' : 'text-surface-400'">{{ errorCount }}</p>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Letzte Dokumente -->
      <Card>
        <template #title>Neueste Dokumente</template>
        <template #content>
          <div v-if="!recentDocs.length" class="text-surface-400">Noch keine Dokumente.</div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="doc in recentDocs"
              :key="doc.id"
              class="flex items-center justify-between py-2 border-b border-surface-200 cursor-pointer hover:bg-surface-50"
              @click="router.push(`/documents/${doc.id}`)"
            >
              <div class="flex flex-col">
                <span class="font-medium text-sm">{{ doc.title || doc.original_filename }}</span>
                <span class="text-xs text-surface-400">{{ new Date(doc.created_at).toLocaleDateString('de-DE') }}</span>
              </div>
              <Tag :value="doc.status" :severity="statusSeverity(doc.status)" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Typ-Verteilung -->
      <Card>
        <template #title>Dokumenttypen</template>
        <template #content>
          <div v-if="!typeStats.length" class="text-surface-400">Noch keine Dokumente.</div>
          <div v-else class="flex flex-col gap-2">
            <div v-for="[type, count] in typeStats" :key="type" class="flex items-center justify-between py-1">
              <span class="text-sm">{{ type }}</span>
              <div class="flex items-center gap-2">
                <div class="h-2 rounded bg-primary" :style="{ width: `${Math.max(20, (count / documentsStore.documentCount) * 200)}px` }" />
                <span class="text-sm font-medium w-8 text-right">{{ count }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Tags -->
      <Card>
        <template #title>Tags ({{ tagsStore.tags.length }})</template>
        <template #content>
          <div v-if="tagsStore.loading" class="text-center"><i class="pi pi-spin pi-spinner" /></div>
          <div v-else-if="tagsStore.tags.length" class="flex flex-wrap gap-2">
            <Tag
              v-for="tag in tagsStore.tags"
              :key="tag.id"
              :value="tag.name"
              :style="{ backgroundColor: tag.color || '#6366f1', color: 'white' }"
            />
          </div>
          <p v-else class="text-surface-400">Noch keine Tags.</p>
        </template>
      </Card>
    </div>
  </div>
</template>
