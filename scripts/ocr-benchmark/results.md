# OCR-Vergleich

Erzeugt von `summary.ts` aus `.cache/results.json`. Die Durchschnitte sind nur innerhalb einer Gruppe vergleichbar.

## Fixtures

Künstliche Rechnungen und Verträge aus dms `e2e/fixtures` und wartungsheft `testdateien/`, dazu der Fahrzeugausweis (echter Scan).

| Modell | Fassung | Zeichenfehler | Felder gefunden | Erfundene Wörter | Sekunden/Seite | CHF/1000 Seiten | Fehler |
|---|---|---:|---:|---:|---:|---:|---:|
| Mistral OCR 4.1 (Referenz) | sauber | 0.5 % | 96.8 % | 0.1 % | 1.2 | 3.28 | 0 |
| Mistral OCR 4.1 (Referenz) | verzerrt | 0.9 % | 96.1 % | 1.3 % | 1.1 | 3.28 | 0 |
| Mistral OCR 3 (halber Preis) | sauber | 0.5 % | 97.9 % | 0.2 % | 1.7 | 1.64 | 0 |
| Mistral OCR 3 (halber Preis) | verzerrt | 0.6 % | 97.4 % | 0.8 % | 1.4 | 1.64 | 0 |
| Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral) | sauber | 0.2 % | 94.7 % | 0.5 % | 2.1 | 0.56 | 0 |
| Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral) | verzerrt | 10.4 % | 81.6 % | 9.4 % | 2.1 | 0.4 | 0 |
| Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral) | sauber | 1.8 % | 80.9 % | 1.2 % | 2.5 | 0.6 | 0 |
| Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral) | verzerrt | 12.8 % | 86.8 % | 10.0 % | 2.8 | 0.43 | 0 |
| Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter) | sauber | 0.3 % | 100.0 % | 0.0 % | 8.3 | 1.68 | 0 |
| Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter) | verzerrt | 1.6 % | 89.5 % | 4.1 % | 5.8 | 1.06 | 0 |
| Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter) | sauber | 1.1 % | 100.0 % | 1.0 % | 5.6 | – | 0 |
| Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter) | verzerrt | 2.7 % | 89.5 % | 4.6 % | 4.8 | – | 0 |
| Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter) | sauber | 0.5 % | 96.8 % | 0.7 % | 5.6 | – | 0 |
| Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter) | verzerrt | 4.8 % | 88.2 % | 7.7 % | 5.3 | – | 0 |
| Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter) | sauber | 4.2 % | 94.7 % | 0.0 % | 10.8 | 3.54 | 1 |
| Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter) | verzerrt | 1.4 % | 94.7 % | 2.7 % | 12.8 | 3.81 | 0 |
| Gemma 4 31B (Angebot kvant, gemessen über OpenRouter) | sauber | 0.4 % | 97.9 % | 0.3 % | 22.9 | 0.14 | 0 |
| Gemma 4 31B (Angebot kvant, gemessen über OpenRouter) | verzerrt | 1.0 % | 96.1 % | 2.6 % | 17.9 | 0.12 | 0 |
| Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter) | sauber | 2.6 % | 96.8 % | 2.2 % | 9.2 | 0.81 | 0 |
| Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter) | verzerrt | 10.4 % | 77.6 % | 13.0 % | 9.7 | 0.59 | 0 |
| Llama 4 Scout (Angebot kvant, gemessen über OpenRouter) | sauber | – | – | – | – | – | 13 |
| Llama 4 Scout (Angebot kvant, gemessen über OpenRouter) | verzerrt | 3.6 % | 100.0 % | 3.5 % | 3.9 | 0.45 | 10 |
| Ministral 3 14B (Infomaniak) | sauber | 1.5 % | 80.9 % | 1.2 % | 17.8 | 1.08 | 0 |
| Ministral 3 14B (Infomaniak) | verzerrt | 12.1 % | 86.8 % | 9.3 % | 3.3 | 0.43 | 0 |
| Mistral Small 4 (Infomaniak) | sauber | 0.2 % | 98.9 % | 0.5 % | 1.3 | 0.54 | 0 |
| Mistral Small 4 (Infomaniak) | verzerrt | 8.7 % | 82.9 % | 8.4 % | 1.1 | 0.4 | 0 |
| Gemma 4 31B (Infomaniak) | sauber | 1.7 % | 96.8 % | 1.4 % | 4.0 | 0.18 | 0 |
| Gemma 4 31B (Infomaniak) | verzerrt | 1.1 % | 96.1 % | 2.7 % | 3.8 | 0.16 | 0 |
| Qwen3.5 122B (Infomaniak) | sauber | 0.0 % | 100.0 % | 0.2 % | 3.1 | 1.68 | 0 |
| Qwen3.5 122B (Infomaniak) | verzerrt | 1.0 % | 96.1 % | 3.2 % | 2.4 | 1.07 | 0 |
| Qwen3.5 397B (Infomaniak) | sauber | 0.4 % | 100.0 % | 0.0 % | 5.1 | 2.4 | 0 |
| Qwen3.5 397B (Infomaniak) | verzerrt | 0.7 % | 96.1 % | 2.4 % | 4.2 | 1.5 | 0 |
| Kimi K2.6 (Infomaniak) | sauber | 0.1 % | 100.0 % | 0.0 % | 2.5 | 2.07 | 0 |
| Kimi K2.6 (Infomaniak) | verzerrt | 0.9 % | 98.7 % | 0.9 % | 2.8 | 1.29 | 0 |
| Apertus 1.5 70B (Infomaniak) | sauber | 14.3 % | 48.9 % | 19.3 % | 5.4 | 4.52 | 0 |
| Apertus 1.5 70B (Infomaniak) | verzerrt | 43.0 % | 14.5 % | 55.1 % | 4.0 | 2.69 | 0 |

