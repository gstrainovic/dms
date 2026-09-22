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
- **Umgesetzt (06.09.2026):** ai-proxy v0.2.0 auf GitHub, auto-service nutzt es als npm-Paket, DMS als Edge Function `ai-proxy` mit gepinntem Import per Commit-Hash (`https://raw.githubusercontent.com/gstrainovic/ai-proxy/<sha von v0.2.0>/src/edge.ts`, Tags wären verschiebbar) und per-Function `deno.json` als Import-Map. Der Plan-Katalog ist pro App injizierbar (`createEdgeApp(env, { plans })`), Pipeline-Functions rufen den Proxy mit Service-Role + `x-user-id`.
- **Proxy-Update in DMS:** neuen Tag in ai-proxy setzen, dann dessen Commit-Hash in `supabase/functions/ai-proxy/index.ts` (und ggf. `deno.json`) nachziehen, Edge Runtime neu starten.

## Zahlungsanbieter (technisch)

Payrexx statt Stripe, Begründung und Preisvergleich im privaten Repo. Für die Umsetzung im Proxy relevant: TWINT-Abos über Tokenisierung, fehlgeschlagene Abbuchung wird einmal wiederholt (Status overdue → failed), Kundenportal per `POST /AuthToken` (Login-Link), Webhook als JSON mit `X-Webhook-Signature` (HMAC-SHA256, hex, über den Raw-Body), bis zu 10 Zustellversuche, Auth per `X-API-KEY`, Testmodus mit Testkarten. Die Abo-Endpunkte sind als «experimental documentation» markiert. Kein TS-SDK, nur PHP. Der Stripe-Code im Proxy bleibt als zweite Implementierung.

## Hosting (technisch)

Infomaniak Public Cloud (OpenStack) in der Schweiz, Domain und Server im selben Konto, Instanzen per OpenStack-CLI, DNS per Infomaniak-API, Snapshots vor riskanten Änderungen. Kein GitHub Pages für Landing Pages, dessen Bedingungen schliessen Marketing für kommerzielle SaaS aus.

**Eigene VM pro Produkt.** auto-service (InstantDB, AI-Proxy als Node-Container, Caddy) und dms (Supabase-Stack mit AI-Proxy als Edge Function) teilen keinen Prozess; der Proxy läuft je App als eigene Instanz. Getrennt reisst ein voller Supabase-Stack InstantDB nicht mit. dms bekommt seine VM mit dem Produktivbetrieb, noch vor zahlenden Kunden; Supabase dafür ohne Studio, Analytics und Log-Pipeline betreiben, dann reichen 4 GB.

Das OpenStack-Projekt existiert bereits (PCP-CTPZLR8, Region dc3-a, dort läuft die Instanz `wartungsheft` des Produkts Wartungsheft, Repo `~/projects/wartungsheft`, auf GitHub `auto-service`). Zugang vom Laptop: `openstack --os-cloud PCP-CTPZLR8-dc3-a …` mit Application Credential in `~/.config/openstack/clouds.yaml`, DNS-API-Token (nur `dns:write`, Prüfen per `dig`) in `~/.config/infomaniak/token`. Die dms-Instanz kommt als zweiter Server ins selbe Projekt; Vorgehen und Stolpersteine (Security Group, MinIO nur noch auf quay.io, ein Caddy pro Instanz, DKIM bei Infomaniak nur als Typ «DKIM» im Manager) stehen in `~/projects/wartungsheft/README.md` und `CLAUDE.md` unter «Produktion».

## Lizenz

- AGPL-3.0-only für das gesamte Repo, `LICENSE` ist der offizielle Text von gnu.org.
- Alle Abhängigkeiten sind permissiv (MIT, Apache 2.0, ISC, BSD) oder MPL 2.0 (nur lightningcss als Build-Tool). Kein GPL/AGPL im Baum, die Lizenzwahl war also frei.
- CLA in `CLA.md`, Signaturen in `CLA_SIGNATURES.md`, Prüfung per `.github/workflows/cla.yml` mit actions/github-script v9. Das verbreitete contributor-assistant GitHub Action ist archiviert, cla-assistant.io speichert extern bei SAP/Azure, deshalb die eigene Lösung.
- Die Branch Protection für `main` verlangt den Status-Check `cla` (Job-Name aus `cla.yml`, App GitHub Actions). Admins sind ausgenommen, direkte Pushes des Inhabers auf `main` gehen also weiter. Wer den Job umbenennt, muss den Check in der Branch Protection nachziehen, sonst wartet jeder PR auf einen Check, der nie kommt.
- Der CLA-Text ist nicht juristisch geprüft. Vor dem ersten fremden Beitrag anwaltlich prüfen lassen, vor allem die Relizenzierungsklausel.

## Learnings

- **esm.sh-Imports in Edge Functions immer pinnen.** Ungepinntes `unpdf` lieferte still PDF.js 6, wo `PDFDocumentProxy.destroy()` entfernt wurde. Aufräumen läuft dort über `pdf.loadingTask.destroy()`. Dadurch scheiterte monatelang jede lokale PDF-Extraktion und alle PDFs gingen kostenpflichtig an Mistral OCR.
- **Edge Runtime lädt Code und Secrets nicht nach.** Nach Änderungen an `supabase/functions/.env` oder an Function-Code hilft nur `docker restart supabase_edge_runtime_dms` (Code) bzw. `supabase stop && supabase start` (Secrets, weil sie als Container-Env gesetzt werden).
- **Mistral OCR validiert Bilder streng.** Synthetische 1x1-PNGs mit Zufallsbytes zwischen den Chunks werden mit 400 abgelehnt. Tests nutzen echte Fixtures aus `e2e/fixtures/` und fügen für die SHA-256-Einzigartigkeit einen gültigen tEXt-Chunk ein.
- **`supabase gen types` überschreibt handgepflegte Aliase** am Ende von `database.types.ts` (Document, Tag, DocumentField, ChatSession, ...). Nach dem Generieren wieder anhängen.
- **Marketing-Texte** (Features, Landing, Preise) sind für Privatnutzer, Anwender und Entscheider geschrieben. Keine Technik-Begriffe (tsvector, pgvector, RAG, SHA-256). Der E2E-Test `marketing.spec.ts` prüft das.
