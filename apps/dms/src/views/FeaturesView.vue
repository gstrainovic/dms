<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'Features — DMS',
  meta: [
    { name: 'description', content: 'OCR, Auto-Tagging, Hybrid-Suche, RAG-Chat und mehr — alle DMS-Features im Detail.' },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Features</h1>

    <div class="space-y-12">
      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-camera text-primary-500"></i> OCR-Erkennung
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Automatische Texterkennung mit Mistral OCR. Unterstützt PDF-Dokumente und Bilder (PNG, JPG).
          Bei PDFs mit eingebettetem Text wird zuerst eine lokale Extraktion versucht — nur bei gescannten
          Dokumenten wird die Cloud-API genutzt. So sparen Sie Kosten und Ihre Daten bleiben lokal.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-tags text-primary-500"></i> Auto-Tagging &amp; Feld-Extraktion
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Die KI erkennt automatisch den Dokumenttyp (Rechnung, Vertrag, Arztbrief etc.) und extrahiert
          relevante Felder wie Rechnungsnummer, Datum, Betrag oder Vertragspartner.
          Tags werden automatisch vergeben und können manuell ergänzt werden.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-search text-primary-500"></i> Hybrid-Suche
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Kombiniert klassische Volltextsuche (PostgreSQL tsvector, deutsch) mit semantischer Vektorsuche
          (pgvector, Mistral Embed 1024-dim). Die Gewichtung ist konfigurierbar — Standard: 40% Volltext, 60% Vektor.
          Zusätzlich filterbar nach Dokumenttyp und Tags.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-comments text-primary-500"></i> RAG-Chat
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Stellen Sie Fragen zu Ihren Dokumenten in natürlicher Sprache. Das System findet automatisch
          die relevanten Dokument-Abschnitte und generiert eine Antwort mit Quellenverweisen.
          Basiert auf Mistral Small mit Retrieval-Augmented Generation.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-upload text-primary-500"></i> Flexibler Upload
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Drag &amp; Drop, Kamera-Aufnahme oder klassische Dateiauswahl. Multi-File-Upload mit
          Fortschrittsanzeige und automatischer SHA-256 Duplikaterkennung.
          Unterstützte Formate: PNG, JPG, PDF.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-shield text-primary-500"></i> Sicherheit &amp; Datenschutz
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Authentifizierung per E-Mail OTP (kein Passwort nötig). Multi-User mit vollständiger Datenisolierung
          durch Row Level Security. DSGVO-konform mit transparenter Datenschutzerklärung.
        </p>
      </section>
    </div>
  </div>
</template>
