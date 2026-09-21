# Offene Punkte

Technische Entscheidungen stehen in `AGENTS.md`, Geschäftsmodell und Preise im privaten Repo `~/projects/business`. Reihenfolge, nicht Themen.

Entscheid vom 21.09.2026: auto-service ist fertig, dms wird jetzt produktivreif gemacht, noch vor zahlenden Kunden. Abgerechnet wird per Jahresrechnung mit QR-Zahlteil, ohne Zahlungsanbieter. Vorbild für fast alles ist auto-service (`~/projects/auto-service`), dessen Commits die Punkte unten belegen.

## 1. Preismodell festlegen

Hängt an allem Weiteren: Testzeit im Proxy, DB-CHECK, AGB, Preisseite.

- [ ] Testzeit statt dauerhaftem Gratisplan? Bei auto-service 30 Tage ab erster KI-Nutzung, danach nur Lesen und Export (ai-proxy `1692d26`)
- [ ] Jahrespreise und Zielgruppen (privat, Betrieb, Treuhand/Arztpraxis), Kontingente nur als Missbrauchsgrenze statt als Verkaufsargument (business `beobachtungen.md`)
- [ ] Limits in `_shared/plans.ts` mit einem echten Lauf nachmessen, inklusive Embeddings (Vorgehen wie business `71edbf4`)
- [ ] `plans.ts`, `PricingView.vue` und die Preisseiten-Versprechen («Prioritäts-Support», «Custom Schemas») angleichen

## 2. ai-proxy auf den Stand von auto-service bringen

dms pinnt v0.2.0 (`cd0dee4`), ai-proxy ist 21 Commits weiter und hat keinen neueren Tag.

- [ ] Testzeit: Migration `00007_ai_proxy.sql` erlaubt `status = 'trial'` nicht, und der `SupabaseStore` speichert `trialStartedAt` nicht. Ohne Anpassung endet jeder KI-Aufruf ohne Abo in 500
- [ ] Jahresabo mit QR-Rechnung (`b77b713`, `invoice-subscription.ts`) im `SupabaseStore` unterstützen; heute nur im InstantStore von auto-service
- [ ] `swissqrbill/` in `supabase/functions/ai-proxy/deno.json`, danach `deno check`
- [ ] Fair-Use-Bremse: `burstLimit` im Edge-Einstieg aus `AI_PROXY_BURST_LIMIT` lesen (heute fest 20/min, ein Dokument braucht rund vier Aufrufe) und in `_shared/ai-proxy.ts` 429 mit `Retry-After` nachversuchen, sonst scheitern Mehrfach-Uploads
- [ ] In ai-proxy einen Tag setzen, Hash in `supabase/functions/ai-proxy/index.ts` nachziehen
- [ ] Upgrade-Knopf in `BillingCard.vue` nur zeigen, wenn `/me/usage` `ordering` meldet (auto-service `bfcdd38`)

## 2b. KI-Verarbeitung in der Schweiz prüfen

dms-Dokumente (Steuern, Verträge, Gesundheit) sind heikler als Werkstattrechnungen. Mistral in Frankreich ist nach nDSG zulässig (EU in Anhang 1 DSV), widerspricht aber «alles in der Schweiz». Kandidat: Infomaniak AI Services (Server laufen schon dort, AVV im Manager, keine Grundgebühr, OpenAI-kompatibel): Chat Mistral Small 4, Embeddings Qwen3-Embedding-8B. Recherche vom 21.09.2026.

- [ ] OCR-Vergleich mit 30–50 echten Dokumenten (schiefe Handyfotos, Steuerformulare mit Tabellen, Handschrift, Frankenbeträge): Mistral OCR gegen Infomaniak-Vision-Modell und kvant DeepSeek OCR. Messen: Zeichenfehler, Tabellen, Feld-Extraktion (Betrag, Datum, IBAN), Halluzinationen, Tokens und Laufzeit pro Seite
- [ ] Anbieter im ai-proxy umschaltbar machen (betrifft auch auto-service)
- [ ] Embeddings: andere Dimension als 1024, also Migration der pgvector-Spalte und Neuindexierung
- [ ] Danach Datenschutz, AVV und Preisseite auf den tatsächlichen Verarbeitungsort anpassen

## 3. Rechtliches

