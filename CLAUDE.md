# DMS Projekt — Document Management System

## Ziel
Upload → OCR → Auto-Tagging → Suche → Chat/RAG → ein Dashboard

## Anforderungen (alle Pflicht)
1. PNG/JPG/PDF Upload mit Dokumenten-Archiv
2. OCR via Mistral API (Laptop zu schwach fuer lokale OCR)
3. Auto-Tagging basierend auf Inhalt
4. Volltextsuche + Chat/RAG ueber alle Dokumente
5. Einzelnes Dashboard / Enduser-UI

## Hardware-Constraint
- Laptop hat wenig RAM und nur 4 GB VRAM
- Lokale OCR (MinerU: 16-32 GB RAM, Docling: 3-4 GB Spitzen) ist NICHT moeglich
- → **Mistral OCR (API)** ist die einzige Option

## APIs
- **Mistral OCR:** `mistral-ocr-latest` (~$0.001/Seite, Cloud-API, keine lokale Last)
- **Mistral Chat:** `mistral-small-latest` (fuer Tagging + Chat)
- **Mistral Embedding:** `mistral-embed`
- Key: in `.env` oder `MISTRAL_API_KEY`

---

## Evaluation bestehender Lösungen
30+ Open-Source-DMS/RAG-Tools geprüft, keines erfüllt alle 5 Anforderungen → Eigenbau.
Tabellen und Begründungen: `docs/evaluation.md`.

---

## Custom Stack (Implementierung) — FERTIG

### Tech Stack
- **Monorepo:** pnpm workspaces (`apps/dms/`, `packages/shared/`)
- **Frontend:** Vue 3 + PrimeVue 4 + Pinia + Vue Router
- **Backend:** Supabase Edge Functions (Deno/TS)
- **Datenbank:** Supabase (PostgreSQL + pgvector + Storage)
- **OCR:** Mistral OCR API (server-seitig via Edge Functions)
- **AI:** Mistral Small (Tagging/Chat), Mistral Embed (Vektoren)
- **Container:** Rootless Podman (DOCKER_HOST Socket)

### Architektur
```
apps/dms/                   — Vue 3 + PrimeVue Frontend
  src/views/                — 7 Views (Dashboard, Documents, Detail, Upload, Search, Chat, Settings)
  src/components/           — AppLayout, TagEditor, FieldsEditor
  src/composables/          — useUpload, useSearch, useChat
  src/stores/               — documents, tags, schemas (Pinia)
  src/lib/                  — supabase Client, database.types (auto-generated)
packages/shared/            — AI-Pipeline, OCR, Retry, Image Utils, Queries
supabase/
  migrations/               — SQL-Migrations (Schema, Storage, RLS, ai-proxy, Organisationen)
  functions/                — Edge Functions (+ _shared/ für Plan-Katalog und Proxy-Client)
```

### Edge Functions
1. `upload-document` — FormData Upload, SHA-256 Dedup, Storage, DB, triggers OCR
2. `process-ocr` — lokale PDF-Extraktion (unpdf), sonst Mistral OCR via ai-proxy, triggers Extract
3. `extract-data` — Dokumenttyp-Erkennung, Schema-Felder, Tags (Chat via ai-proxy), triggers Embed
4. `generate-embed` — Text-Chunking (1000/200), Mistral Embed via ai-proxy, pgvector
5. `search` — Query-Embedding via ai-proxy + hybrid_search RPC
6. `chat` — RAG: Query-Embedding → Context-Retrieval → Mistral Chat, alles via ai-proxy
7. `ai-proxy` — Hono-App aus dem Repo gstrainovic/ai-proxy (gepinnter Tag): hält den Mistral-Key, zählt
   Verbrauch pro Organisation/Monat (`ai_usage`), Testzeit, setzt Plan-Limits durch (402), Fair-Use-Bremse (429),
   Stripe-Checkout/Portal/Webhook
8. `invite-member` — Admin lädt per E-Mail ins Team ein (RPC `invite_member`, Einladungsmail über Supabase Auth)

**Kein Function ruft Mistral direkt.** `_shared/ai-proxy.ts` bietet `aiFetchAsUser` (Nutzer-JWT durchreichen,
chat/search) und `aiFetchAsService` (Service-Role + `x-user-id` = Organisation des Dokuments, Pipeline, wiederholt
nach 429). 402 = Monatslimit: Meldung landet
in `documents.error_message` bzw. als 402 beim Frontend (`lib/edge-errors.ts` liest sie aus dem Body).
Plan-Katalog: `_shared/plans.ts` (Starter 100 Seiten / 500k Tokens, Pro 2000 / 10M), Preise auch in PricingView.

