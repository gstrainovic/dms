<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({
  title: 'Features — DMS',
  meta: [
    { name: 'description', content: 'Dokumente hochladen, automatisch sortieren lassen, in Sekunden wiederfinden und Fragen dazu stellen — für Privatpersonen, Teams und Unternehmen.' },
  ],
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-3">Features</h1>
    <p class="text-lg text-surface-600 dark:text-surface-400 mb-10">
      Weniger Abtippen, weniger Suchen, schnellere Antworten. Für die private Ablage genauso wie
      für Teams und Unternehmen, die Papierkram in nutzbare Information verwandeln wollen.
    </p>

    <div class="space-y-12">
      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-camera text-primary-500"></i> Texterkennung
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Gescannte Rechnungen, Fotos vom Smartphone oder PDF-Dateien werden automatisch in durchsuchbaren
          Text verwandelt. Niemand muss mehr etwas abtippen. Liegt der Text bereits digital vor, wird er
          direkt übernommen, ohne externe Verarbeitung. Das spart laufende Kosten und hält Ihre Daten so
          nah wie möglich bei Ihnen.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-tags text-primary-500"></i> Automatische Sortierung
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Jedes Dokument wird beim Hochladen erkannt und einsortiert: Rechnung, Vertrag, Arztbrief und mehr.
          Wichtige Angaben wie Rechnungsnummer, Datum, Betrag oder Vertragspartner liest das System selbst aus,
          Schlagwörter vergibt es automatisch. Sie können alles jederzeit ergänzen oder korrigieren.
          Privat bedeutet das: kein Ordnerchaos mehr. Im Unternehmen: weniger manuelle Erfassung, weniger
          Fehler, und jede Rechnung ist sofort dort, wo sie hingehört.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-search text-primary-500"></i> Intelligente Suche
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Finden Sie Dokumente auch dann, wenn Sie den genauen Wortlaut nicht mehr wissen. Die Suche versteht,
          was Sie meinen: „Zahnarztrechnung vom Frühjahr“ findet auch die Rechnung, in der nur „Praxis Dr. Müller,
          Behandlung 12.03.“ steht. Exakte Angaben wie Rechnungsnummern oder Namen treffen weiterhin punktgenau.
          Die Treffer lassen sich nach Dokumenttyp und Schlagwörtern eingrenzen.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-comments text-primary-500"></i> Fragen stellen statt suchen
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Fragen Sie Ihre Dokumente wie einen Kollegen: „Wann läuft mein Mietvertrag aus?“ oder
          „Wie viel haben wir letztes Jahr an diesen Lieferanten gezahlt?“ Die Antwort kommt in Sekunden und
          nennt die Dokumente, aus denen sie stammt. So bleibt jede Auskunft nachvollziehbar und prüfbar,
          auch wenn die Entscheidung darauf aufbaut.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-upload text-primary-500"></i> Hochladen in Sekunden
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Dateien einfach ins Fenster ziehen, mit der Handykamera abfotografieren oder klassisch auswählen,
          auch viele auf einmal. Doppelt hochgeladene Dokumente erkennt das System und legt sie nicht zweimal ab.
          Unterstützt werden PDF, PNG und JPG.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-3 flex items-center gap-2">
          <i class="pi pi-shield text-primary-500"></i> Sicherheit &amp; Datenschutz
        </h2>
        <p class="text-surface-600 dark:text-surface-400">
          Anmeldung per Einmalcode an Ihre E-Mail-Adresse, ganz ohne Passwort, das vergessen oder gestohlen
          werden kann. Jede Nutzerin und jeder Nutzer sieht ausschließlich die eigenen Dokumente, technisch
          bis auf Datenbankebene abgesichert. Die Verarbeitung entspricht der DSGVO, und die Datenschutzerklärung
          legt offen, was mit Ihren Daten geschieht.
        </p>
      </section>
    </div>
  </div>
</template>
