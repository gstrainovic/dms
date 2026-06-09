<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const { verifyOtp, signIn, user, authReady } = useAuth()

// Redirect wenn schon eingeloggt
onMounted(async () => {
  await authReady
  if (user.value) {
    router.push('/dashboard')
  }
})

const email = ref('')
const token = ref('')
const step = ref<'email' | 'code'>('email')
const loading = ref(false)
const error = ref('')

async function sendCode() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value)
    step.value = 'code'
  } catch (e: any) {
    error.value = e.message || 'Fehler beim Senden des Codes'
  } finally {
    loading.value = false
  }
}

async function verify() {
  error.value = ''
  loading.value = true
  try {
    await verifyOtp(email.value, token.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Ungültiger Code'
  } finally {
    loading.value = false
  }
}

function back() {
  step.value = 'email'
  token.value = ''
  error.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">DMS</h1>
        <p class="text-surface-500">Dokumentenmanagement-System</p>
      </div>

      <div class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md p-8">
        <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

        <!-- Step 1: Email -->
        <template v-if="step === 'email'">
          <h2 class="text-xl font-semibold mb-4">Anmelden</h2>
          <p class="text-surface-500 mb-4">Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Anmeldecode.</p>
          <form @submit.prevent="sendCode">
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium mb-1">E-Mail</label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                placeholder="name@beispiel.ch"
                class="w-full"
                required
                autofocus
              />
            </div>
            <Button
              type="submit"
              label="Code senden"
              icon="pi pi-send"
              class="w-full"
              :loading="loading"
              :disabled="!email"
            />
          </form>
        </template>

        <!-- Step 2: Code -->
        <template v-else>
          <h2 class="text-xl font-semibold mb-4">Code eingeben</h2>
          <p class="text-surface-500 mb-4">
            Wir haben einen 6-stelligen Code an <strong>{{ email }}</strong> gesendet.
          </p>
          <form @submit.prevent="verify">
            <div class="mb-4">
              <label for="token" class="block text-sm font-medium mb-1">Code</label>
              <InputText
                id="token"
                v-model="token"
                placeholder="000000"
                class="w-full text-center text-2xl tracking-widest"
                maxlength="6"
                required
                autofocus
              />
            </div>
            <Button
              type="submit"
              label="Anmelden"
              icon="pi pi-sign-in"
              class="w-full mb-3"
              :loading="loading"
              :disabled="token.length !== 6"
            />
            <Button
              type="button"
              label="Zurück"
              icon="pi pi-arrow-left"
              severity="secondary"
              text
              class="w-full"
              @click="back"
            />
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
