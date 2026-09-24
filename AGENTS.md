# AGENTS.md — Entscheidungen und Wissen zum DMS-Projekt

Technische Architektur, Pipeline und Befehle stehen in `CLAUDE.md`. Hier stehen technische Entscheidungen, Lizenz und Learnings, die sich nicht aus dem Code ableiten lassen.

Geschäftsmodell, Preise, Zahlungsanbieter-Vergleich und Validierung liegen nicht in diesem öffentlichen Repo, sondern im privaten Repo `~/projects/business` (`dms/geschaeftsmodell.md`). Kurzfassung für den Code: Open Source unter AGPL, verkauft wird das Hosting. Kein Gratisplan, sondern 30 Tage Testzeit (Testzeit-Logik im AI-Proxy), danach zwei Jahresabos mit denselben Funktionen: **Privat** 79 CHF im Jahr für ein Konto, **Betrieb** 600 CHF im Jahr pro Firma für alle Mitarbeitenden. Abrechnung per Jahresrechnung mit QR-Zahlteil, ohne Zahlungsanbieter. Die Monatslimits im Plan-Katalog sind nur Missbrauchsgrenzen. Die Betriebsstufe setzt Mehrbenutzer pro Firma voraus und braucht beim Kunden keine Buchhaltung oder ERP. Preise stehen im Code in `supabase/functions/_shared/plans.ts`, die Preisseite und die AGB lesen sie von dort. Begründung und Wettbewerb in `~/projects/business/dms/geschaeftsmodell.md`. Bring-your-own-Key für Geschäftskunden läuft serverseitig über den Proxy.

## AI-Proxy (Entscheidung vom 06.09.2026)

`~/projects/auto-service/server/` enthält bereits einen Hono-Proxy mit Mistral-Durchleitung, Zählung pro Nutzer und Monat, Plan-Limits (402 bei Überschreitung), Stripe-Checkout, Portal und Webhook. Store und Token-Prüfung sind per Dependency Injection austauschbar (Memory für Tests, InstantDB für auto-service).

- Der Proxy wird in ein eigenes Repo `~/projects/ai-proxy` herausgelöst. Beide Apps nutzen denselben Code, aber **je eine eigene Instanz** (getrennte Nutzerbasen).
- auto-service: Node-Container neben InstantDB, wie heute.
- DMS: Hono läuft offiziell in Supabase Edge Functions (hono.dev/docs/getting-started/supabase-functions). Der Proxy wird als Edge Function mit Supabase-Store und Supabase-JWT-Prüfung ausgeliefert, kein zusätzlicher Container.
- **Kein Monorepo für beide Apps:** verschiedene Datenbanken (InstantDB vs. Supabase), Paketmanager (npm vs. pnpm), Deployments und Lizenzen. Geteilt wird nur der Proxy. Der Turborepo-Versuch in `~/projects/monorepo` (Februar 2026) ist verworfen.
- **Hilfsfunktionen bleiben bewusst pro App:** `withRetry`, `resizeImage`, `hashImage`, `getModel`, `callMistralOcr` existieren in `packages/shared/` und in auto-service (`src/services/ai.ts`) getrennt und haben sich auseinanderentwickelt. Der Proxy muss identisch sein, weil er Verbrauch zählt und Limits durchsetzt; ein gemeinsames Utils-Paket würde beide Apps für rund 280 Zeilen koppeln. Es lohnt sich erst, wenn ein zweites geteiltes Modul in Proxy-Grösse dazukommt oder ein Bug an beiden Orten gefixt werden muss.
- **Browser-BYOK (Key im Client direkt zu Mistral) wird entfernt.** BYOK für Geschäftskunden läuft server-seitig über den Proxy mit Key pro Organisation.
- auto-service für sich braucht **keine** Supabase Edge Functions: Das hiesse den ganzen Supabase-Stack (~10 Container) neben InstantDB zu betreiben, nur für eine Funktion.
- **Umgesetzt (06.09.2026):** ai-proxy v0.2.0 auf GitHub, auto-service nutzt es als npm-Paket, DMS als Edge Function `ai-proxy` mit gepinntem Import per Commit-Hash (`https://raw.githubusercontent.com/gstrainovic/ai-proxy/<sha des Tags>/src/edge.ts`, derzeit v0.3.0, Tags wären verschiebbar) und per-Function `deno.json` als Import-Map. Der Plan-Katalog ist pro App injizierbar (`createEdgeApp(env, { plans })`), Pipeline-Functions rufen den Proxy mit Service-Role + `x-user-id`.
- **Proxy-Update in DMS:** neuen Tag in ai-proxy setzen, dann dessen Commit-Hash in `supabase/functions/ai-proxy/index.ts` (und ggf. `deno.json`) nachziehen, Edge Runtime neu starten.