## echte Fotos

Handyfotos echter Belege, nur lokal (Personendaten); nur Felder, kein Referenztext.

| Modell | Fassung | Zeichenfehler | Felder gefunden | Erfundene Wörter | Sekunden/Seite | CHF/1000 Seiten | Fehler |
|---|---|---:|---:|---:|---:|---:|---:|
| Mistral OCR 4.1 (Referenz) | echt | – | 97.4 % | – | 2.6 | 3.28 | 0 |
| Mistral OCR 3 (halber Preis) | echt | – | 99.1 % | – | 2.7 | 1.64 | 0 |
| Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral) | echt | – | 88.6 % | – | 4.6 | 0.9 | 0 |
| Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral) | echt | – | 86.0 % | – | 5.6 | 0.95 | 0 |
| Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter) | echt | – | 100.0 % | – | 8.1 | 2.6 | 5 |
| Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter) | echt | – | 95.5 % | – | 7.0 | – | 4 |
| Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter) | echt | – | 100.0 % | – | 7.7 | – | 4 |
| Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter) | echt | – | 100.0 % | – | 25.5 | 6.15 | 7 |
| Gemma 4 31B (Angebot kvant, gemessen über OpenRouter) | echt | – | 98.2 % | – | 14.4 | 0.18 | 5 |
| Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter) | echt | – | 93.0 % | – | 8.4 | 1 | 6 |
| Llama 4 Scout (Angebot kvant, gemessen über OpenRouter) | echt | – | – | – | – | – | 10 |
| Ministral 3 14B (Infomaniak) | echt | – | 84.2 % | – | 8.2 | 0.94 | 0 |
| Mistral Small 4 (Infomaniak) | echt | – | 86.0 % | – | 2.1 | 0.86 | 0 |
| Gemma 4 31B (Infomaniak) | echt | – | 94.7 % | – | 7.0 | 0.27 | 0 |
| Qwen3.5 122B (Infomaniak) | echt | – | 99.1 % | – | 5.0 | 2.93 | 0 |
| Qwen3.5 397B (Infomaniak) | echt | – | 99.1 % | – | 9.8 | 4.26 | 0 |
| Kimi K2.6 (Infomaniak) | echt | – | 98.2 % | – | 4.2 | 3.72 | 0 |
| Apertus 1.5 70B (Infomaniak) | echt | – | 23.7 % | – | 14.5 | 7.63 | 0 |

