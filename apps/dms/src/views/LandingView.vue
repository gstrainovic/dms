<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

useHead({
  title: 'DMS — Intelligentes Dokumentenmanagement',
  meta: [
    { name: 'description', content: 'Upload, OCR, Auto-Tagging, Hybrid-Suche und RAG-Chat — alles in einem System.' },
  ],
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="py-20 px-4 text-center bg-gradient-to-b from-primary-50 to-surface-0 dark:from-surface-900 dark:to-surface-950">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-6">
          Ihre Dokumente, <span class="text-primary-500">intelligent</span> verwaltet
        </h1>
        <p class="text-lg text-surface-600 dark:text-surface-400 mb-8">
          Upload, automatische OCR-Erkennung, KI-gestütztes Tagging und eine hybride Suche
          — alles in einem modernen Dokumentenmanagementsystem.
        </p>
        <div class="flex gap-3 justify-center">
          <Button label="Jetzt starten" icon="pi pi-arrow-right" size="large" @click="router.push('/login')" />
          <Button label="Features ansehen" icon="pi pi-list" size="large" severity="secondary" outlined @click="router.push('/features')" />
        </div>
      </div>
    </section>

    <!-- Feature Grid -->
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-bold text-center mb-12">Was DMS kann</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center p-6">
            <i class="pi pi-camera text-4xl text-primary-500 mb-4"></i>
            <h3 class="font-semibold text-lg mb-2">OCR-Erkennung</h3>
            <p class="text-surface-500">Automatische Texterkennung per Mistral OCR — auch bei gescannten Dokumenten und Fotos.</p>
          </div>
          <div class="text-center p-6">
            <i class="pi pi-tags text-4xl text-primary-500 mb-4"></i>
            <h3 class="font-semibold text-lg mb-2">Auto-Tagging</h3>
            <p class="text-surface-500">KI erkennt Dokumenttyp, extrahiert Felder und vergibt Tags automatisch.</p>
          </div>
          <div class="text-center p-6">
            <i class="pi pi-search text-4xl text-primary-500 mb-4"></i>
            <h3 class="font-semibold text-lg mb-2">Hybrid-Suche</h3>
            <p class="text-surface-500">Volltextsuche kombiniert mit semantischer Vektorsuche für beste Ergebnisse.</p>
          </div>
          <div class="text-center p-6">
            <i class="pi pi-comments text-4xl text-primary-500 mb-4"></i>
            <h3 class="font-semibold text-lg mb-2">RAG-Chat</h3>
            <p class="text-surface-500">Stellen Sie Fragen zu Ihren Dokumenten — die KI antwortet mit Quellenangaben.</p>
          </div>
          <div class="text-center p-6">
            <i class="pi pi-upload text-4xl text-primary-500 mb-4"></i>
            <h3 class="font-semibold text-lg mb-2">Einfacher Upload</h3>
            <p class="text-surface-500">Drag &amp; Drop, Kamera-Aufnahme oder Dateiauswahl — PNG, JPG, PDF.</p>
          </div>
          <div class="text-center p-6">
            <i class="pi pi-shield text-4xl text-primary-500 mb-4"></i>
            <h3 class="font-semibold text-lg mb-2">Datenschutz</h3>
            <p class="text-surface-500">DSGVO-konform. Ihre Daten gehören Ihnen. Multi-User mit isolierten Daten.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 bg-primary-50 dark:bg-surface-900 text-center">
      <h2 class="text-2xl font-bold mb-4">Bereit, Ihre Dokumente zu organisieren?</h2>
      <p class="text-surface-600 dark:text-surface-400 mb-6">Kostenlos starten — keine Kreditkarte nötig.</p>
      <Button label="Jetzt anmelden" icon="pi pi-user-plus" size="large" @click="router.push('/login')" />
    </section>
  </div>
</template>
