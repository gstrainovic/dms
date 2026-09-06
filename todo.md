# Offene Punkte

Ziel und Reihenfolge stehen in `AGENTS.md` unter «Geschäftsmodell».

## 1. Verbrauch messen
- [ ] Migration: Tabelle `usage_events` (user_id, kind: ocr_page | chat_request | embedding_chunk, amount, created_at) plus RLS
- [ ] `process-ocr` schreibt Seitenzahl nach jedem Mistral-OCR-Aufruf (nicht bei lokaler Extraktion)
- [ ] `chat` schreibt eine Anfrage pro Aufruf
- [ ] `generate-embed` schreibt Chunk-Anzahl
- [ ] `extract-data` schreibt eine Anfrage pro Aufruf
- [ ] RPC `monthly_usage(user_id)` für die Summen des laufenden Monats
- [ ] Dashboard zeigt Verbrauch des Monats
- [ ] Tests: nach Pipeline-Durchlauf stimmen die Zähler

## 2. Pläne und Limit
- [ ] Spalte `plan` am Nutzerprofil (starter | pro | business), Default starter
- [ ] Limits pro Plan zentral definiert (OCR-Seiten, Chat-Anfragen pro Monat)
- [ ] Prüfung vor jedem kostenpflichtigen Aufruf, bei Überschreitung 402 mit klarer Meldung
- [ ] Upload-View und Chat zeigen die Meldung verständlich an
- [ ] Preisseite nennt die tatsächlichen Limits
- [ ] Tests: Limit erreicht → Aufruf abgelehnt, Dokument bekommt Status error mit Hinweis

## 3. Bring your own Key (Geschäftskunden)
- [ ] Tabelle `organizations` und Zuordnung Nutzer → Organisation
- [ ] Mistral-Key pro Organisation verschlüsselt in Supabase Vault
- [ ] Einstellungen: Key eintragen, testen, entfernen (nie im Klartext anzeigen)
- [ ] Edge Functions lösen den Key der Organisation auf, Fallback auf Plattform-Key
- [ ] Verbrauch mit eigenem Key zählt nicht gegen das Limit
- [ ] Tests: Key-Auflösung, Fallback, kein Key-Leak in Responses

## 4. Zahlung
- [ ] Stripe Checkout für Pro und Business
- [ ] Webhook setzt `plan` am Nutzerprofil
- [ ] Kündigung setzt zurück auf starter

## Restposten Texte
- [ ] FAQ und Über-uns nennen noch «OCR-Erkennung» und «Auto-Tagging», an Features-Seite angleichen
- [ ] Suchmodus-Umschalter in der App: «Hybrid (KI)» durch «Nach Bedeutung» ersetzen

## Manuell auf GitHub
- [ ] Branch Protection für `main`: Status-Check «CLA Check» als erforderlich markieren