- [ ] AGB-Seite nach Vorbild auto-service `src/pages/AgbPage.vue` (`b48d25f`): Testzeit, Jahresabo, QR-Rechnung, Kündigung, Preisänderung, Haftung, dazu Aufbewahrung und Löschung der Dokumente. Preise aus `plans.ts` importieren statt abschreiben; in Footer und Bestelldialog verlinken
- [ ] GeBüV: dms ist keine revisionssichere Aufbewahrung im Sinne der Geschäftsbücherverordnung, sondern eine Such- und Arbeitsablage daneben. In AGB (Leistung) und FAQ ausdrücklich so sagen, und nirgends mit «revisionssicher» oder «Archiv nach GeBüV» werben
- [ ] Auftragsverarbeitungsvertrag für Geschäftskunden als öffentliche Seite `/avv`, gilt mit den AGB
- [ ] Datenschutzerklärung nachziehen, sobald feststeht: Mail-Versand (Resend?), Abo- und Rechnungsdaten, Aufbewahrung der Server-Logs, Aufsichtsbehörde EDÖB, Mistral-Bezug zum AVV (Scale-Tier)
- [ ] Cookie-Banner entfernen, es gibt nur technisch notwendige Speicherung (auto-service hat keinen); Datenschutz Abschnitt 6 und `acceptCookies` in den E2E-Fixtures anpassen

## 4. Betrieb

- [ ] Domain für dms festlegen
- [ ] Eigene Instanz in der Infomaniak Public Cloud (Schweiz, 2 vCPU / 4 GB) im selben OpenStack-Projekt wie auto-service: Frontend und selbst gehosteter Supabase-Stack ohne Studio, Analytics und Log-Pipeline
- [ ] `deploy/` mit Docker Compose, Caddyfile (Assets unveränderlich cachen, `index.html` mit `max-age=0`, `www.`-Umleitung, Zugriffslog 30 Tage) und `deploy.sh` mit Health-Prüfung am Ende (auto-service `455fc2e`, `7959329`)
- [ ] Mail für Anmelde-Codes: SMTP in `supabase/config.toml` (heute auskommentiert), `site_url` und Redirects auf die Domain. DKIM im Infomaniak-Manager als Typ «DKIM» anlegen, per API bleibt er stumm (auto-service `3dffbcd`)
- [ ] Backup: täglicher `pg_dump` plus **Storage-Dateien**, Kopie ausser Haus in Swift mit TempURL-Schlüssel statt OpenStack-Zugang auf dem Server (auto-service `61dfd99`); Restore einmal üben, inklusive `auth`-Schema und pgvector
- [ ] Health-Check von aussen: Workflow wie auto-service `health.yml` (`56aa530`) für Website, `/auth/v1/health` und ai-proxy
- [ ] Kostenwächter `wartungsheft-cost-watch` um die dms-Instanz erweitern, Grenze neu setzen; Mistral-Ausgabenlimit prüfen
- [ ] Dev ohne Podman (Windows): Dev-Instanz per SSH-Tunnel wie `wartungsheft-dev`, braucht die Ports 54321, 54322 und 54324; oder Supabase auf `wartungsheft-dev` mitlaufen lassen, falls der RAM reicht

## 5. App

- [ ] Zentrale Fehlermeldungen nach auto-service `src/lib/errors.ts` (`842d3d7`): 402, 429, Netz und Auth als deutsche Sätze; die Limit-Meldung im Upload prominent zeigen statt wie jeden anderen Fehler
- [ ] Auffindbarkeit: `apps/dms/public/` mit `robots.txt` (KI-Crawler erlaubt), `sitemap.xml`, `llms.txt`, dazu JSON-LD in `index.html` (auto-service `d7cb755`)
- [ ] Messung ohne Analytics-Dienst: Besucher aus dem Caddy-Log, Feld `source` an `documents` (Upload, Kamera, Drag & Drop) wie auto-service `e158cb5`
- [ ] Hygiene-Tests gegen ungenutzte Abhängigkeiten und Komponenten (auto-service `cd55593`)

## 6. Doku

- [ ] `AGENTS.md` als Hauptdatei, `CLAUDE.md` nur noch `@AGENTS.md` (auto-service `4d32220`); die Evaluationstabellen aus `CLAUDE.md` streichen oder archivieren
- [ ] Keine Testzahlen in der Doku («112 Tests» in `CLAUDE.md`), sie veralten mit jedem Test

## Später

- [ ] Payrexx, erst bei monatlicher Kartenzahlung oder über rund 20 Kunden; die Anbindung entsteht im Repo ai-proxy. Stripe-Code bis dahin stehen lassen

### Server-seitiges BYOK für Geschäftskunden, erst wenn ein Kunde danach fragt

- [ ] Organisationen und Zuordnung Nutzer → Organisation
- [ ] Key pro Organisation verschlüsselt im Store, Eingabe und Test in den Einstellungen
- [ ] Proxy nutzt Organisations-Key statt Plattform-Key, Verbrauch zählt nicht gegen das Limit
- [ ] Tests: Auflösung, Fallback, kein Key in Responses
