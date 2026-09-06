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
- [ ] ~~Stripe im DMS konfigurieren~~ ersetzt durch Payrexx, siehe Abschnitt Zahlungsanbieter
- [ ] Upload-Ansicht: Limit-Meldung aus `error_message` prominent zeigen (heute wie jeder andere Fehler)

## Zahlungsanbieter: Payrexx statt Stripe (Entscheidung 06.09.2026, geprüfte Preise)

Beste Preis-Leistung und Datenschutz: Schweizer Anbieter, Daten in der Schweiz, pro Zahlung rund 35 bis 40 Rappen
günstiger als Stripe (Karte 1,65 % + 0.18 statt 2,9 % + 0.30; TWINT 1,25 % + 0.18 statt 1,9 % + 0.30),
Standard-Abo 19 CHF/Monat, 30 % Startup-Rabatt, keine Einrichtungsgebühr. Abos später umzuziehen kostet Kunden,
deshalb von Anfang an Payrexx. Beide Apps (auto-service und dms) stellen um.

**Blockiert, bis das Payrexx-Konto beantragt und freigegeben ist** (Einzelunternehmen: Ausweis, Wohnsitznachweis,
Konto auf eigenen Namen; Handelsregister erst ab 100k Umsatz nötig).

- [ ] Payrexx-Konto anlegen (Standard, Startup-Rabatt), verifizieren, Payrexx Pay aktivieren, Testmodus einschalten, API-Key und Webhook-Signing-Key notieren
- [ ] ai-proxy: austauschbare Billing-Schnittstelle, Stripe-Implementierung behalten, Payrexx-Implementierung ergänzen
      (Gateway mit subscriptionState, Webhook mit X-Webhook-Signature HMAC-SHA256 hex, Status active/overdue/failed/cancelled/in_notice,
      Kundenportal via POST /AuthToken, Kündigen via DELETE /Subscription/{id}); Tests gegen dokumentierte Payloads
- [ ] DMS auf Payrexx umstellen (Env: PAYREXX_INSTANCE, PAYREXX_API_SECRET, PAYREXX_WEBHOOK_SECRET), Checkout und Kündigung einmal im Testmodus durchspielen
- [ ] Datenschutzerklärung: Stripe durch Payrexx AG, Thun ersetzen

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
