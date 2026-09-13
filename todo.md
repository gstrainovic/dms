# Offene Punkte

Ziel und Entscheidungen stehen in `AGENTS.md`. Reihenfolge, nicht Themen.

## Geparkt bis zum Entscheid bei auto-service

Zwei Produkte, null Kunden: Zuerst wird auto-service validiert (dort `business-plan/09-validierung.md`, vier Wochen). Erst danach bekommt dms dasselbe Kapitel, mit Treuhandbüro und Arztpraxis als Kandidaten. Bis dahin keine neuen Funktionen, kein Server, kein Zahlungsanbieter.

## Danach: Validierung dms

- [ ] Kapitel «Validierung» wie bei auto-service: Hypothesen Treuhandbüro und Arztpraxis (Arztbrief-Schema existiert schon), Preis-Hypothese 100 bis 200 CHF im Monat, Abbruchkriterien, schriftliche Ansprache, Landing Page
- [ ] Ergebnis in `AGENTS.md`, Preisseite und `_shared/plans.ts` danach angleichen

## Sobald ein Kunde Ja sagt: Betrieb

- [ ] Eigene Infomaniak VPS Lite (Schweiz, 2 vCPU / 4 GB, 7.20 CHF/Monat) für dms, getrennt von auto-service: Frontend und selbst gehosteter Supabase-Stack ohne Studio, Analytics und Log-Pipeline; Docker Compose mit Caddy; Domain für dms noch offen
- [ ] Erste Kunden per Jahresrechnung mit QR-Rechnung, kein Zahlungsanbieter
- [ ] Upload-Ansicht: Limit-Meldung aus `error_message` prominent zeigen (heute wie jeder andere Fehler)

## Zahlungsanbieter Payrexx, erst bei monatlicher Kartenzahlung

Entscheid und geprüfte Preise in `AGENTS.md`. Die Anbindung entsteht im Repo ai-proxy und wird von auto-service mitgenutzt.

- [ ] DMS auf Payrexx umstellen (PAYREXX_INSTANCE, PAYREXX_API_SECRET, PAYREXX_WEBHOOK_SECRET), Checkout und Kündigung im Testmodus durchspielen
- [ ] Datenschutzerklärung: Stripe durch Payrexx AG, Thun ersetzen

## Server-seitiges BYOK für Geschäftskunden, erst wenn ein Kunde danach fragt

- [ ] Organisationen und Zuordnung Nutzer → Organisation
- [ ] Key pro Organisation verschlüsselt im Store, Eingabe und Test in den Einstellungen
- [ ] Proxy nutzt Organisations-Key statt Plattform-Key, Verbrauch zählt nicht gegen das Limit
- [ ] Tests: Auflösung, Fallback, kein Key in Responses

## Kleinkram, jederzeit

- [ ] FAQ und Über-uns nennen noch «OCR-Erkennung» und «Auto-Tagging», an Features-Seite angleichen
- [ ] Suchmodus-Umschalter in der App: «Hybrid (KI)» durch «Nach Bedeutung» ersetzen
- [ ] GitHub, Branch Protection für `main`: Status-Check «CLA Check» als erforderlich markieren (fünf Minuten, manuell)