## Mehrbenutzer (Organisationen)

Migration `00009_organizations.sql`, Tests in `organizations.test.ts` und `e2e/team.spec.ts`.

- **Die Organisation besitzt alles:** Dokumente, Tags, Felder, eigene Schemas und Chats hängen an `org_id`, RLS prüft die Mitgliedschaft (`is_org_member`, `is_org_admin`, `can_see_document`). `user_id` bleibt als Urheber; der Trigger `set_org_from_user` setzt beim Anlegen Urheber und Organisation.
- **Eine Person gehört genau einer Organisation an.** Ein Privatkonto ist eine Organisation mit einer Person; jede neue Person bekommt es per Trigger `handle_new_user`, ausser eine Einladung wartet. Mehrere Organisationen pro Person hätten eine Auswahl der aktiven Organisation im UI und im Proxy verlangt.
- **Einladen:** Edge Function `invite-member` ruft als Admin die RPC `invite_member`; ohne Konto verschickt Supabase Auth die Einladungsmail und der Trigger macht die Person zum Mitglied. Ein bestehendes Konto wechselt nur, wenn es leer ist, sonst bleibt die Einladung offen. Wer entfernt wird, bekommt ein neues leeres Privatkonto. Der letzte Admin lässt sich weder entfernen noch herabstufen.
- **Rechte pro Dokumenttyp:** `restricted_document_types` sperrt Typen für Mitglieder (Einstellungen, Spalte «Nur Admins»). Wer ein Dokument hochgeladen hat, sieht es auch nach der Einstufung. `hybrid_search` filtert mit denselben Regeln, damit fliessen gesperrte Dokumente weder in Suchtreffer noch in Chat-Quellen.
- **Storage:** Dateien liegen unter `<org_id>/<sha256>/<Dateiname>`. Lesen erlaubt die Policy nur mit sichtbarem Dokument, Hochladen nur in den eigenen Organisationsordner.
- **Protokoll:** `audit_log` per Trigger für Dokumente, Tags, Felder und entfernte Mitglieder, lesbar nur für Admins. `user_id` null heisst automatische Verarbeitung (Pipeline).
- **ai-proxy pro Organisation:** Konto im Proxy ist `organizations.id` (`accountOf` in `supabase/functions/ai-proxy/index.ts`), `ai_usage.user_id` und `ai_subscriptions.user_id` zeigen auf `organizations`. Pipeline-Functions geben `doc.org_id` direkt in `x-user-id` an.
- **Schemas:** `org_id` null heisst mitgeliefert, für alle lesbar und nicht änderbar; eigene Schemas legen nur Admins an.

## OCR-Vergleich

`scripts/ocr-benchmark/` vergleicht Mistral OCR mit Vision-Modellen, die Infomaniak und kvant/Phoeniqs in der Schweiz anbieten. Aufruf `pnpm ocr-benchmark`, Zahlen in `results.md`. Die offenen Modelle laufen für die Qualitätsmessung über OpenRouter (gleiche Gewichte), die Kosten rechnet `prices.ts` mit den Schweizer Preislisten.

