<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'Datenschutz — DMS',
  meta: [
    { name: 'description', content: 'Datenschutzerklärung von DMS — Informationen zur Datenverarbeitung gemäss DSG und DSGVO.' },
  ],
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

    <div class="space-y-8 text-surface-600 dark:text-surface-400">
      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">1. Verantwortlicher</h2>
        <p>
          Strainovic IT<br />
          Goran Strainovic<br />
          Bahnstr. 9b, 9323 Steinach, Schweiz<br />
          E-Mail: <a href="mailto:info@strainovic-it.ch" class="text-primary-500 hover:underline">info@strainovic-it.ch</a>
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">2. Rechtsgrundlagen</h2>
        <p>
          Diese Datenschutzerklärung basiert auf dem Schweizer Bundesgesetz über den Datenschutz (DSG)
          und, soweit anwendbar, auf der EU-Datenschutz-Grundverordnung (DSGVO).
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">3. Erhobene Daten</h2>
        <p>Wir verarbeiten folgende Daten:</p>
        <ul class="list-disc list-inside space-y-1 mt-2">
          <li><strong>E-Mail-Adresse:</strong> Für Authentifizierung per OTP-Code (kein Passwort)</li>
          <li><strong>Hochgeladene Dokumente:</strong> Dateien, OCR-Text, extrahierte Metadaten und Tags</li>
          <li><strong>Chat-Verläufe:</strong> Ihre Fragen und KI-Antworten (nur im Browser, nicht serverseitig gespeichert)</li>
          <li><strong>Technische Daten:</strong> IP-Adresse, Browser-Typ (in Server-Logs)</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">4. Hosting &amp; Infrastruktur</h2>
        <p>
          Unsere Anwendung nutzt <strong>Supabase</strong> als Backend-Plattform (PostgreSQL-Datenbank,
          Dateispeicher, Authentifizierung). Supabase-Server befinden sich in der EU (AWS Frankfurt).
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">5. Drittanbieter-Dienste</h2>
        <p>
          Für OCR-Erkennung, Auto-Tagging, Embedding-Generierung und Chat-Antworten nutzen wir die
          <strong>Mistral AI API</strong> (Mistral AI, Paris, Frankreich). Dabei werden Dokumentinhalte
          an die Mistral-Server in der EU übermittelt. Mistral verarbeitet die Daten gemäss ihrer
          Datenschutzrichtlinie und nutzt sie nicht zu Trainingszwecken.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">6. Cookies &amp; Local Storage</h2>
        <p>
          Wir verwenden keine Tracking-Cookies. Es werden ausschliesslich technisch notwendige
          Speicherungen im Browser vorgenommen:
        </p>
        <ul class="list-disc list-inside space-y-1 mt-2">
          <li><strong>Authentifizierungs-Token:</strong> Für die Sitzungsverwaltung (localStorage)</li>
          <li><strong>Theme-Einstellung:</strong> Hell/Dunkel-Modus Präferenz (localStorage)</li>
          <li><strong>Cookie-Banner-Status:</strong> Ob der Hinweis akzeptiert wurde (localStorage)</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">7. Datenisolierung</h2>
        <p>
          Jeder Benutzer hat einen vollständig isolierten Datenbereich. Sie sehen ausschliesslich
          Ihre eigenen Dokumente, Tags und Suchergebnisse. Dies wird durch PostgreSQL Row Level
          Security (RLS) auf Datenbankebene durchgesetzt.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">8. Ihre Rechte</h2>
        <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
        <ul class="list-disc list-inside space-y-1 mt-2">
          <li>Recht auf Auskunft über die gespeicherten Daten</li>
          <li>Recht auf Berichtigung unrichtiger Daten</li>
          <li>Recht auf Löschung Ihrer Daten</li>
          <li>Recht auf Datenübertragbarkeit</li>
          <li>Recht auf Widerruf der Einwilligung</li>
        </ul>
        <p class="mt-2">
          Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter
          <a href="mailto:info@strainovic-it.ch" class="text-primary-500 hover:underline">info@strainovic-it.ch</a>.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">9. Änderungen</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen.
          Die aktuelle Version ist stets auf dieser Seite verfügbar.
        </p>
        <p class="mt-2 text-sm">Stand: Februar 2026</p>
      </section>
    </div>
  </div>
</template>
