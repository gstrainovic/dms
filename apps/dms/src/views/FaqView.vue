<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'FAQ — DMS',
  meta: [
    { name: 'description', content: 'Häufig gestellte Fragen zum DMS — Dokumentenmanagement, OCR, Datenschutz und mehr.' },
  ],
})

const faqs = [
  {
    question: 'Welche Dateiformate werden unterstützt?',
    answer: 'Aktuell unterstützen wir PNG, JPG und PDF. Weitere Formate sind in Planung.',
  },
  {
    question: 'Wie funktioniert die OCR-Erkennung?',
    answer: 'Für PDFs mit eingebettetem Text verwenden wir eine lokale Extraktion. Bei gescannten Dokumenten und Bildern nutzen wir die Mistral OCR API, die auch handschriftlichen Text erkennt.',
  },
  {
    question: 'Wie genau ist das Auto-Tagging?',
    answer: 'Die KI-gestützte Klassifizierung erkennt gängige Dokumenttypen (Rechnungen, Verträge, Arztbriefe) sehr zuverlässig. Tags können jederzeit manuell korrigiert oder ergänzt werden.',
  },
  {
    question: 'Sind meine Daten sicher?',
    answer: 'Ja. Jeder Benutzer hat einen isolierten Datenbereich (Row Level Security). Die Authentifizierung erfolgt per E-Mail-Code, ohne Passwort. Wir sind DSGVO- und DSG-konform.',
  },
  {
    question: 'Kann ich DMS selbst hosten?',
    answer: 'Ja. DMS basiert auf Open-Source-Technologien (Supabase, Vue, PostgreSQL). Sie können es auf Ihrer eigenen Infrastruktur betreiben.',
  },
  {
    question: 'Was kostet die Nutzung?',
    answer: 'Der Starter-Plan ist kostenlos und beinhaltet bis zu 100 Dokumente. Für unbegrenzte Nutzung gibt es den Pro-Plan.',
  },
]
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Häufig gestellte Fragen</h1>

    <div class="space-y-6">
      <div v-for="(faq, i) in faqs" :key="i" class="border-b border-surface-200 dark:border-surface-700 pb-6">
        <h2 class="text-lg font-semibold mb-2">{{ faq.question }}</h2>
        <p class="text-surface-600 dark:text-surface-400">{{ faq.answer }}</p>
      </div>
    </div>
  </div>
</template>