- **Testsatz:** 13 künstliche Seiten aus `e2e/fixtures` und wartungsheft `testdateien/` (Referenztext aus HTML bzw. PDF-Textebene), je sauber und künstlich verzerrt, dazu echte Handyfotos aus wartungsheft `tmp/test-images`. Die echten Fotos stehen nur in `testset.local.json` und `.cache/` (beide gitignored), weil sie Personendaten enthalten; in `results.md` erscheinen sie ohne Inhalte.
- **`mistral-ocr-latest` ist OCR 4.1** zu 4 USD pro 1000 Seiten. OCR 3 (`mistral-ocr-2512`) kostet die Hälfte und war im Test gleich gut oder besser (echte Fotos 99 % der Felder, OCR 4.1 97 %).
- **Mistral OCR verliert bei Formularen mit mehreren Spalten die rechte Wertespalte** (Fahrzeugausweis: Gewichte fehlen). Vision-Modelle lesen sie.
- **Gedrehte, unscharfe Fotos** sind die Schwachstelle der kleinen Modelle (Mistral Small 4, Ministral 3, Llama 4). Mistral OCR, Qwen3-VL und Gemma 4 bleiben stabil.
- **Infomaniak AI Services** (Produkt 111648, Token `INFOMANIAK_AI_TOKEN` in `.env`, Scope `ai-tools`): alle Sprachmodelle dort nehmen Bilder an, obwohl die FAQ anderes sagt. Qwen3.5 und Kimi K2.6 brauchen abgeschaltetes Denken (`chat_template_kwargs`), sonst geht das ganze Antwortlimit ans Denken und der Text bleibt leer. Apertus erfindet Werte und taugt nicht für OCR.
- **Schwere Tabellen (30 ParseBench-Seiten):** Sauber gescannt liegen Kimi K2.6 (97.5 % der Zellen) und Qwen3.5 (95–96 %) vor Mistral OCR 4.1 (94 %), sind aber 4- bis 10-mal langsamer und 3- bis 4-mal teurer. Verzerrt gewinnt Mistral OCR 4.1 deutlich (91 % gegen höchstens 82 %). OCR 3 fällt bei Tabellen ab (90 %). Vision-Modelle brauchen für dichte Tabellen mehr als 4096 Ausgabe-Tokens und bis zu 5 Minuten pro Seite.
- **Schweizer Dokumente** (`ch-docs.ts`, erfundene QR-Rechnungen, Lohnausweis, Steuerrechnung usw.): alle Modelle finden fast alle Felder, Mistral OCR hat die wenigsten Zeichenfehler.
- **Unabhängige Rangliste ParseBench** (github `run-llama/ParseBench`, rund 2000 echte Geschäftsseiten) bestätigt das Bild: Mistral OCR 4 liegt gesamt bei 60.7, Gemma 4 31B bei 62.4, MinerU 2.5 Pro (bei kvant) bei 72.8.

## Zahlungsanbieter (technisch)

Payrexx statt Stripe, Begründung und Preisvergleich im privaten Repo. Für die Umsetzung im Proxy relevant: TWINT-Abos über Tokenisierung, fehlgeschlagene Abbuchung wird einmal wiederholt (Status overdue → failed), Kundenportal per `POST /AuthToken` (Login-Link), Webhook als JSON mit `X-Webhook-Signature` (HMAC-SHA256, hex, über den Raw-Body), bis zu 10 Zustellversuche, Auth per `X-API-KEY`, Testmodus mit Testkarten. Die Abo-Endpunkte sind als «experimental documentation» markiert. Kein TS-SDK, nur PHP. Der Stripe-Code im Proxy bleibt als zweite Implementierung.

## Hosting (technisch)

Infomaniak Public Cloud (OpenStack) in der Schweiz, Domain und Server im selben Konto, Instanzen per OpenStack-CLI, DNS per Infomaniak-API, Snapshots vor riskanten Änderungen. Kein GitHub Pages für Landing Pages, dessen Bedingungen schliessen Marketing für kommerzielle SaaS aus.

**Eigene VM pro Produkt.** auto-service (InstantDB, AI-Proxy als Node-Container, Caddy) und dms (Supabase-Stack mit AI-Proxy als Edge Function) teilen keinen Prozess; der Proxy läuft je App als eigene Instanz. Getrennt reisst ein voller Supabase-Stack InstantDB nicht mit. dms bekommt seine VM mit dem Produktivbetrieb, noch vor zahlenden Kunden; Supabase dafür ohne Studio, Analytics und Log-Pipeline betreiben, dann reichen 4 GB.