## ParseBench

30 Tabellenseiten aus ParseBench (Apache-2.0): Zellen mit Zahlen als Felder, kein Referenztext für die ganze Seite.

| Modell | Fassung | Zeichenfehler | Felder gefunden | Erfundene Wörter | Sekunden/Seite | CHF/1000 Seiten | Fehler |
|---|---|---:|---:|---:|---:|---:|---:|
| Mistral OCR 4.1 (Referenz) | sauber | – | 94.0 % | – | 3.9 | 3.28 | 0 |
| Mistral OCR 4.1 (Referenz) | verzerrt | – | 90.8 % | – | 3.0 | 3.28 | 0 |
| Mistral OCR 3 (halber Preis) | sauber | – | 89.6 % | – | 5.3 | 1.64 | 0 |
| Mistral OCR 3 (halber Preis) | verzerrt | – | 87.3 % | – | 5.0 | 1.64 | 0 |
| Ministral 3 14B (Infomaniak) | sauber | – | 81.1 % | – | 44.9 | 2.29 | 0 |
| Ministral 3 14B (Infomaniak) | verzerrt | – | 72.4 % | – | 29.5 | 1.4 | 0 |
| Mistral Small 4 (Infomaniak) | sauber | – | 84.6 % | – | 5.7 | 1.88 | 0 |
| Mistral Small 4 (Infomaniak) | verzerrt | – | 70.5 % | – | 4.3 | 1.3 | 0 |
| Gemma 4 31B (Infomaniak) | sauber | – | 86.2 % | – | 37.4 | 1.18 | 0 |
| Gemma 4 31B (Infomaniak) | verzerrt | – | 70.7 % | – | 22.0 | 0.73 | 0 |
| Qwen3.5 122B (Infomaniak) | sauber | – | 95.9 % | – | 25.7 | 10.76 | 0 |
| Qwen3.5 122B (Infomaniak) | verzerrt | – | 81.3 % | – | 26.1 | 9.57 | 0 |
| Qwen3.5 397B (Infomaniak) | sauber | – | 95.4 % | – | 45.1 | 12.91 | 0 |
| Qwen3.5 397B (Infomaniak) | verzerrt | – | 81.1 % | – | 47.4 | 13.01 | 0 |
| Kimi K2.6 (Infomaniak) | sauber | – | 97.5 % | – | 7.2 | 8.23 | 0 |
| Kimi K2.6 (Infomaniak) | verzerrt | – | 79.7 % | – | 4.9 | 4.29 | 0 |

## Schweiz

Erfundene Schweizer Dokumente (ch-docs.ts): QR-Rechnungen, Lohnausweis, Steuerrechnung, Leistungsabrechnung, zweispaltige Police, Notiz in Schreibschrift.

