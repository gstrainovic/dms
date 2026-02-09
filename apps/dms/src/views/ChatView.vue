<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChat, type ChatMessage } from '@/composables/useChat'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const router = useRouter()
const { messages, loading, hasMessages, sendMessage, clearChat } = useChat()

const input = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

async function onSend() {
  const msg = input.value.trim()
  if (!msg) return
  input.value = ''
  await sendMessage(msg)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-6rem)]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">Chat</h1>
      <Button
        v-if="hasMessages"
        label="Neuer Chat"
        icon="pi pi-refresh"
        severity="secondary"
        text
        size="small"
        @click="clearChat"
      />
    </div>

    <!-- Nachrichtenverlauf -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
      <!-- Willkommensnachricht -->
      <div v-if="!hasMessages" class="flex-1 flex items-center justify-center">
        <div class="text-center text-surface-400">
          <i class="pi pi-comments text-5xl mb-4 block" />
          <p class="text-lg">Fragen Sie etwas zu Ihren Dokumenten</p>
          <p class="text-sm mt-2">Der Chat durchsucht automatisch relevante Dokumente und antwortet basierend auf deren Inhalt.</p>
        </div>
      </div>

      <!-- Nachrichten -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-2xl rounded-lg p-3"
          :class="msg.role === 'user'
            ? 'bg-primary text-primary-contrast'
            : 'bg-surface-100'"
        >
          <p class="whitespace-pre-wrap text-sm">{{ msg.content }}</p>

          <!-- Quellen -->
          <div v-if="msg.sources?.length" class="mt-2 pt-2 border-t border-surface-300">
            <p class="text-xs font-medium mb-1 opacity-70">Quellen:</p>
            <div class="flex flex-col gap-1">
              <div
                v-for="source in msg.sources"
                :key="source.id"
                class="flex items-center gap-2 text-xs cursor-pointer hover:underline"
                @click="router.push(`/documents/${source.id}`)"
              >
                <i class="pi pi-file text-xs" />
                <span>{{ source.title }}</span>
                <Tag v-if="source.documentType" :value="source.documentType" severity="secondary" class="text-xs" />
              </div>
            </div>
          </div>

          <span class="text-xs opacity-50 block mt-1">{{ formatTime(msg.timestamp) }}</span>
        </div>
      </div>

      <!-- Typing-Indikator -->
      <div v-if="loading" class="flex justify-start">
        <div class="bg-surface-100 rounded-lg p-3">
          <i class="pi pi-spin pi-spinner text-sm" /> Denkt nach...
        </div>
      </div>
    </div>

    <!-- Eingabe -->
    <div class="flex gap-2 pt-2 border-t border-surface-200">
      <InputText
        v-model="input"
        placeholder="Nachricht eingeben..."
        class="flex-1"
        :disabled="loading"
        @keyup.enter="onSend"
      />
      <Button
        icon="pi pi-send"
        :loading="loading"
        :disabled="!input.trim()"
        @click="onSend"
      />
    </div>
  </div>
</template>
