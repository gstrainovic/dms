<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'

const router = useRouter()

const menuItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/'),
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
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Menubar :model="menuItems">
      <template #start>
        <span class="font-bold text-xl mr-4">DMS</span>
      </template>
    </Menubar>
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>
