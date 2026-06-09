import { ref, readonly, type Ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const user: Ref<User | null> = ref(null)
const isLoading = ref(true)

let authReadyResolve: () => void
const authReady = new Promise<void>((resolve) => {
  authReadyResolve = resolve
})

let initialized = false

function initAuth() {
  if (initialized) return
  initialized = true

  supabase.auth.getSession().then(({ data: { session } }) => {
    user.value = session?.user ?? null
    isLoading.value = false
    authReadyResolve()
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
}

async function signIn(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw error
}

async function verifyOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function useAuth() {
  initAuth()
  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    authReady,
    signIn,
    verifyOtp,
    signOut,
  }
}