Das OpenStack-Projekt existiert bereits (PCP-CTPZLR8, Region dc3-a, dort läuft die Instanz `wartungsheft` des Produkts Wartungsheft, Repo `~/projects/wartungsheft`, auf GitHub `auto-service`). Zugang vom Laptop: `openstack --os-cloud PCP-CTPZLR8-dc3-a …` mit Application Credential in `~/.config/openstack/clouds.yaml`, DNS-API-Token (nur `dns:write`, Prüfen per `dig`) in `~/.config/infomaniak/token`. Die dms-Instanz kommt als zweiter Server ins selbe Projekt; Vorgehen und Stolpersteine (Security Group, MinIO nur noch auf quay.io, ein Caddy pro Instanz, DKIM bei Infomaniak nur als Typ «DKIM» im Manager) stehen in `~/projects/wartungsheft/README.md` und `CLAUDE.md` unter «Produktion».

## Entwickeln ohne Docker: Dev-Supabase auf Infomaniak per SSH-Tunnel

Alles im Repo spricht Supabase nur über `127.0.0.1:54321` an (`apps/dms/.env`, Tests, E2E-Fixtures). Darum reicht auf einem PC
ohne Docker oder Podman ein SSH-Tunnel zu einer Dev-Instanz; am Code ändert sich nichts. Gleiches Muster wie `wartungsheft-dev`
(`~/projects/wartungsheft/AGENTS.md`).

- **Instanz** `dms-dev` im OpenStack-Projekt PCP-CTPZLR8 (dc3-a, Flavor `a2-ram4-disk50-perf1`, Debian 13, Docker CE,
  Supabase CLI als Debian-Paket), Zugriff `ssh debian@195.15.243.89` mit dem Key `claude-laptop` (derselbe wie für
  wartungsheft). Security Group `default`: nur 22, 80 und 443 offen; Kong bindet 54321 zwar auf 0.0.0.0, von aussen kommt
  aber nur SSH durch.
- **Stack**: Checkout des Repos in `/opt/dms`, dort `supabase start` mit `.env` und `supabase/functions/.env` (Kopie der
  lokalen `.env`, Mistral-Key und `AI_PROXY_BURST_LIMIT=1000`). Die Container haben `restart: unless-stopped`, nach einem
  Reboot kommt der Stack ohne Unit zurück. Analytics ist in `config.toml` aus (rund 1 GB weniger, der Stack braucht so
  etwa 1 GB), gilt auch lokal.
- **Daten**: leere Datenbank mit Migrationen und Seed, wie nach `supabase db reset`. Die Tests leeren Tabellen selbst,
  Daten dort sind Wegwerfdaten. Auth-Mails landen in Mailpit (Port 54324 im Tunnel).
- **Bedienung vom Laptop oder anderen PC:** `scripts/dev-vm.sh` (`tunnel`, `tunnel-stop`, `sync`, `reset`, `status`,
  `logs`, `restart`, `ssh`; Host per `DMS_DEV_VM` überschreibbar). Auf dem Laptop den Tunnel vor `pnpm dev` wieder
  schliessen, sonst kollidiert das lokale Supabase mit Port 54321. Die Edge Functions laufen **auf der Instanz** aus deren Checkout: Änderungen
  an `supabase/` erst pushen, dann `dev-vm.sh sync` (git pull + Edge Runtime neu starten). `reset` macht zusätzlich
  `supabase db reset`. Änderungen an `config.toml` oder `.env` brauchen `restart` (`supabase stop && start`).
- **Ablauf auf dem anderen PC** (braucht Node, pnpm, Git, Playwright-Browser, Deno für `test:functions`, den SSH-Key und
  `.env` aus dem Gmail-Entwurf «DMS: Dev-Zugang für den zweiten PC»):

  ```bash
  scripts/dev-vm.sh tunnel   # 54321, 54323 (Studio), 54324 (Mailpit) → dms-dev
  pnpm dev:frontend          # Vite auf Port 3000, redet über den Tunnel
  scripts/dev-vm.sh reset && pnpm test:only         # Unit/Integration
  scripts/dev-vm.sh reset && pnpm exec playwright test   # E2E, reuseExistingServer nimmt den laufenden Vite
  ```

  `pnpm dev`, `pnpm test`, `pnpm test:e2e` (die Skripte mit Podman-Start) sind nur für den Laptop.
