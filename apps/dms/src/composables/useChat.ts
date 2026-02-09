import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  timestamp: Date
}

export interface ChatSource {
  id: string
  title: string
  documentType: string | null
  score: number
}

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasMessages = computed(() => messages.value.length > 0)

  async function sendMessage(content: string) {
    if (!content.trim()) return

    // User-Nachricht hinzufügen
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    messages.value.push(userMessage)

    loading.value = true
    error.value = null

    try {
      // History für Kontext (ohne Sources)
      const history = messages.value
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const { data, error: fnError } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          history: history.slice(0, -1), // Letzte User-Nachricht nicht doppelt
        },
      })

      if (fnError) throw new Error(fnError.message)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        sources: data.sources,
        timestamp: new Date(),
      }
      messages.value.push(assistantMessage)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Chat fehlgeschlagen'
      // Error-Nachricht als System-Antwort
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Fehler: ${error.value}`,
        timestamp: new Date(),
      })
    } finally {
      loading.value = false
    }
  }

  function clearChat() {
    messages.value = []
    error.value = null
  }

  return {
    messages,
    loading,
    error,
    hasMessages,
    sendMessage,
    clearChat,
  }
}
