<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'Impressum — DMS',
  meta: [
    { name: 'description', content: 'Impressum von Strainovic IT — Anbieterinformationen gemäss Schweizer Recht.' },
  ],
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">Impressum</h1>

    <div class="space-y-6 text-surface-600 dark:text-surface-400">
      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Angaben gemäss Schweizer Recht (Art. 3 UWG)</h2>
        <p>
          <strong class="text-surface-900 dark:text-surface-100">Strainovic IT</strong><br />
          Goran Strainovic<br />
          Bahnstr. 9b<br />
          9323 Steinach<br />
          Schweiz
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:info@strainovic-it.ch" class="text-primary-500 hover:underline">info@strainovic-it.ch</a>
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Vertretungsberechtigte Person</h2>
        <p>Goran Strainovic, Inhaber</p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Haftungsausschluss</h2>
        <p>
          Der Autor übernimmt keine Gewähr für die Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit
          und Vollständigkeit der Informationen. Haftungsansprüche gegen den Autor wegen Schäden
          materieller oder immaterieller Art, die aus dem Zugriff oder der Nutzung bzw. Nichtnutzung
          der veröffentlichten Informationen entstanden sind, werden ausgeschlossen.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Hinweis für EU-Nutzer</h2>
        <p>
          Sofern Dienstleistungen an Personen in der Europäischen Union erbracht werden,
          gelten ergänzend die Anforderungen der DSGVO (Datenschutz-Grundverordnung).
          Details finden Sie in unserer <router-link to="/datenschutz" class="text-primary-500 hover:underline">Datenschutzerklärung</router-link>.
        </p>
      </section>
    </div>
  </div>
</template>
