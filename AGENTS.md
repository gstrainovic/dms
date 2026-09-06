# AGENTS.md — Entscheidungen und Wissen zum DMS-Projekt

Technische Architektur, Pipeline und Befehle stehen in `CLAUDE.md`. Hier stehen Geschäftsmodell, Lizenz und Learnings, die sich nicht aus dem Code ableiten lassen.

## Geschäftsmodell (Entscheidung vom 06.09.2026)

Das DMS ist Open Source (AGPL-3.0). Verkauft wird das Hosting, nicht die Software.

**Privatkunden**
Gehostet, Mistral-Key inklusive, monatliches Limit (OCR-Seiten, Chat-Anfragen). Der Kunde zahlt für KI-Kosten, die er sonst nicht hätte, plus Komfort.

**Geschäftskunden**
Gehostet, Wartung und Backups inklusive, mehrere Nutzer, Auftragsverarbeitungsvertrag (DSGVO). Der Mistral-Key ist inklusiv und über den höheren Preis gedeckt. Bring-your-own-Key ist eine **Option** für Firmen, die aus Compliance-Gründen ihren eigenen Mistral-Vertrag wollen. BYOK ist ein Feature, kein Rabatt.

**Open-Source-Version**
Die Community-Version kann alles, der Betreiber kümmert sich selbst um Betrieb, Backups, Updates. Kein Feature-Gating. Falls später eine Grenze nötig wird, dann bei Dingen, die nur im Firmenkontext zählen: SSO, Audit-Log, Mandanten, Support-SLA.

**Preislogik in einem Satz**
Der Privatkunde zahlt für die KI-Kosten, der Geschäftskunde dafür, dass er sich um nichts kümmern muss. Der Key ist bei beiden ein Detail.

**Risiko und Gegenmassnahme**
Nicht der Selbsthoster ist das Risiko, sondern ein Anbieter, der das Projekt günstiger hostet. AGPL macht das unattraktiv, weil er seine Änderungen offenlegen muss. Das CLA sichert das Recht, Geschäftskunden eine kommerzielle Lizenz zu geben.

**Umsetzungsreihenfolge**
Siehe `todo.md`. Kern: Der AI-Proxy aus auto-service wird geteilt, DMS baut Zählung, Limits und Stripe nicht neu.

## AI-Proxy (Entscheidung vom 06.09.2026)

`~/projects/auto-service/server/` enthält bereits einen Hono-Proxy mit Mistral-Durchleitung, Zählung pro Nutzer und Monat, Plan-Limits (402 bei Überschreitung), Stripe-Checkout, Portal und Webhook. Store und Token-Prüfung sind per Dependency Injection austauschbar (Memory für Tests, InstantDB für auto-service).

- Der Proxy wird in ein eigenes Repo `~/projects/ai-proxy` herausgelöst. Beide Apps nutzen denselben Code, aber **je eine eigene Instanz** (getrennte Nutzerbasen).
- auto-service: Node-Container neben InstantDB, wie heute.
- DMS: Hono läuft offiziell in Supabase Edge Functions (hono.dev/docs/getting-started/supabase-functions). Der Proxy wird als Edge Function mit Supabase-Store und Supabase-JWT-Prüfung ausgeliefert, kein zusätzlicher Container.
- **Kein Monorepo für beide Apps:** verschiedene Datenbanken (InstantDB vs. Supabase), Paketmanager (npm vs. pnpm), Deployments und Lizenzen. Geteilt wird nur der Proxy.
- **Browser-BYOK (Key im Client direkt zu Mistral) wird entfernt.** BYOK für Geschäftskunden läuft server-seitig über den Proxy mit Key pro Organisation.
- auto-service für sich braucht **keine** Supabase Edge Functions: Das hiesse den ganzen Supabase-Stack (~10 Container) neben InstantDB zu betreiben, nur für eine Funktion.
- **Umgesetzt (06.09.2026):** ai-proxy v0.2.0 auf GitHub, auto-service nutzt es als npm-Paket, DMS als Edge Function `ai-proxy` mit gepinntem Import per Commit-Hash (`https://raw.githubusercontent.com/gstrainovic/ai-proxy/<sha von v0.2.0>/src/edge.ts`, Tags wären verschiebbar) und per-Function `deno.json` als Import-Map. Der Plan-Katalog ist pro App injizierbar (`createEdgeApp(env, { plans })`), Pipeline-Functions rufen den Proxy mit Service-Role + `x-user-id`.
- **Proxy-Update in DMS:** neuen Tag in ai-proxy setzen, dann dessen Commit-Hash in `supabase/functions/ai-proxy/index.ts` (und ggf. `deno.json`) nachziehen, Edge Runtime neu starten.

## Lizenz

- AGPL-3.0-only für das gesamte Repo, `LICENSE` ist der offizielle Text von gnu.org.
- Alle Abhängigkeiten sind permissiv (MIT, Apache 2.0, ISC, BSD) oder MPL 2.0 (nur lightningcss als Build-Tool). Kein GPL/AGPL im Baum, die Lizenzwahl war also frei.
- CLA in `CLA.md`, Signaturen in `CLA_SIGNATURES.md`, Prüfung per `.github/workflows/cla.yml` mit actions/github-script v9. Das verbreitete contributor-assistant GitHub Action ist archiviert, cla-assistant.io speichert extern bei SAP/Azure, deshalb die eigene Lösung.
- Auf GitHub muss der Status-Check «CLA Check» in der Branch Protection für `main` als erforderlich markiert werden, sonst blockt er nicht.
- Der CLA-Text ist nicht juristisch geprüft. Vor dem ersten fremden Beitrag anwaltlich prüfen lassen, vor allem die Relizenzierungsklausel.

## Learnings

- **esm.sh-Imports in Edge Functions immer pinnen.** Ungepinntes `unpdf` lieferte still PDF.js 6, wo `PDFDocumentProxy.destroy()` entfernt wurde. Aufräumen läuft dort über `pdf.loadingTask.destroy()`. Dadurch scheiterte monatelang jede lokale PDF-Extraktion und alle PDFs gingen kostenpflichtig an Mistral OCR.
- **Edge Runtime lädt Code und Secrets nicht nach.** Nach Änderungen an `supabase/functions/.env` oder an Function-Code hilft nur `docker restart supabase_edge_runtime_dms` (Code) bzw. `supabase stop && supabase start` (Secrets, weil sie als Container-Env gesetzt werden).
- **Mistral OCR validiert Bilder streng.** Synthetische 1x1-PNGs mit Zufallsbytes zwischen den Chunks werden mit 400 abgelehnt. Tests nutzen echte Fixtures aus `e2e/fixtures/` und fügen für die SHA-256-Einzigartigkeit einen gültigen tEXt-Chunk ein.
- **`supabase gen types` überschreibt handgepflegte Aliase** am Ende von `database.types.ts` (Document, Tag, DocumentField, ChatSession, ...). Nach dem Generieren wieder anhängen.
- **Marketing-Texte** (Features, Landing, Preise) sind für Privatnutzer, Anwender und Entscheider geschrieben. Keine Technik-Begriffe (tsvector, pgvector, RAG, SHA-256). Der E2E-Test `marketing.spec.ts` prüft das.
