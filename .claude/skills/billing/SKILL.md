---
name: billing
description: Abo, Nutzung, Plan-Limits, Testzeit und Zahlungsweg in dms (plans.ts, ai-proxy-Abo-Routen, BillingCard, PricingView). Laden bei Arbeit an Preisen, Plänen, Limits (402/429), Nutzungsanzeige, Checkout, Rechnungen oder Zahlungsanbieter.
---

# Abo, Nutzung und Zahlung

## Plan-Katalog
`supabase/functions/_shared/plans.ts` (`DMS_PLANS`), vom ai-proxy durchgesetzt und über `/me/usage` ans Frontend geliefert:
- `starter` (Standardplan, 0 CHF/Monat): 100 OCR-Seiten, 500k Tokens pro Monat
- `pro` (19 CHF/Monat): 2000 OCR-Seiten, 10M Tokens pro Monat

`ocrPages` zählt nur Seiten, die an Mistral OCR gehen (lokal extrahierte PDFs nicht); `chatTokens` umfasst Chat, Auswertung und Embeddings. Die Preise stehen zusätzlich fest in `apps/dms/src/views/PricingView.vue`, beides zusammen ändern.

Ziel laut Geschäftsmodell (`~/projects/business/dms/geschaeftsmodell.md`, Umbau in `todo.md` 2.1): kein Gratisplan, 30 Tage Testzeit, danach die Jahresabos **Privat** (ein Konto) und **Betrieb** (pro Firma, alle Mitarbeitenden) mit denselben Funktionen; die Monatslimits sind dann nur Missbrauchsgrenzen. Betrieb setzt Mehrbenutzer voraus (Skill `organisationen`).

## Durchsetzung im ai-proxy
- Konto ist die Organisation; Verbrauch pro Organisation und Monat in `ai_usage`, Abo in `ai_subscriptions`. Beide Tabellen schreibt nur der Proxy (Service-Role), Mitglieder lesen ihre Zeilen.
- Monatslimit überschritten → 402; die Meldung landet in `documents.error_message` bzw. im Frontend (`lib/edge-errors.ts` liest sie aus dem Body).
- Fair-Use-Bremse → 429 (Vorgabe 20 Aufrufe pro Minute und Konto, `AI_PROXY_BURST_LIMIT`). Die Pipeline wartet und wiederholt (`withRateLimitRetry`), Chat und Suche geben 429 an die Person weiter.
- Routen unter `/functions/v1/ai-proxy/`: `me/usage`, `billing/*`, `stripe/webhook`.

## Frontend
- `apps/dms/src/lib/ai-proxy.ts`: `fetchUsage`, `startCheckout`, `openPortal`
- `apps/dms/src/components/BillingCard.vue` in den Einstellungen: Plan, Zähler mit Balken, Upgrade, Kundenportal

## Zahlungsweg
- **Zuerst QR-Rechnungen für Schweizer Kunden:** Jahresrechnung mit QR-Zahlteil, ohne Zahlungsanbieter. Im Proxy speichert der `SupabaseStore` Rechnungs-Abos, `createEdgeApp` verdrahtet `invoicing` (PDF mit QR-Zahlteil, Versand über Resend) in dms aber noch nicht; bis dahin antworten `/billing/order`, `/cancel`, `/resume` mit 501.
- **Kartenzahlung kommt später, der Anbieter ist offen: Payrexx oder Stripe.**
- Im Proxy ist heute Stripe implementiert (Checkout, Kundenportal, Webhook); Variablen `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `APP_URL` in `.env`.
- Payrexx-Fakten für eine allfällige Umsetzung: TWINT-Abos über Tokenisierung, fehlgeschlagene Abbuchung wird einmal wiederholt (Status overdue → failed), Kundenportal per `POST /AuthToken` (Login-Link), Webhook als JSON mit `X-Webhook-Signature` (HMAC-SHA256, hex, über den Raw-Body), bis zu 10 Zustellversuche, Auth per `X-API-KEY`, Testmodus mit Testkarten. Die Abo-Endpunkte sind als «experimental documentation» markiert, es gibt kein TS-SDK, nur PHP.
- Preisvergleich der Anbieter im privaten Repo `~/projects/business`.