| Modell | Fassung | Zeichenfehler | Felder gefunden | Erfundene Wörter | Sekunden/Seite | CHF/1000 Seiten | Fehler |
|---|---|---:|---:|---:|---:|---:|---:|
| Mistral OCR 4.1 (Referenz) | sauber | 0.6 % | 100.0 % | 0.3 % | 1.3 | 3.28 | 0 |
| Mistral OCR 4.1 (Referenz) | verzerrt | 0.8 % | 100.0 % | 0.0 % | 1.4 | 3.28 | 0 |
| Mistral OCR 3 (halber Preis) | sauber | 1.9 % | 100.0 % | 0.0 % | 2.1 | 1.64 | 0 |
| Mistral OCR 3 (halber Preis) | verzerrt | 2.6 % | 100.0 % | 0.9 % | 1.9 | 1.64 | 0 |
| Ministral 3 14B (Infomaniak) | sauber | 5.3 % | 100.0 % | 0.8 % | 5.0 | 0.84 | 0 |
| Ministral 3 14B (Infomaniak) | verzerrt | 5.8 % | 100.0 % | 1.2 % | 4.4 | 0.64 | 0 |
| Mistral Small 4 (Infomaniak) | sauber | 8.0 % | 100.0 % | 0.7 % | 2.5 | 0.75 | 0 |
| Mistral Small 4 (Infomaniak) | verzerrt | 5.9 % | 94.9 % | 2.4 % | 2.4 | 0.62 | 0 |
| Gemma 4 31B (Infomaniak) | sauber | 7.2 % | 98.3 % | 0.3 % | 5.5 | 0.22 | 0 |
| Gemma 4 31B (Infomaniak) | verzerrt | 9.9 % | 100.0 % | 1.4 % | 5.8 | 0.22 | 0 |
| Qwen3.5 122B (Infomaniak) | sauber | 3.0 % | 100.0 % | 0.2 % | 3.9 | 2.1 | 0 |
| Qwen3.5 122B (Infomaniak) | verzerrt | 3.2 % | 100.0 % | 0.6 % | 3.8 | 1.74 | 0 |
| Qwen3.5 397B (Infomaniak) | sauber | 3.2 % | 100.0 % | 0.0 % | 6.0 | 3.14 | 0 |
| Qwen3.5 397B (Infomaniak) | verzerrt | 2.9 % | 100.0 % | 0.2 % | 5.8 | 2.35 | 0 |
| Kimi K2.6 (Infomaniak) | sauber | 2.8 % | 100.0 % | 0.0 % | 2.6 | 2.78 | 0 |
| Kimi K2.6 (Infomaniak) | verzerrt | 3.6 % | 100.0 % | 1.2 % | 1.9 | 2.01 | 0 |

## Nicht gefundene Felder (ohne ParseBench)

