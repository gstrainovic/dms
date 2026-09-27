# DMS — Document Management System

Upload (PNG/JPG/PDF) → OCR → Auto-Tagging und Felder → Volltext- und Hybrid-Suche → Chat/RAG über alle Dokumente, in einem Dashboard. Anlassbezogenes Wissen steht in `.claude/skills/`; der Vergleich mit bestehenden Lösungen in `docs/evaluation.md`.

## Stack und Architektur
- pnpm-Monorepo: `apps/dms/` (Vue 3, PrimeVue 4, Pinia, Vue Router), `packages/shared/` (OCR-Pipeline, Retry, Image-Utils, Queries)
- Supabase: PostgreSQL + pgvector + Storage, Edge Functions (Deno/TS) in `supabase/functions/`, Migrations in `supabase/migrations/`
- Mistral: `mistral-ocr-latest` (OCR), `mistral-small-latest` (Tagging, Chat), `mistral-embed` (1024-dim)
- Lokal: Supabase CLI auf rootless Podman (`DOCKER_HOST=unix:///run/user/1000/podman/podman.sock`)

## Upload-Pipeline und Edge Functions
`upload-document` → `process-ocr` → `extract-data` → `generate-embed` → `ready`; jede Function setzt im Fehlerfall `status: 'error'` + `error_message`.
- `upload-document`: FormData, SHA-256-Dedup, Storage, DB
- `process-ocr`: PDF-Text lokal per unpdf, sonst Mistral OCR
- `extract-data`: Dokumenttyp, Schema-Felder, Tags
- `generate-embed`: Chunks 1000/200 → pgvector
- `search`, `chat` (RAG mit Quellen), `invite-member` (Team-Einladung)
- `ai-proxy`: Hono-App aus `gstrainovic/ai-proxy`, hält den Mistral-Key, zählt Verbrauch pro Organisation, Testzeit, Plan-Limits (402), Fair-Use-Bremse (429), Abo-Routen

**Keine Function ruft Mistral direkt, alles läuft über `ai-proxy`.** `_shared/ai-proxy.ts`: `aiFetchAsUser` (Nutzer-JWT, chat/search) und `aiFetchAsService` (Service-Role + `x-user-id` = `org_id` des Dokuments, wartet und wiederholt nach 429). Ein 402 landet in `documents.error_message` bzw. beim Frontend (`lib/edge-errors.ts`). Der Mistral-Key ist nie im Browser.

## DB-Schema
- `documents` (Metadaten, OCR-Text, tsvector deutsch, Status), `tags` + `document_tags` und `document_fields` (source `ai`|`manual`), `document_embeddings`
- `document_schemas`: `org_id` null = mitgeliefert (Rechnung, Vertrag, Arztbrief), sonst eigene der Organisation
- `organizations`, `organization_members`, `organization_invitations`, `restricted_document_types`, `audit_log`: die Organisation besitzt alle Daten, RLS prüft die Mitgliedschaft (Skill `organisationen`)
- `ai_usage`, `ai_subscriptions`: schreibt nur der Proxy

## Hybrid-Suche
`hybrid_search`: `text_rank * 0.4 + vector_rank * 0.6` (tsvector deutsch + pgvector `<=>`), Filter Dokumenttyp und Tags, respektiert die Rechte pro Dokumenttyp.

## Befehle
- `pnpm dev`: Podman-Socket, SELinux-Kontext, Secrets kopieren, Supabase, Vite (Port 3000); `pnpm dev:frontend` nur Vite
- `pnpm test` (Setup + DB-Reset + Deno-, Script- und Vitest-Tests), `pnpm test:only` (ohne Setup), `pnpm test:e2e` (Playwright), `pnpm test:all`
- `pnpm build`, `supabase db reset`, `supabase gen types typescript --local`
- Ohne Docker/Podman: `scripts/dev-vm.sh` (Skill `dev-vm`)

## Secrets
`.env` im Projektroot (Vorlage `.env.example`): `MISTRAL_API_KEY`, lokal `AI_PROXY_BURST_LIMIT=1000` (alle Tests teilen ein Proxy-Konto), optional Stripe-Variablen. `dev.sh`/`test.sh` kopieren sie nach `supabase/functions/.env` (gitignored), dort liest die Edge Runtime.

## Infra
Lokal Fedora mit rootless Podman, Supabase-Container brauchen nach dem Start rund 60 s. Server: Infomaniak Public Cloud, Dev-Instanz `dms-dev` (Skills `infomaniak-hosting`, `dev-vm`).

## Bekannte Einschränkungen und Learnings
- Edge Runtime lädt nichts nach: Code → `docker restart supabase_edge_runtime_dms`; `config.toml` oder `supabase/functions/.env` → `supabase stop && supabase start`. Direkt nach dem Neustart scheitert DNS (`api.mistral.ai`) kurz, Tests wiederholen.
- esm.sh-Imports in Edge Functions immer pinnen (ungepinntes `unpdf` brachte PDF.js 6 ohne `destroy()`, alle PDFs gingen still an Mistral OCR).
- Kein `deno.lock` in `supabase/functions/`: `deno check`/`deno test` nur mit `--no-lock`, sonst 503 «Unsupported lockfile version».
- Nie `tsc` in `apps/dms/src/` laufen lassen: Vite nimmt die erzeugten `.js` statt der `.ts`.
- `supabase status` meldet 0 auch bei kaputten Containern, darum prüfen die Skripte per `docker ps`.
- SELinux: Edge Functions brauchen `container_file_t` (setzen die Skripte).
- `document_schemas` JSONB löst TS2589 aus, `stores/schemas.ts` nutzt einen eigenen `Schema`-Typ.
- `supabase gen types` überschreibt die Aliase am Ende von `database.types.ts` (Document, Tag, …), danach wieder anhängen.
- Mistral OCR lehnt synthetische PNGs ab; Tests nutzen `e2e/fixtures/` mit eingefügtem tEXt-Chunk für eindeutige SHA-256.
- `edge-functions.test.ts`: nach `verifyOtp` trägt der Client die Nutzer-Session, für RLS-Schreibzugriffe separaten Service-Role-Client nehmen.
- Marketing-Texte ohne Technik-Begriffe (tsvector, RAG, SHA-256 …), prüft `e2e/marketing.spec.ts`.

## AI-Proxy
Derselbe Proxy-Code wie auto-service, aber je App eine eigene Instanz, hier als Edge Function mit Supabase-Store und gepinntem Commit-Hash. Kein Monorepo mit auto-service (andere DB, Paketmanager, Deployments, Lizenzen). Hilfsfunktionen (`withRetry`, `hashImage` …) bleiben bewusst pro App, ein geteiltes Utils-Paket lohnt sich erst mit einem zweiten Modul in Proxy-Grösse. Update: Skill `ai-proxy-update`.

## Geschäftsmodell und Abo
Open Source, verkauft wird das Hosting; Details im privaten Repo `~/projects/business` (`dms/geschaeftsmodell.md`). Plan-Katalog im Code (`supabase/functions/_shared/plans.ts`): Starter und Pro; Ziel sind die Jahresabos Privat und Betrieb nach 30 Tagen Testzeit (todo.md). Zahlung zuerst per QR-Rechnung für Schweizer Kunden; ob später Payrexx oder Stripe für Karten dazukommt, ist offen. Details: Skill `billing`.

## Lizenz
AGPL-3.0-only, Beiträge nur mit CLA (Skill `lizenz-cla`). Der Check-Name `cla` ist in der Branch Protection eingetragen, Job nicht umbenennen.
