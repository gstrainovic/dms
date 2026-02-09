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

## GitHub DMS/RAG-Projekte — nach Stars sortiert (Stand 08.02.2026)

### Gesamtübersicht mit Evaluationsergebnis

| # | Projekt | Stars | Upload | Mistral OCR | Auto-Tag | Volltext | RAG/Chat | RAM | Ergebnis |
|---|---|---|---|---|---|---|---|---|---|
| 1 | [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | 36.4K | Ja | Nein | Nein | Ja | Nein | Mittel | VERWORFEN (2 UIs) |
| 2 | [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | 54.3K | Ja | Nein | Nein | Nein | Ja | 2 GB | VERWORFEN (nur RAG) |
| 3 | [kotaemon](https://github.com/Cinnamon/kotaemon) | 25.0K | Ja | Custom Loader | Nein | Hybrid | Ja | ~4 GB | VERWORFEN (kein Tagging) |
| 4 | [CKAN](https://github.com/ckan/ckan) | 4.9K | Datenkatalog | Custom Ext. | Nein | Solr | Alpha | 6 Container | VERWORFEN (falsches Tool) |
| 5 | [Papra](https://github.com/papra-hq/papra) | 3.8K | Ja | Nein (fest) | Regeln | Einfach | Nein | ~200 MB | VERWORFEN (zu simpel) |
| 6 | [Papermerge](https://github.com/ciur/papermerge) | 2.9K | Ja | Worker-Fork | Regeln | Solr | Nein | Leicht | VERWORFEN (kein RAG) |
| 7 | [Teedy](https://github.com/sismics/docs) | 2.4K | Ja | Nein (fest) | Nein | Ja | Nein | ~1 GB | VERWORFEN (kein Tagging/RAG) |
| 8 | [Docspell](https://github.com/eikek/docspell) | 2.2K | Ja | Workaround | ML (Stanford) | SOLR | Nein | 3-5 GB | VERWORFEN (kein RAG, zu schwer) |
| 9 | [paperless-gpt](https://github.com/icereed/paperless-gpt) | 1.9K | Addon | LLM-Vision | Ja | Via Paperless | Via Paperless | Braucht Paperless | VERWORFEN |
| 10 | [PdfDing](https://github.com/mrmn2/PdfDing) | 1.6K | Ja | Nein | Nein | Nein | Nein | Leicht | VERWORFEN (nur PDFs) |
| 11 | [OpenKM](https://github.com/openkm/document-management-system) | 827 | Ja | Java-Plugin | Nur Prof. | Lucene | Nein | 3.5 GB | VERWORFEN (Paywall, veraltet) |
| 12 | [Mayan EDMS](https://github.com/mayan-edms/Mayan-EDMS) | 775 | Ja | Custom | Regeln | Ja | Nein | Mittel | VERWORFEN (~40-60h) |
| 13 | [Lodestone](https://github.com/LodestoneHQ/lodestone) | 522 | Ja | Nein | Nein | ES | Nein | 8 Container | VERWORFEN (TOT seit 2024) |
| 14 | [Papermerge Core](https://github.com/papermerge/papermerge-core) | 436 | Ja | Worker-Fork | Regeln | Solr | Nein | Leicht | = Papermerge v3 |
| 15 | [OCA/dms](https://github.com/OCA/dms) | 150 | Via Odoo | Nein | Regex | Schwach | Nein | Odoo noetig | VERWORFEN (Overkill) |
| 16 | [RAG-Anything](https://github.com/HKUDS/RAG-Anything) | 1K+ | Nein | Nein | Nein | Indirekt | Ja | MinerU noetig | VERWORFEN (nur Framework) |

### RAG / AI Frameworks (bereits getestet)

| Projekt | Stars | Ergebnis |
|---|---|---|
| [Open WebUI](https://github.com/open-webui/open-webui) | 70K+ | VERWORFEN (kein DMS-Archiv) |
| [Dify](https://github.com/langgenius/dify) | 70K+ | VERWORFEN (kein DMS) |
| [private-gpt](https://github.com/zylon-ai/private-gpt) | 57.1K | Kein DMS-Archiv |
| [RAGFlow](https://github.com/infiniflow/ragflow) | 35K+ | VERWORFEN (lokale OCR hardcoded) |

### Lokale OCR-Tools — NICHT NUTZBAR (Hardware)

| Projekt | Stars | Warum nicht? |
|---|---|---|
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 70.4K | Braucht viel RAM/GPU |
| [MinerU](https://github.com/opendatalab/MinerU) | 54.0K | 16-32 GB RAM |
| [Docling](https://github.com/docling-project/docling) | 52.4K | 3-4 GB RAM Spitzen |
| [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) | 32.5K | Nur Preprocessing |

### Weitere (nicht relevant)

| Projekt | Stars | Warum nicht? |
|---|---|---|
| [Seafile](https://github.com/haiwen/seafile) | 14.3K | File Sync, kein OCR/Tagging |
| [Filestash](https://github.com/mickael-kerjean/filestash) | 13.5K | Universal File Platform, kein OCR |
| [TagStudio](https://github.com/TagStudioDev/TagStudio) | 6.7K | Desktop-App, kein RAG/Web |
| [ArchiveBox](https://github.com/ArchiveBox/ArchiveBox) | 26.8K | Web-Archivierung, kein Dok-DMS |
| [igdm](https://github.com/igdmapps/igdm) | 2.0K | Instagram DMs — NICHT DMS! |

### ERP/PIM/NoCode — ALLE VERWORFEN

| Tool | Typ | Warum nicht? |
|---|---|---|
| Odoo | ERP | Community kein DMS. Enterprise kostet. Kein RAG. |
| ERPNext | ERP | 10 Container. Kein DMS-Modul. Kein RAG. |
| NocoBase | No-Code | RAG ab $8.000. Kein OCR. |
| Pimcore | PIM/DAM | POCL-Lizenz. 5+ Container. Overengineered. |
| UnoPIM | PIM | Reines Produktdaten-Tool. |

---

## Fazit der Gesamtevaluation

**30+ Tools/Plattformen evaluiert. KEINES erfuellt alle 5 Anforderungen.**

Beste Teilstuecke:
- **Bestes DMS-UI:** Papermerge (Ordner, Tags, Versionierung, REST API)
- **Bestes Auto-Tagging:** Docspell (ML via Stanford NLP, lernt dazu)
- **Bestes RAG/Chat:** kotaemon (Hybrid Volltext+Vektor, Multi-Hop)
- **Mistral OCR:** Kein Tool hat es nativ — ueberall Custom-Code noetig

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
  migrations/               — 3 SQL-Migrations (Schema, Storage, RLS)
  functions/                — 6 Edge Functions
```

### Edge Functions (6 Stück)
1. `upload-document` — FormData Upload, SHA-256 Dedup, Storage, DB, triggers OCR
2. `process-ocr` — Mistral OCR (PDF/Bild), Table-Replacement, triggers Extract
3. `extract-data` — Dokumenttyp-Erkennung, Schema-Felder, Tags, triggers Embed
4. `generate-embed` — Text-Chunking (1000/200), Mistral Embed Batch, pgvector
5. `search` — Query-Embedding + hybrid_search RPC
6. `chat` — RAG: Query-Embedding → Context-Retrieval → Mistral Chat

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
- `document_schemas` — Vordefinierte Schemas (Rechnung, Vertrag, Arztbrief)

### Hybrid RAG-Suche
- Volltext: PostgreSQL `tsvector` + `tsquery` (deutsch)
- Vektor: pgvector `<=>` Distanz (Mistral Embed 1024-dim)
- Kombiniert: `text_rank * 0.4 + vector_rank * 0.6`
- Filter: document_type, tags

### Views (7 Stück)
1. **Dashboard** — Stats (Gesamt/Bereit/Verarbeitung/Fehler), letzte Docs, Typ-Verteilung, Tags
2. **Dokumente** — DataTable mit Suche, Typ- und Status-Filter, Sortierung, Pagination
3. **Dokument-Detail** — Editierbarer Titel, Tag-Editor (AutoComplete), Feld-Editor (CRUD), OCR-Text, Delete
4. **Upload** — Drag&Drop, Kamera, Multi-File, SHA-256 Dedup, Realtime Status-Tracking
5. **Suche** — Volltext oder Hybrid(KI), Typ-Filter, Ergebnis-Highlighting, Relevanz-Score
6. **Chat** — RAG-Chat mit Mistral Small, Quellen-Links, Nachrichtenverlauf
7. **Einstellungen** — Schema-Editor (CRUD, JSON), Tag-Verwaltung

### Tests (42 Stück, alle grün)
- `shared/retry.test.ts` — 5 Tests (withRetry, Rate-Limit, maxRetries)
- `shared/image-utils.test.ts` — 3 Tests (SHA-256 Hash)
- `app/supabase-crud.test.ts` — 10 Tests (CRUD, Joins, Constraints)
- `app/upload.test.ts` — 7 Tests (Storage, SHA-256, Dedup, Pipeline, FTS, Error, Realtime)
- `app/tagging.test.ts` — 11 Tests (Tag CRUD, AI/Manual Source, Fields, Schemas, Filter)
- `app/search.test.ts` — 6 Tests (Volltext deutsch, hybrid_search RPC, Filter)

### Lokale Entwicklung
```bash
# Podman Socket starten
systemctl --user start podman.socket
export DOCKER_HOST="unix:///run/user/1000/podman/podman.sock"

# Supabase starten
supabase start

# Dev Server
pnpm dev

# Mistral API Key setzen (für Edge Functions)
supabase secrets set MISTRAL_API_KEY=your-key
```

### Befehle
- `pnpm dev` — DMS Frontend starten (Port 3000)
- `pnpm test` — Alle Tests (42)
- `pnpm build` — Production Build (vue-tsc + vite)
- `supabase start` — Lokale Supabase (mit DOCKER_HOST)
- `supabase db reset` — DB zurücksetzen + Migrations
- `supabase gen types typescript --local` — DB-Typen regenerieren

## Infra
- Rootless Podman 5.7.1 auf Fedora 43
- DOCKER_HOST=unix:///run/user/1000/podman/podman.sock
- Container-Init ~60s (Migrations) — nicht sofort testen
- Supabase CLI v2.75+ unterstützt rootless Podman

## Bekannte Einschränkungen
- `document_schemas` JSONB verursacht TS2589 → `schemas.ts` Store nutzt eigenen `Schema`-Typ statt auto-generated
- Edge Functions brauchen `MISTRAL_API_KEY` als Supabase Secret
- Hybrid-Search via Edge Function `search` (braucht Mistral Embed API für Query-Embedding)
