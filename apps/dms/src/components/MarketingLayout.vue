<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="border-b border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <span class="font-bold text-xl cursor-pointer" @click="router.push('/')">DMS</span>
          <nav class="hidden md:flex items-center gap-4">
            <router-link to="/features" class="text-surface-600 dark:text-surface-400 hover:text-primary-500 text-sm">Features</router-link>
            <router-link to="/pricing" class="text-surface-600 dark:text-surface-400 hover:text-primary-500 text-sm">Preise</router-link>
            <router-link to="/about" class="text-surface-600 dark:text-surface-400 hover:text-primary-500 text-sm">Über uns</router-link>
            <router-link to="/faq" class="text-surface-600 dark:text-surface-400 hover:text-primary-500 text-sm">FAQ</router-link>
          </nav>
        </div>
        <Button label="Anmelden" icon="pi pi-sign-in" size="small" @click="router.push('/login')" />
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 py-8">
      <div class="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-surface-500">
        <span>&copy; {{ new Date().getFullYear() }} Strainovic IT. Alle Rechte vorbehalten.</span>
        <nav class="flex gap-4">
          <router-link to="/impressum" class="hover:text-primary-500">Impressum</router-link>
          <router-link to="/datenschutz" class="hover:text-primary-500">Datenschutz</router-link>
        </nav>
      </div>
    </footer>
  </div>
</template>
