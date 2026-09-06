# Offene Punkte

Ziel und Entscheidungen stehen in `AGENTS.md` unter «Geschäftsmodell» und «AI-Proxy».

## 1. AI-Proxy aus auto-service herauslösen (Repo `~/projects/ai-proxy`)
- [x] `server/` und `src/shared/plans.ts` in eigenes Repo mit package.json, Tests, Dockerfile
- [x] auto-service nutzt das Paket (dev:proxy, Playwright, deploy/docker-compose)
- [x] Browser-BYOK in auto-service entfernen, Proxy verpflichtend
- [x] Tests in beiden Repos grün
- [ ] Änderungen in auto-service committen (Working Tree enthielt schon WIP, Entscheidung beim Nutzer)
- [ ] Repo `gstrainovic/ai-proxy` auf GitHub anlegen und pushen; `file:../ai-proxy` in auto-service danach optional durch `github:gstrainovic/ai-proxy` ersetzen

## 2. Proxy für Supabase vorbereiten
- [x] Supabase-Store (Zähler, Abos) neben dem InstantDB-Store
- [x] Supabase-JWT-Prüfung neben der InstantDB-Token-Prüfung
- [x] Route `/v1/embeddings` mit Zählung
- [x] Entry-Point für Supabase Edge Functions (Hono auf Deno)
- [x] Migration `00007_ai_proxy.sql`: `ai_usage`, `ai_subscriptions`, RPC `ai_add_usage`, RLS

## 3. DMS anbinden
- [ ] Pläne pro App: `PLANS` in ai-proxy ist auf auto-service zugeschnitten (free/basic/pro). `createApp` muss die Pläne injizierbar machen, DMS bringt eigene (Starter/Pro/Business mit eigenen Limits)
- [ ] Edge Function `ai-proxy`, importiert `src/edge.ts` aus dem ai-proxy-Repo (Import-Map aus `deno.json`), Secret `MISTRAL_API_KEY`
- [ ] DB-Typen regenerieren (`ai_usage`, `ai_subscriptions`), Aliase wieder anhängen
- [ ] `process-ocr`, `extract-data`, `generate-embed`, `chat` rufen Mistral über den Proxy auf
- [ ] Einstellungen zeigen Plan, Nutzung, Checkout und Kundenportal
- [ ] Preisseite nennt die tatsächlichen Limits
- [ ] Tests: Zähler nach Pipeline-Durchlauf, 402 bei Limit, Webhook setzt Plan

## 4. Server-seitiges BYOK für Geschäftskunden
- [ ] Organisationen und Zuordnung Nutzer → Organisation
- [ ] Key pro Organisation verschlüsselt im Store, Eingabe und Test in den Einstellungen
- [ ] Proxy nutzt Organisations-Key statt Plattform-Key, Verbrauch zählt nicht gegen das Limit
- [ ] Tests: Auflösung, Fallback, kein Key in Responses

## Betrieb auf Hetzner
- [ ] Ein Server (mindestens 8 GB RAM), Docker Compose mit Caddy
- [ ] auto-service: PWA, InstantDB, Proxy-Container
- [ ] DMS: Frontend, selbst gehosteter Supabase-Stack

## Restposten Texte
- [ ] FAQ und Über-uns nennen noch «OCR-Erkennung» und «Auto-Tagging», an Features-Seite angleichen
- [ ] Suchmodus-Umschalter in der App: «Hybrid (KI)» durch «Nach Bedeutung» ersetzen

## Manuell auf GitHub
- [ ] Branch Protection für `main`: Status-Check «CLA Check» als erforderlich markieren