### Upload-Pipeline
```
Upload → upload-document → process-ocr → extract-data → generate-embed → ready
```
Alle Functions setzen `status: 'error'` + `error_message` im Fehlerfall.

### DB-Schema
- `documents` — Metadaten, OCR-Text, generierte tsvector (deutsch), Status
- `tags` + `document_tags` — Many-to-Many, source: 'ai'|'manual', confidence
- `document_fields` — Key-Value extrahierte Felder, source: 'ai'|'manual'
- `document_embeddings` — pgvector Chunks (1024-dim Mistral Embed)
- `document_schemas` — Mitgelieferte Schemas (Rechnung, Vertrag, Arztbrief, `org_id` null) und eigene der Organisation
- `organizations` + `organization_members` (Rolle admin|member) + `organization_invitations` — Besitzerin aller Daten, siehe AGENTS.md «Mehrbenutzer»
- `restricted_document_types` — Typen nur für Admins; `audit_log` — Protokoll, nur Admins lesen

### Hybrid RAG-Suche
- Volltext: PostgreSQL `tsvector` + `tsquery` (deutsch)
- Vektor: pgvector `<=>` Distanz (Mistral Embed 1024-dim)
- Kombiniert: `text_rank * 0.4 + vector_rank * 0.6`
- Filter: document_type, tags

### Abo & Nutzung (Frontend)
- `lib/ai-proxy.ts` — fetchUsage/startCheckout/openPortal gegen `/functions/v1/ai-proxy`
- `components/BillingCard.vue` — in den Einstellungen: Plan, Zähler mit Balken, Upgrade, Kundenportal
- Tabellen `ai_usage`/`ai_subscriptions` werden nur vom Proxy geschrieben (Service-Role), Konto ist die Organisation, Mitglieder lesen ihre Zeilen

### Views (7 Stück)
1. **Dashboard** — Stats (Gesamt/Bereit/Verarbeitung/Fehler), letzte Docs, Typ-Verteilung, Tags
2. **Dokumente** — DataTable mit Suche, Typ- und Status-Filter, Sortierung, Pagination
3. **Dokument-Detail** — Editierbarer Titel, Tag-Editor (AutoComplete), Feld-Editor (CRUD), OCR-Text, Delete
4. **Upload** — Drag&Drop, Kamera, Multi-File, SHA-256 Dedup, Realtime Status-Tracking
5. **Suche** — Volltext oder Hybrid(KI), Typ-Filter, Ergebnis-Highlighting, Relevanz-Score
6. **Chat** — RAG-Chat mit Mistral Small, Quellen-Links, Nachrichtenverlauf
7. **Einstellungen** — Team (Einladen, Rollen, Entfernen), Abo, Schema-Editor mit «Nur Admins», Tag-Verwaltung, Protokoll (Admins)

### Tests (112 Stück, alle grün)

**Unit/Integration (57 Tests, Vitest):**
- `shared/retry.test.ts` — 5 Tests (withRetry, Rate-Limit, maxRetries)
- `shared/image-utils.test.ts` — 3 Tests (SHA-256 Hash)
- `app/supabase-crud.test.ts` — 10 Tests (CRUD, Joins, Constraints)
- `app/upload.test.ts` — 7 Tests (Storage, SHA-256, Dedup, Pipeline, FTS, Error, Realtime)
- `app/tagging.test.ts` — 11 Tests (Tag CRUD, AI/Manual Source, Fields, Schemas, Filter)
- `app/search.test.ts` — 6 Tests (Volltext deutsch, hybrid_search RPC, Filter)
- `app/edge-functions.test.ts` — 15 Tests (Upload, OCR, Extract, Embed, Search, Chat)

**E2E (55 Tests, Playwright Chromium):**
- `e2e/dashboard.spec.ts` — 8 Tests (Stats, Navigation, Tags, Typen)
- `e2e/documents.spec.ts` — 8 Tests (DataTable, Suche, Filter, Sortierung)
- `e2e/document-detail.spec.ts` — 10 Tests (Titel, Tags, Felder, OCR, Loeschen)
- `e2e/upload.spec.ts` — 8 Tests (Drop-Zone, Upload, Fortschritt, PDF)
- `e2e/search.spec.ts` — 7 Tests (Volltext, Ergebnisse, Navigation, Modus)
- `e2e/chat.spec.ts` — 6 Tests (Willkommen, Senden, Antwort, Neuer Chat)
- `e2e/settings.spec.ts` — 8 Tests (Theme, Schema CRUD, Tags)

