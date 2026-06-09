<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'Über uns — DMS',
  meta: [
    { name: 'description', content: 'Über Strainovic IT und das DMS-Projekt — intelligentes Dokumentenmanagement aus der Schweiz.' },
  ],
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Über uns</h1>

    <div class="space-y-6 text-surface-600 dark:text-surface-400">
      <p>
        DMS ist ein Produkt von <strong class="text-surface-900 dark:text-surface-100">Strainovic IT</strong> aus Steinach, Schweiz.
        Wir entwickeln Software, die komplexe Aufgaben einfach macht.
      </p>

      <p>
        Dieses Dokumentenmanagementsystem entstand aus der Erkenntnis, dass bestehende Lösungen
        entweder zu komplex, zu teuer oder nicht intelligent genug sind. Unser Ziel:
        Ein System, das Dokumente nicht nur speichert, sondern <em>versteht</em>.
      </p>

      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 pt-4">Unser Ansatz</h2>
      <ul class="list-disc list-inside space-y-2">
        <li>Automatische OCR-Erkennung statt manueller Texteingabe</li>
        <li>KI-gestütztes Tagging statt manueller Kategorisierung</li>
        <li>Semantische Suche statt starrer Schlüsselwörter</li>
        <li>Chat mit Dokumenten statt endlosem Scrollen</li>
      </ul>

      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 pt-4">Technologie</h2>
      <p>
        Gebaut mit Vue 3, Supabase (PostgreSQL + pgvector), Mistral AI und PrimeVue.
        Gehostet in Europa, DSGVO-konform.
      </p>

      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100 pt-4">Kontakt</h2>
      <p>
        Goran Strainovic<br />
        Bahnstr. 9b, 9323 Steinach<br />
        <a href="mailto:info@strainovic-it.ch" class="text-primary-500 hover:underline">info@strainovic-it.ch</a>
      </p>
    </div>
  </div>
</template>
