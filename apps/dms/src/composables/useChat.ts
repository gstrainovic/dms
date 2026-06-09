import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

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
  const { user } = useAuth()
  const messages = ref<ChatMessage[]>([])
  const currentSessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasMessages = computed(() => messages.value.length > 0)

  async function loadLastSession() {
    if (!user.value) return

    loading.value = true
    try {
      // 1. Letzte Session des Users finden
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.value.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (sessionError) throw sessionError

      if (sessions && sessions.length > 0) {
        currentSessionId.value = sessions[0].id
        
        // 2. Nachrichten dieser Session laden
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', currentSessionId.value)
          .order('created_at', { ascending: true })

        if (msgError) throw msgError

        messages.value = msgs.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sources: m.sources as ChatSource[] | undefined,
          timestamp: new Date(m.created_at)
        }))
      }
    } catch (e) {
      console.error('Fehler beim Laden des Chats:', e)
      error.value = 'Chat-Verlauf konnte nicht geladen werden'
    } finally {
      loading.value = false
    }
  }

  // Initial laden und bei User-Wechsel
  watch(user, (newUser) => {
    if (newUser) {
      loadLastSession()
    } else {
      messages.value = []
      currentSessionId.value = null
    }
  }, { immediate: true })

  async function sendMessage(content: string) {
    if (!content.trim() || !user.value) return

    loading.value = true
    error.value = null

    try {
      // 1. Session sicherstellen
      if (!currentSessionId.value) {
        const { data: session, error: sErr } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.value.id, title: content.slice(0, 50) })
          .select()
          .single()
        
        if (sErr) throw sErr
        currentSessionId.value = session.id
      }

      // 2. User-Nachricht speichern
      const { data: userMsg, error: uMsgErr } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId.value,
          role: 'user',
          content
        })
        .select()
        .single()

      if (uMsgErr) throw uMsgErr

      messages.value.push({
        id: userMsg.id,
        role: 'user',
        content: userMsg.content,
        timestamp: new Date(userMsg.created_at)
      })

      // 3. Edge Function aufrufen
      const history = messages.value
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const { data, error: fnError } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          history: history.slice(0, -1),
        },
      })

      if (fnError) throw new Error(fnError.message)

      // 4. Assistant-Nachricht speichern
      const { data: assistMsg, error: aMsgErr } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId.value,
          role: 'assistant',
          content: data.reply,
          sources: data.sources
        })
        .select()
        .single()

      if (aMsgErr) throw aMsgErr

      messages.value.push({
        id: assistMsg.id,
        role: 'assistant',
        content: assistMsg.content,
        sources: assistMsg.sources as ChatSource[],
        timestamp: new Date(assistMsg.created_at)
      })

      // Session timestamp aktualisieren
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId.value)

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Chat fehlgeschlagen'
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

  async function clearChat() {
    if (currentSessionId.value) {
      await supabase.from('chat_sessions').delete().eq('id', currentSessionId.value)
    }
    messages.value = []
    currentSessionId.value = null
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
