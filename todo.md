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
- [x] Pläne pro App injizierbar, DMS-Katalog Starter/Pro in `_shared/plans.ts`
- [x] Edge Function `ai-proxy` (gepinnter Import v0.2.0, `deno.json`), Secret `MISTRAL_API_KEY`
- [x] DB-Typen regeneriert, Aliase behalten
- [x] `process-ocr`, `extract-data`, `generate-embed`, `chat`, `search` rufen Mistral über den Proxy auf
- [x] Einstellungen zeigen Plan, Nutzung, Upgrade und Kundenportal (`BillingCard.vue`)
- [x] Preisseite nennt die tatsächlichen Limits
- [x] Tests: Zähler nach Pipeline-Durchlauf, 402 bei OCR- und Token-Limit, E2E Abo-Karte
- [ ] Stripe im DMS konfigurieren: Produkt Pro anlegen, `STRIPE_*` in `.env`, Webhook-URL `/functions/v1/ai-proxy/stripe/webhook`, Checkout einmal end-to-end im Test-Modus prüfen (Webhook-Logik ist im Proxy getestet)
- [ ] Upload-Ansicht: Limit-Meldung aus `error_message` prominent zeigen (heute wie jeder andere Fehler)

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