- Mistral OCR 4.1 (Referenz), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Mistral OCR 4.1 (Referenz), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456, 92'300
- Mistral OCR 4.1 (Referenz), fahrzeugausweis (sauber): 8600, 4000, 12600
- Mistral OCR 4.1 (Referenz), echt-07-rechnung-de-quer (echt): 3 von 9 Feldern
- Mistral OCR 3 (halber Preis), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Mistral OCR 3 (halber Preis), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Mistral OCR 3 (halber Preis), fahrzeugausweis (sauber): GESELLSCHAFTSWAGEN, GELB
- Mistral OCR 3 (halber Preis), echt-06-quittung-quer (echt): 1 von 10 Feldern
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), rechnung-de (verzerrt): SM-2024-001, DE89 3704 0044 0532 0130 00
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), mietvertrag (verzerrt): Hohenzollernstr. 15
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), werkstatt-de-quer (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 187,50, 486,90
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), kaufvertrag (verzerrt): WVWZZZ1KZMP012345
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), serviceheft (verzerrt): WVWZZZ1KZMP012345
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), rechnung-ch-foto (verzerrt): 03.03.2025, TMBJJ7NE5L0123456, 92'300
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), rechnung-ch-scan (verzerrt): TMBJJ7NE5L0123456
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), fahrzeugausweis (sauber): GESELLSCHAFTSWAGEN, 12600, A10
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), echt-02-quittung-quer (echt): 3 von 8 Feldern
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), echt-04-quittung-quer-dunkel (echt): 1 von 11 Feldern
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), echt-05-quittung-quer (echt): 2 von 13 Feldern
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), echt-06-quittung-quer (echt): 1 von 10 Feldern
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), echt-07-rechnung-de-quer (echt): 2 von 9 Feldern
- Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral), echt-08-rechnung-at-quer (echt): 4 von 10 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), mietvertrag (verzerrt): Hohenzollernstr. 15
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), arztbrief (verzerrt): 38,2
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), kaufvertrag (verzerrt): WVWZZZ1KZMP012345
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), werkstatt-de-quer (verzerrt): 2024-0847, M-AB 1234, 187,50, 486,90
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), serviceheft (verzerrt): WVWZZZ1KZMP012345
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), fahrzeugausweis (sauber): HEIDIPOST, VETERANENFAHRZEUG, GESELLSCHAFTSWAGEN, SAURER 3 DUX, 2 100 728, 180.88.125, 10300, 8600, 4000, 12600, 03.64, 17.12.02/10M, 09.02/BS, 11.11.2002, 405260, A10, GELB, 52,46
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-03-quittung-quer (echt): 1 von 11 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-02-quittung-quer (echt): 1 von 8 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-04-quittung-quer-dunkel (echt): 1 von 11 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-05-quittung-quer (echt): 3 von 13 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-07-rechnung-de-quer (echt): 3 von 9 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-06-quittung-quer (echt): 3 von 10 Feldern
- Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral), echt-08-rechnung-at-quer (echt): 4 von 10 Feldern
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): M-AB 1234, 187,50, 486,90
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), serviceheft (verzerrt): WVWZZZ1KZMP012345, 28.400
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): 92'300, 561.00
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 2024-0847, M-AB 1234, 187,50, 486,90
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): 25-1182, TMBJJ7NE5L0123456, 92'300
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 3 von 10 Feldern
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 15.01.2025, M-AB 1234, 47.500, 486,90
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), serviceheft (verzerrt): WVWZZZ1KZMP012345, 28.400
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456, 561.00
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), fahrzeugausweis (sauber): 4000
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 15.01.2025, M-AB 1234, 486,90
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), rechnung-de (verzerrt): SM-2024-001, DE89 3704 0044 0532 0130 00
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), fahrzeugausweis (sauber): GESELLSCHAFTSWAGEN
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-05-quittung-quer (echt): 1 von 13 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), mietvertrag (verzerrt): 01.02.2025, Hohenzollernstr. 15
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), werkstatt-de (verzerrt): 486,90
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 47.500, 187,50, 486,90
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), serviceheft (verzerrt): 15.200
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): 25-1182, CHE-123.456.789, TMBJJ7NE5L0123456, 92'300, 561.00, 606.45
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), fahrzeugausweis (sauber): HEIDIPOST
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-01-quittung (echt): 1 von 13 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-02-quittung-quer (echt): 1 von 8 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-04-quittung-quer-dunkel (echt): 1 von 11 Feldern
- Ministral 3 14B (Infomaniak), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Ministral 3 14B (Infomaniak), mietvertrag (verzerrt): Hohenzollernstr. 15
- Ministral 3 14B (Infomaniak), arztbrief (verzerrt): 38,2
- Ministral 3 14B (Infomaniak), werkstatt-de-quer (verzerrt): 2024-0847, M-AB 1234, 187,50, 486,90
- Ministral 3 14B (Infomaniak), kaufvertrag (verzerrt): WVWZZZ1KZMP012345
- Ministral 3 14B (Infomaniak), serviceheft (verzerrt): WVWZZZ1KZMP012345
- Ministral 3 14B (Infomaniak), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Ministral 3 14B (Infomaniak), echt-02-quittung-quer (echt): 2 von 8 Feldern
- Ministral 3 14B (Infomaniak), echt-03-quittung-quer (echt): 1 von 11 Feldern
- Ministral 3 14B (Infomaniak), echt-05-quittung-quer (echt): 4 von 13 Feldern
- Ministral 3 14B (Infomaniak), echt-07-rechnung-de-quer (echt): 5 von 9 Feldern
- Ministral 3 14B (Infomaniak), echt-08-rechnung-at-quer (echt): 4 von 10 Feldern
- Ministral 3 14B (Infomaniak), echt-06-quittung-quer (echt): 2 von 10 Feldern
- Ministral 3 14B (Infomaniak), fahrzeugausweis (sauber): HEIDIPOST, VETERANENFAHRZEUG, GESELLSCHAFTSWAGEN, SAURER 3 DUX, 2 100 728, 180.88.125, 10300, 8600, 4000, 12600, 03.64, 17.12.02/10M, 09.02/BS, 11.11.2002, 405260, A10, GELB, 52,46
- Mistral Small 4 (Infomaniak), rechnung-de (verzerrt): SM-2024-001, DE89 3704 0044 0532 0130 00
- Mistral Small 4 (Infomaniak), mietvertrag (verzerrt): Hohenzollernstr. 15
- Mistral Small 4 (Infomaniak), werkstatt-de-quer (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 187,50, 486,90
- Mistral Small 4 (Infomaniak), kaufvertrag (verzerrt): WVWZZZ1KZMP012345
- Mistral Small 4 (Infomaniak), serviceheft (verzerrt): WVWZZZ1KZMP012345
- Mistral Small 4 (Infomaniak), rechnung-ch-foto (verzerrt): 03.03.2025, TMBJJ7NE5L0123456, 92'300
- Mistral Small 4 (Infomaniak), echt-02-quittung-quer (echt): 1 von 8 Feldern
- Mistral Small 4 (Infomaniak), echt-03-quittung-quer (echt): 2 von 11 Feldern
- Mistral Small 4 (Infomaniak), echt-04-quittung-quer-dunkel (echt): 2 von 11 Feldern
- Mistral Small 4 (Infomaniak), echt-06-quittung-quer (echt): 3 von 10 Feldern
- Mistral Small 4 (Infomaniak), echt-07-rechnung-de-quer (echt): 3 von 9 Feldern
- Mistral Small 4 (Infomaniak), echt-08-rechnung-at-quer (echt): 5 von 10 Feldern
- Mistral Small 4 (Infomaniak), ch-lohnausweis (verzerrt): 6'500, 1'200
- Mistral Small 4 (Infomaniak), ch-notiz-schreibschrift (verzerrt): CH93 0076 2011 6238 5295 7
- Gemma 4 31B (Infomaniak), rechnung-de (verzerrt): SM-2024-001, DE89 3704 0044 0532 0130 00
- Gemma 4 31B (Infomaniak), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Gemma 4 31B (Infomaniak), fahrzeugausweis (sauber): HEIDIPOST, 2 100 728
- Gemma 4 31B (Infomaniak), echt-05-quittung-quer (echt): 1 von 13 Feldern
- Gemma 4 31B (Infomaniak), echt-07-rechnung-de-quer (echt): 1 von 9 Feldern
- Gemma 4 31B (Infomaniak), echt-08-rechnung-at-quer (echt): 4 von 10 Feldern
- Gemma 4 31B (Infomaniak), ch-notiz-schreibschrift (sauber): CH93 0076 2011 6238 5295 7
- Qwen3.5 122B (Infomaniak), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3.5 122B (Infomaniak), werkstatt-de-quer (verzerrt): M-AB 1234, 486,90
- Qwen3.5 122B (Infomaniak), echt-08-rechnung-at-quer (echt): 1 von 10 Feldern
- Qwen3.5 397B (Infomaniak), werkstatt-de-quer (verzerrt): 187,50, 486,90
- Qwen3.5 397B (Infomaniak), serviceheft (verzerrt): WVWZZZ1KZMP012345
- Qwen3.5 397B (Infomaniak), echt-08-rechnung-at-quer (echt): 1 von 10 Feldern
- Kimi K2.6 (Infomaniak), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Kimi K2.6 (Infomaniak), echt-07-rechnung-de-quer (echt): 1 von 9 Feldern
- Kimi K2.6 (Infomaniak), echt-09-abrechnung-at (echt): 1 von 13 Feldern
- Apertus 1.5 70B (Infomaniak), rechnung-de (verzerrt): SM-2024-001, 15.11.2024, 12345678, 91,20, 127,50, DE89 3704 0044 0532 0130 00
- Apertus 1.5 70B (Infomaniak), mietvertrag (verzerrt): 250,00, 3.600,00, 01.02.2025, 15.01.2025, Hohenzollernstr. 15
- Apertus 1.5 70B (Infomaniak), arztbrief (verzerrt): J06.9, A123456789, 15.03.1985, 38,2
- Apertus 1.5 70B (Infomaniak), werkstatt-de (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 47.500, 187,50, 486,90
- Apertus 1.5 70B (Infomaniak), werkstatt-de-quer (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 47.500, 187,50, 486,90
- Apertus 1.5 70B (Infomaniak), kaufvertrag (verzerrt): WVWZZZ1KZMP012345, B-HS 4321, 38.500, 22.500,00, 20.01.2025, 03/2021
- Apertus 1.5 70B (Infomaniak), serviceheft (verzerrt): WVWZZZ1KZMP012345, 15.03.2022, 15.200, 28.400, 10.06.2024, 90.000
- Apertus 1.5 70B (Infomaniak), rechnung-ch-foto (verzerrt): 25-1182, 03.03.2025, CHE-123.456.789, TMBJJ7NE5L0123456, 92'300, ZH 123456, 561.00, 45.45, 606.45
- Apertus 1.5 70B (Infomaniak), rechnung-ch-scan (verzerrt): 25-1182, 03.03.2025, TMBJJ7NE5L0123456, 561.00, 45.45
- Apertus 1.5 70B (Infomaniak), sammel-1 (verzerrt): R-4471, 28.10.2024, 148.00
- Apertus 1.5 70B (Infomaniak), sammel-2 (verzerrt): 88213, 17.04.2025, 14.04.2025, 49'850, 34.60
- Apertus 1.5 70B (Infomaniak), sammel-3 (verzerrt): 210.00, 1291.00, 104.55, 1395.55
- Apertus 1.5 70B (Infomaniak), echt-01-quittung (echt): 7 von 13 Feldern
- Apertus 1.5 70B (Infomaniak), echt-02-quittung-quer (echt): 8 von 8 Feldern
- Apertus 1.5 70B (Infomaniak), echt-03-quittung-quer (echt): 11 von 11 Feldern
- Apertus 1.5 70B (Infomaniak), echt-04-quittung-quer-dunkel (echt): 8 von 11 Feldern
- Apertus 1.5 70B (Infomaniak), echt-05-quittung-quer (echt): 13 von 13 Feldern
- Apertus 1.5 70B (Infomaniak), echt-06-quittung-quer (echt): 9 von 10 Feldern
- Apertus 1.5 70B (Infomaniak), echt-07-rechnung-de-quer (echt): 7 von 9 Feldern
- Apertus 1.5 70B (Infomaniak), echt-08-rechnung-at-quer (echt): 10 von 10 Feldern
- Apertus 1.5 70B (Infomaniak), echt-09-abrechnung-at (echt): 6 von 13 Feldern
- Apertus 1.5 70B (Infomaniak), echt-10-rechnung-at (echt): 8 von 16 Feldern
- Apertus 1.5 70B (Infomaniak), fahrzeugausweis (sauber): VETERANENFAHRZEUG, GESELLSCHAFTSWAGEN, SAURER 3 DUX, 2 100 728, 180.88.125, 10300, 8600, 4000, 12600, 03.64, 17.12.02/10M, 09.02/BS, 11.11.2002, 405260, A10, GELB, 52,46
