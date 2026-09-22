# Offene Punkte

Technische Entscheidungen stehen in `AGENTS.md`, Geschäftsmodell und Preise im privaten Repo `~/projects/business` (`dms/geschaeftsmodell.md`). Sortiert nach Meilensteinen, innerhalb davon in der Reihenfolge, in der die Punkte voneinander abhängen.

Entscheid vom 21./22.09.2026: dms wird produktivreif gemacht, noch vor zahlenden Kunden. Privat und Betrieb starten zusammen. 30 Tage Testzeit, dann Privat 79 CHF im Jahr oder Betrieb 600 CHF im Jahr pro Firma für alle Mitarbeitenden, Jahresrechnung mit QR-Zahlteil, ohne Zahlungsanbieter. Vorbild für fast alles ist auto-service (`~/projects/auto-service`), dessen Commits die Punkte unten belegen.

## 1. Offene Entscheide und Vorarbeiten

Davon hängt Späteres ab.

- [ ] **Domain für dms festlegen.** Brauchen Mail-Versand, Eingangs-Mailadresse, Caddy, `site_url` und die Rechtstexte
- [ ] **OCR-Test Mistral gegen alle Schweizer Optionen.** Entscheidet, ob OCR und KI in die Schweiz wandern oder bei Mistral bleiben, und damit Datenschutz, AVV und Vermarktung. Qualität vor Standort: Ist die Schweizer OCR schlechter, bleibt es bei Mistral. dms-Dokumente (Steuern, Verträge, Gesundheit) sind heikler als Werkstattrechnungen; Mistral in Frankreich ist nach nDSG zulässig (EU in Anhang 1 DSV).
  - Nur **gescannte und fotografierte** Dokumente testen. PDFs aus Word und Co. haben eingebetteten Text, den `process-ocr` schon lokal ausliest, ohne OCR
  - Testsatz 30–50 echte Seiten: schiefe und unscharfe Handyfotos, Scans, Steuerformulare mit Tabellen, mehrspaltige Seiten, Kleingedrucktes, Handschrift, Umlaute, Frankenbeträge, IBAN und QR-Zahlteil
  - Kandidaten: Mistral OCR (Referenz); Infomaniak AI Services, jedes Modell mit Bildeingabe (Mistral Small 4, Qwen3.5 u. a., welche Bilder annehmen, ist dort nicht dokumentiert); kvant/Phoeniqs DeepSeek OCR, Qwen3 VL 235B, Gemma 4, Llama 4, Apertus 1.5; Swisscom Swiss AI Platform, falls als Einzelfirma zugänglich; Exoscale Managed Inference, sobald verfügbar; selbst betriebene OCR-Modelle auf einer GPU-Instanz in der Schweiz als Kostenvergleich
  - Messen: Zeichenfehlerrate gegen eine von Hand geprüfte Referenz, Tabellen und Struktur, Feld-Extraktion (Betrag, Datum, IBAN, Rechnungsnummer), erfundener Text, Tokens, Kosten und Laufzeit pro Seite, Grenzen pro Anfrage (mehrseitige Scans als Einzelbilder)
  - Ergebnis mit Zahlen in `AGENTS.md` festhalten, Testsatz ohne Personendaten im Repo oder privat ablegen
  - Gewinnt ein Schweizer Anbieter: Anbieter im ai-proxy umschaltbar machen (betrifft auch auto-service), Embeddings mit anderer Dimension als 1024 heissen Migration der pgvector-Spalte und Neuindexierung. Kandidat für Chat und Embeddings ist Infomaniak AI Services (Server laufen schon dort, AVV im Manager, keine Grundgebühr, OpenAI-kompatibel)
- [ ] Dev ohne Podman (Windows): Dev-Instanz per SSH-Tunnel wie `wartungsheft-dev`, braucht die Ports 54321, 54322 und 54324; oder Supabase auf `wartungsheft-dev` mitlaufen lassen, falls der RAM reicht

## 2. Bis zum Go-live

### 2.1 Preismodell umsetzen