### Lokale Entwicklung
```bash
# Alles automatisch starten (Podman + Supabase + Secrets + Vite):
pnpm dev

# Oder manuell:
systemctl --user start podman.socket
export DOCKER_HOST="unix:///run/user/1000/podman/podman.sock"
supabase start
pnpm dev:frontend
```

### Befehle
- `pnpm dev` — **Startet alles:** Podman-Socket, Secrets kopieren, Supabase, Vite (Port 3000)
- `pnpm dev:frontend` — Nur Vite Dev Server (wenn Supabase schon laeuft)
- `pnpm test` — **Startet alles + DB-Reset + alle 57 Unit/Integration Tests**
- `pnpm test:only` — Nur Unit/Integration Tests ausfuehren (ohne Backend-Setup)
- `pnpm test:e2e` — **Startet alles + DB-Reset + alle 55 Playwright E2E Tests**
- `pnpm test:all` — **Alle Tests:** Unit/Integration + E2E (112 Tests gesamt)
- `pnpm build` — Production Build (vue-tsc + vite)
- `scripts/dev-vm.sh tunnel|sync|reset|status|logs|restart|ssh` — Dev-Supabase auf der Infomaniak-Instanz `dms-dev` per SSH-Tunnel statt Podman (PC ohne Docker), siehe AGENTS.md «Entwickeln ohne Docker»
- `supabase db reset` — DB zuruecksetzen + Migrations
- `supabase gen types typescript --local` — DB-Typen regenerieren

### Scripts (scripts/)
- **`dev.sh`** — Automatisiertes Dev-Setup:
  1. Podman-Socket pruefen/starten
  2. SELinux-Kontext setzen (container_file_t fuer Edge Functions)
  3. `.env` → `supabase/functions/.env` kopieren (Edge Function Secrets)
  4. Supabase starten (mit Cleanup bei kaputten Containern)
  5. Vite Dev Server starten
- **`test.sh`** — Automatisiertes Test-Setup:
  1. Podman-Socket pruefen/starten
  2. SELinux-Kontext setzen (container_file_t)
  3. Secrets kopieren
  4. Supabase starten
  5. `supabase db reset` (saubere DB fuer Tests)
  6. `pnpm -r test` ausfuehren
- **`test-e2e.sh`** — E2E Test-Setup (wie test.sh, aber mit Playwright statt Vitest)

### Secrets
- Mistral API Key in `.env` im Projektroot (Format: `MISTRAL_API_KEY=sk-...`), gebraucht nur von `ai-proxy`
- Stripe (optional): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `APP_URL` ebenfalls in `.env`
- Wird automatisch nach `supabase/functions/.env` kopiert (von dev.sh/test.sh)
- `supabase/functions/.env` ist in `.gitignore` — wird nie committed
- `.env.example` zeigt das erwartete Format

## Infra
- Rootless Podman 5.7.1 auf Fedora 43
- DOCKER_HOST=unix:///run/user/1000/podman/podman.sock
- Container-Init ~60s (Migrations) — nicht sofort testen
- Supabase CLI v2.75+ unterstützt rootless Podman

## Bekannte Einschraenkungen
- `document_schemas` JSONB verursacht TS2589 → `schemas.ts` Store nutzt eigenen `Schema`-Typ statt auto-generated
- Edge Functions lesen Secrets aus `supabase/functions/.env` (wird automatisch von dev.sh/test.sh aus `.env` kopiert)
- Hybrid-Search via Edge Function `search` (braucht Mistral Embed API fuer Query-Embedding)
- `supabase status` kann 0 zurueckgeben obwohl Container kaputt sind → dev.sh prueft DB-Container direkt via `docker ps`
- Vite bevorzugt `.js` ueber `.ts` beim Resolven → NIEMALS `tsc` im `src/` laufen lassen (erzeugt .js Artefakte die Vite statt der .ts Quellen verwendet). `.gitignore` schliesst `apps/dms/src/**/*.js` aus
- SELinux auf Fedora: Edge Functions brauchen `container_file_t` Kontext → wird automatisch von dev.sh/test.sh gesetzt
- Edge Runtime lädt Function-Code nicht nach: nach Änderungen `docker restart supabase_edge_runtime_dms`; nach Änderungen an `config.toml` oder `supabase/functions/.env` `supabase stop && supabase start`
- Direkt nach einem Neustart kann der Edge-Runtime-Container kurz keine DNS-Namen auflösen (`api.mistral.ai`) → Tests einfach wiederholen
- Der Test-Client in `edge-functions.test.ts` trägt nach `verifyOtp` die Nutzer-Session; für Schreibzugriffe auf RLS-Tabellen einen separaten Service-Role-Client erzeugen
