<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUpload, type UploadItem } from '@/composables/useUpload'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import type { RealtimeChannel } from '@supabase/supabase-js'

const router = useRouter()
const toast = useToast()
const {
  items,
  uploading,
  pendingCount,
  doneCount,
  errorCount,
  addFiles,
  removeItem,
  clearCompleted,
  uploadAll,
  subscribeToDocumentUpdates,
} = useUpload()

const dragOver = ref(false)
const fileInput = ref<HTMLInputElement>()
const cameraInput = ref<HTMLInputElement>()
let realtimeChannel: RealtimeChannel | null = null

onMounted(() => {
  realtimeChannel = subscribeToDocumentUpdates()
})

onUnmounted(() => {
  realtimeChannel?.unsubscribe()
})

function onDrop(e: DragEvent) {
  dragOver.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) addFiles(files)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) addFiles(files)
  input.value = ''
}

async function startUpload() {
  await uploadAll()
  const done = doneCount.value
  if (done > 0) {
    toast.add({
      severity: 'success',
      summary: 'Upload abgeschlossen',
      detail: `${done} Dokument(e) hochgeladen`,
      life: 3000,
    })
  }
}

function statusLabel(item: UploadItem): string {
  switch (item.status) {
    case 'pending': return 'Bereit'
    case 'uploading': return 'Wird hochgeladen...'
    case 'processing': return 'Wird verarbeitet...'
    case 'done': return 'Fertig'
    case 'error': return item.error || 'Fehler'
    case 'duplicate': return 'Duplikat'
    default: return item.status
  }
}

function statusSeverity(status: UploadItem['status']) {
  switch (status) {
    case 'done': return 'success' as const
    case 'error': return 'danger' as const
    case 'duplicate': return 'warn' as const
    case 'processing': return 'info' as const
    default: return 'secondary' as const
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string) {
  if (type === 'application/pdf') return 'pi pi-file-pdf'
  if (type.startsWith('image/')) return 'pi pi-image'
  return 'pi pi-file'
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Dokument hochladen</h1>
      <div class="flex gap-2">
        <Button
          v-if="items.length"
          label="Erledigte entfernen"
          icon="pi pi-times"
          severity="secondary"
          size="small"
          @click="clearCompleted"
        />
      </div>
    </div>

    <!-- Drop Zone -->
    <Card class="mb-4">
      <template #content>
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
          :class="dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <i class="pi pi-cloud-upload text-5xl mb-3" :class="dragOver ? 'text-primary' : 'text-gray-400'" />
          <p class="text-lg mb-1">Dateien hierher ziehen oder klicken</p>
          <p class="text-sm text-gray-500 mb-4">PDF, JPG, PNG, WebP — Max. 50 MB pro Datei</p>
          <div class="flex gap-2 justify-center">
            <Button
              label="Dateien wählen"
              icon="pi pi-folder-open"
              severity="secondary"
              @click.stop="fileInput?.click()"
            />
            <Button
              label="Kamera"
              icon="pi pi-camera"
              severity="secondary"
              @click.stop="cameraInput?.click()"
            />
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          class="hidden"
          @change="onFileSelect"
        />
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onFileSelect"
        />
      </template>
    </Card>

    <!-- File List -->
    <div v-if="items.length" class="space-y-2 mb-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 p-3 bg-white rounded-lg border"
      >
        <i :class="fileIcon(item.file.type)" class="text-xl text-gray-500" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">{{ item.file.name }}</span>
            <span class="text-sm text-gray-400">{{ formatSize(item.file.size) }}</span>
          </div>
          <ProgressBar
            v-if="['uploading', 'processing'].includes(item.status)"
            :value="item.progress"
            :showValue="false"
            class="h-1 mt-1"
          />
        </div>
        <Tag :value="statusLabel(item)" :severity="statusSeverity(item.status)" />
        <Button
          v-if="item.status === 'done' && item.documentId"
          icon="pi pi-eye"
          severity="secondary"
          text
          rounded
          size="small"
          @click="router.push(`/documents/${item.documentId}`)"
        />
        <Button
          icon="pi pi-times"
          severity="danger"
          text
          rounded
          size="small"
          @click="removeItem(item.id)"
          :disabled="item.status === 'uploading'"
        />
      </div>
    </div>

    <!-- Upload Button -->
    <div v-if="pendingCount > 0" class="flex justify-end">
      <Button
        :label="`${pendingCount} Dokument(e) hochladen`"
        icon="pi pi-upload"
        :loading="uploading"
        @click="startUpload"
      />
    </div>
  </div>
</template>
