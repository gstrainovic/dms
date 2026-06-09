<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'

const router = useRouter()
const { signOut } = useAuth()

const menuItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/dashboard'),
  },
  {
    label: 'Dokumente',
    icon: 'pi pi-file',
    command: () => router.push('/documents'),
  },
  {
    label: 'Upload',
    icon: 'pi pi-upload',
    command: () => router.push('/upload'),
  },
  {
    label: 'Suche',
    icon: 'pi pi-search',
    command: () => router.push('/search'),
  },
  {
    label: 'Chat',
    icon: 'pi pi-comments',
    command: () => router.push('/chat'),
  },
  {
    label: 'Einstellungen',
    icon: 'pi pi-cog',
    command: () => router.push('/settings'),
  },
])

async function handleLogout() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Menubar :model="menuItems">
      <template #start>
        <span class="font-bold text-xl mr-4 cursor-pointer" @click="router.push('/dashboard')">DMS</span>
      </template>
      <template #end>
        <Button
          icon="pi pi-sign-out"
          label="Abmelden"
          severity="secondary"
          text
          size="small"
          @click="handleLogout"
        />
      </template>
    </Menubar>
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>