- **Kosten**: läuft sie, kostet sie rund 13 CHF im Monat mit IPv4. Wird sie länger nicht gebraucht:
  `openstack --os-cloud PCP-CTPZLR8-dc3-a server shelve dms-dev`, zurück mit `server unshelve`. Der Kostenwächter
  `~/.local/bin/wartungsheft-cost-watch` zählt alle Instanzen des Projekts, Limit 60 CHF.
- **Neu aufsetzen**: cloud-init installiert Docker CE, Supabase CLI und klont das Repo nach `/opt/dms`; danach `.env`
  per scp nach `/opt/dms/.env` und `/opt/dms/supabase/functions/.env`, dann `supabase start` in `/opt/dms`.

## Lizenz

- AGPL-3.0-only für das gesamte Repo, `LICENSE` ist der offizielle Text von gnu.org.
- Alle Abhängigkeiten sind permissiv (MIT, Apache 2.0, ISC, BSD) oder MPL 2.0 (nur lightningcss als Build-Tool). Kein GPL/AGPL im Baum, die Lizenzwahl war also frei.
- CLA in `CLA.md`, Signaturen in `CLA_SIGNATURES.md`, Prüfung per `.github/workflows/cla.yml` mit actions/github-script v9. Das verbreitete contributor-assistant GitHub Action ist archiviert, cla-assistant.io speichert extern bei SAP/Azure, deshalb die eigene Lösung.
- Die Branch Protection für `main` verlangt den Status-Check `cla` (Job-Name aus `cla.yml`, App GitHub Actions). Admins sind ausgenommen, direkte Pushes des Inhabers auf `main` gehen also weiter. Wer den Job umbenennt, muss den Check in der Branch Protection nachziehen, sonst wartet jeder PR auf einen Check, der nie kommt.
- Der CLA-Text ist nicht juristisch geprüft. Vor dem ersten fremden Beitrag anwaltlich prüfen lassen, vor allem die Relizenzierungsklausel.

## Learnings

- **esm.sh-Imports in Edge Functions immer pinnen.** Ungepinntes `unpdf` lieferte still PDF.js 6, wo `PDFDocumentProxy.destroy()` entfernt wurde. Aufräumen läuft dort über `pdf.loadingTask.destroy()`. Dadurch scheiterte monatelang jede lokale PDF-Extraktion und alle PDFs gingen kostenpflichtig an Mistral OCR.
- **Edge Runtime lädt Code und Secrets nicht nach.** Nach Änderungen an `supabase/functions/.env` oder an Function-Code hilft nur `docker restart supabase_edge_runtime_dms` (Code) bzw. `supabase stop && supabase start` (Secrets, weil sie als Container-Env gesetzt werden).
- **Kein `deno.lock` in `supabase/functions/`.** Ein lokales `deno check` oder `deno test` ohne `--no-lock` schreibt Lockfile-Version 5, die Edge Runtime kann sie nicht lesen und die Function antwortet 503 («Unsupported lockfile version»).
- **Fair-Use-Bremse lokal hochsetzen:** Alle Tests teilen ein Konto im Proxy; mit der Vorgabe von 20 Aufrufen pro Minute brechen sie mit 429 ab. Darum `AI_PROXY_BURST_LIMIT=1000` in der lokalen `.env`. Die Pipeline wartet bei 429 und versucht es erneut (`withRateLimitRetry`), Chat und Suche geben 429 an die Person weiter.
- **Mistral OCR validiert Bilder streng.** Synthetische 1x1-PNGs mit Zufallsbytes zwischen den Chunks werden mit 400 abgelehnt. Tests nutzen echte Fixtures aus `e2e/fixtures/` und fügen für die SHA-256-Einzigartigkeit einen gültigen tEXt-Chunk ein.
- **`supabase gen types` überschreibt handgepflegte Aliase** am Ende von `database.types.ts` (Document, Tag, DocumentField, ChatSession, ...). Nach dem Generieren wieder anhängen.
- **Marketing-Texte** (Features, Landing, Preise) sind für Privatnutzer, Anwender und Entscheider geschrieben. Keine Technik-Begriffe (tsvector, pgvector, RAG, SHA-256). Der E2E-Test `marketing.spec.ts` prüft das.