- [ ] `_shared/plans.ts` auf die zwei Jahresstufen umstellen, Testzeit wie auto-service: 30 Tage ab erster KI-Nutzung, danach Lesen, Stichwortsuche und Export frei (ai-proxy `1692d26`)
- [ ] Missbrauchsgrenzen in `plans.ts` mit einem echten Lauf nachmessen, inklusive Embeddings (Vorgehen wie business `71edbf4`)
- [ ] `PricingView.vue` auf die Jahrespreise umbauen, Preise aus `plans.ts` statt fest im Template, Versprechen ohne Grundlage streichen («Prioritäts-Support», «Custom Schemas»)
- [ ] ai-proxy ist in Plänen und Texten noch auf Wartungsheft zugeschnitten: `trialExpiredError` nennt «Wartungsheft» samt Fahrzeugpreisen, sobald der Katalog einen Plan `privat` hat; `orderSubscription`/`renewSubscription` rechnen über `vehicles` und `yearlyPriceChf`. Preis und Text pro Katalog injizierbar machen, bevor dms `privat`/`betrieb` einführt
- [ ] Jahresrechnung in dms: der `SupabaseStore` speichert Rechnungs-Abos, aber `createEdgeApp` verdrahtet `invoicing` (PDF mit QR-Zahlteil, Versand über Resend) nicht; ohne das antworten `/billing/order`, `/cancel`, `/resume` mit 501. Dazu ein Verlängerungs-Job wie auto-service `scripts/renewals.ts` über `listInvoiceSubscriptions()`
- [ ] Upgrade-Knopf in `BillingCard.vue` nur zeigen, wenn `/me/usage` `ordering` meldet (auto-service `bfcdd38`)
- [ ] **Preisseite und Landing verkaufen Chat und Feld-Extraktion, nicht «Ablage».** Ablegen, Scannen und Stichwortsuche gibt es bei ePost seit April 2026 gratis und in der Schweiz. Der Preis rechtfertigt sich nur mit dem, was dort fehlt: Fragen an alle Dokumente mit Quellenangabe, automatisch ausgelesene Beträge, Daten und Fristen. Kein geprüfter Privatanbieter hat beides zusammen ohne eigenen KI-Schlüssel (Recherche 21.09.2026: Docutain, fileee, Papra, Evernote, Paperless-home, Copilot, Acrobat, Google). Für Betriebe zusätzlich: keine Buchhaltung oder ERP nötig, alle Mitarbeitenden im Preis
- [ ] Bleibt es bei Mistral: auf Landing, Features, Preisseite und FAQ «KI aus Europa statt aus den USA» vermarkten (Daten und Server in der Schweiz, OCR und KI bei Mistral in Frankreich, kein Training mit Kundendaten, alle EU-Sprachen)

### 2.2 Rechtliches

- [ ] AGB-Seite nach Vorbild auto-service `src/pages/AgbPage.vue` (`b48d25f`): Testzeit, Jahresabo, QR-Rechnung, Kündigung, Preisänderung, Haftung, dazu Aufbewahrung und Löschung der Dokumente. Preise aus `plans.ts` importieren statt abschreiben; in Footer und Bestelldialog verlinken
- [ ] GeBüV: dms ist keine revisionssichere Aufbewahrung im Sinne der Geschäftsbücherverordnung, sondern eine Such- und Arbeitsablage daneben. In AGB (Leistung) und FAQ ausdrücklich so sagen, und nirgends mit «revisionssicher» oder «Archiv nach GeBüV» werben
- [ ] Auftragsverarbeitungsvertrag für Geschäftskunden als öffentliche Seite `/avv`, gilt mit den AGB
- [ ] Datenschutzerklärung nachziehen: Mail-Versand über Resend, Organisationen und Mitglieder, Abo- und Rechnungsdaten, Aufbewahrung der Server-Logs, Aufsichtsbehörde EDÖB, tatsächlicher Verarbeitungsort von OCR und KI nach dem OCR-Test
- [ ] Cookie-Banner entfernen, es gibt nur technisch notwendige Speicherung (auto-service hat keinen); Datenschutz Abschnitt 6 und `acceptCookies` in den E2E-Fixtures anpassen

### 2.3 Betrieb

