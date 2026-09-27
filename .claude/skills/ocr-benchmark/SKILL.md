---
name: ocr-benchmark
description: OCR-Vergleich Mistral OCR gegen Vision-Modelle Schweizer Anbieter (Infomaniak, kvant/Phoeniqs) in scripts/ocr-benchmark/. Laden bei pnpm ocr-benchmark, bei Fragen zur OCR-Qualität oder -Kosten, bei der Wahl des OCR-Anbieters oder bei Arbeit mit Infomaniak AI Services.
---

# OCR-Vergleich

`scripts/ocr-benchmark/` vergleicht Mistral OCR mit Vision-Modellen, die Infomaniak und kvant/Phoeniqs in der Schweiz anbieten. Aufruf `pnpm ocr-benchmark` (einzelne Modelle: `node scripts/ocr-benchmark/run.ts --models=…`), Zahlen in `results.md`, Tests per `pnpm test:scripts`. Die offenen Modelle laufen für die Qualitätsmessung über OpenRouter (gleiche Gewichte), die Kosten rechnet `prices.ts` mit den Schweizer Preislisten.

## Testsatz
13 künstliche Seiten aus `e2e/fixtures` und wartungsheft `testdateien/` (Referenztext aus HTML bzw. PDF-Textebene), je sauber und künstlich verzerrt, dazu echte Handyfotos aus wartungsheft `tmp/test-images`. Die echten Fotos stehen nur in `testset.local.json` und `.cache/` (beide gitignored), weil sie Personendaten enthalten; in `results.md` erscheinen sie ohne Inhalte. Schweizer Dokumente (erfundene QR-Rechnungen, Lohnausweis, Steuerrechnung usw.) in `ch-docs.ts`.

## Befunde
- `mistral-ocr-latest` ist OCR 4.1 zu 4 USD pro 1000 Seiten. OCR 3 (`mistral-ocr-2512`) kostet die Hälfte und ist bei Fotos gleich gut oder besser (echte Fotos 99 % der Felder, OCR 4.1 97 %).
- Mistral OCR verliert bei Formularen mit mehreren Spalten die rechte Wertespalte (Fahrzeugausweis: Gewichte fehlen). Vision-Modelle lesen sie.
- Gedrehte, unscharfe Fotos sind die Schwachstelle der kleinen Modelle (Mistral Small 4, Ministral 3, Llama 4). Mistral OCR, Qwen3-VL und Gemma 4 bleiben stabil.
- Schwere Tabellen (30 ParseBench-Seiten): sauber gescannt liegen Kimi K2.6 (97.5 % der Zellen) und Qwen3.5 (95–96 %) vor Mistral OCR 4.1 (94 %), sind aber 4- bis 10-mal langsamer und 3- bis 4-mal teurer. Verzerrt gewinnt Mistral OCR 4.1 deutlich (91 % gegen höchstens 82 %). OCR 3 fällt bei Tabellen ab (90 %). Vision-Modelle brauchen für dichte Tabellen mehr als 4096 Ausgabe-Tokens und bis zu 5 Minuten pro Seite.
- Schweizer Dokumente: alle Modelle finden fast alle Felder, Mistral OCR hat die wenigsten Zeichenfehler.
- Die unabhängige Rangliste ParseBench (GitHub `run-llama/ParseBench`, rund 2000 echte Geschäftsseiten) bestätigt das Bild: Mistral OCR 4 gesamt 60.7, Gemma 4 31B 62.4, MinerU 2.5 Pro (bei kvant) 72.8.

## Infomaniak AI Services
Produkt 111648, Token `INFOMANIAK_AI_TOKEN` in `.env`, Scope `ai-tools`. Alle Sprachmodelle dort nehmen Bilder an, auch wenn die FAQ anderes sagt. Qwen3.5 und Kimi K2.6 brauchen abgeschaltetes Denken (`chat_template_kwargs`), sonst geht das ganze Antwortlimit ans Denken und der Text bleibt leer. Apertus erfindet Werte und taugt nicht für OCR.
