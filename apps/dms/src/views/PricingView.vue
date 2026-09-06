<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

useHead({
  title: 'Preise — DMS',
  meta: [
    { name: 'description', content: 'DMS-Preismodelle — starten Sie kostenlos und skalieren Sie nach Bedarf.' },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-4 text-center">Preise</h1>
    <p class="text-center text-surface-500 mb-12">Einfach, transparent, fair.</p>

    <div class="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
      <!-- Free -->
      <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-8 text-center">
        <h2 class="text-lg font-semibold mb-2">Starter</h2>
        <div class="text-4xl font-bold mb-1">Gratis</div>
        <p class="text-surface-500 mb-6">Für den Einstieg</p>
        <ul class="text-left space-y-2 mb-8 text-sm">
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Bis 100 Dokumente</li>
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Texterkennung &amp; automatische Sortierung</li>
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Suche nach Stichwörtern</li>
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Fragen an Ihre Dokumente stellen</li>
        </ul>
        <Button label="Kostenlos starten" class="w-full" severity="secondary" outlined @click="router.push('/login')" />
      </div>

      <!-- Pro -->
      <div class="border-2 border-primary-500 rounded-xl p-8 text-center relative">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">Empfohlen</span>
        <h2 class="text-lg font-semibold mb-2">Pro</h2>
        <div class="text-4xl font-bold mb-1">CHF 19<span class="text-lg text-surface-500">/Mt.</span></div>
        <p class="text-surface-500 mb-6">Für den Alltag</p>
        <ul class="text-left space-y-2 mb-8 text-sm">
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Unbegrenzte Dokumente</li>
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Intelligente Suche (versteht, was Sie meinen)</li>
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Prioritäts-Support</li>
          <li class="flex items-center gap-2"><i class="pi pi-check text-green-500"></i> Custom Schemas</li>
        </ul>
        <Button label="Pro wählen" class="w-full" @click="router.push('/login')" />
      </div>
    </div>
  </div>
</template>