- [ ] Eigene Instanz in der Infomaniak Public Cloud (Schweiz, 2 vCPU / 4 GB) im selben OpenStack-Projekt wie auto-service: Frontend und selbst gehosteter Supabase-Stack ohne Studio, Analytics und Log-Pipeline
- [ ] `deploy/` mit Docker Compose, Caddyfile (Assets unveränderlich cachen, `index.html` mit `max-age=0`, `www.`-Umleitung, Zugriffslog 30 Tage) und `deploy.sh` mit Health-Prüfung am Ende (auto-service `455fc2e`, `7959329`)
- [ ] Mail für Anmelde-Codes und Einladungen über Resend: SMTP in `supabase/config.toml` (heute auskommentiert), `site_url` und Redirects auf die Domain. DKIM im Infomaniak-Manager als Typ «DKIM» anlegen, per API bleibt er stumm (auto-service `3dffbcd`)
- [ ] Backup: täglicher `pg_dump` plus **Storage-Dateien**, Kopie ausser Haus in Swift mit TempURL-Schlüssel statt OpenStack-Zugang auf dem Server (auto-service `61dfd99`); Restore einmal üben, inklusive `auth`-Schema und pgvector
- [ ] Health-Check von aussen: Workflow wie auto-service `health.yml` (`56aa530`) für Website, `/auth/v1/health` und ai-proxy
- [ ] Kostenwächter `wartungsheft-cost-watch` um die dms-Instanz erweitern, Grenze neu setzen; Mistral-Ausgabenlimit prüfen

## 3. Nach dem Go-live

- [ ] **Eigene Eingangs-Mailadresse für jedes Konto** (z. B. `<kennung>@eingang.<dms-domain>`): Anhänge von weitergeleiteten oder direkt zugestellten Mails landen als Dokumente in der Pipeline. Nutzen: Rechnungen per Mail, Weiterleiten aus ePost, Scanner mit Mailversand. Offen: Empfang (Resend Inbound, Infomaniak-Mail oder eigener MX), Schutz gegen Spam und fremde Absender, Grenzen für Grösse und Anzahl, Hinweis in Datenschutz und AGB
- [ ] Import aus ePost: ePost exportiert alle Dokumente als verschlüsselte ZIP-Datei, eine API gibt es nicht. Prüfen, was die ZIP enthält und wie sie verschlüsselt ist, dann ZIP-Upload mit Passwort
- [ ] Zentrale Fehlermeldungen nach auto-service `src/lib/errors.ts` (`842d3d7`): 402, 429, Netz und Auth als deutsche Sätze; die Limit-Meldung im Upload prominent zeigen statt wie jeden anderen Fehler
- [ ] Auffindbarkeit: `apps/dms/public/` mit `robots.txt` (KI-Crawler erlaubt), `sitemap.xml`, `llms.txt`, dazu JSON-LD in `index.html` (auto-service `d7cb755`)
- [ ] Messung ohne Analytics-Dienst: Besucher aus dem Caddy-Log, Feld `source` an `documents` (Upload, Kamera, Drag & Drop, Mail) wie auto-service `e158cb5`
- [ ] Hygiene-Tests gegen ungenutzte Abhängigkeiten und Komponenten (auto-service `cd55593`)
- [ ] Doku: `AGENTS.md` als Hauptdatei, `CLAUDE.md` nur noch `@AGENTS.md` (auto-service `4d32220`); die Evaluationstabellen aus `CLAUDE.md` streichen oder archivieren; keine Testzahlen in der Doku («112 Tests» in `CLAUDE.md`), sie veralten mit jedem Test

## 4. Später, wenn ein Anlass kommt

- [ ] Payrexx, erst bei monatlicher Kartenzahlung oder über rund 20 Kunden; die Anbindung entsteht im Repo ai-proxy. Stripe-Code bis dahin stehen lassen
- [ ] Verkauf in die EU: OSS-Registrierung oder Merchant of Record für Privatkunden, Sprachen der App (heute nur Deutsch); offen in business `dms/geschaeftsmodell.md`
- [ ] Server-seitiges BYOK für Geschäftskunden, erst wenn ein Kunde danach fragt: Key pro Organisation verschlüsselt im Store, Eingabe und Test in den Einstellungen, Proxy nutzt Organisations-Key statt Plattform-Key, Verbrauch zählt nicht gegen das Limit; Tests für Auflösung, Fallback und kein Key in Responses
