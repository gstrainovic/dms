# OCR-Vergleich

Erzeugt von `summary.ts` aus `results.json`. Künstliche Seiten: 13, je sauber und verzerrt (Fahrzeugausweis nur sauber); echte Handyfotos: 10 (nur Felder, keine Referenztexte).

| Modell | Fassung | Zeichenfehler | Felder gefunden | Erfundene Wörter | Sekunden/Seite | CHF/1000 Seiten | Fehler |
|---|---|---:|---:|---:|---:|---:|---:|
| Mistral OCR 4.1 (Referenz) | echt | – | 97.4 % | – | 2.6 | 3.28 | 0 |
| Mistral OCR 4.1 (Referenz) | sauber | 0.5 % | 96.8 % | 0.1 % | 1.2 | 3.28 | 0 |
| Mistral OCR 4.1 (Referenz) | verzerrt | 0.9 % | 96.1 % | 1.3 % | 1.1 | 3.28 | 0 |
| Mistral OCR 3 (halber Preis) | echt | – | 99.1 % | – | 2.7 | 1.64 | 0 |
| Mistral OCR 3 (halber Preis) | sauber | 0.5 % | 97.9 % | 0.2 % | 1.7 | 1.64 | 0 |
| Mistral OCR 3 (halber Preis) | verzerrt | 0.6 % | 97.4 % | 0.8 % | 1.4 | 1.64 | 0 |
| Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral) | echt | – | 88.6 % | – | 4.6 | 0.9 | 0 |
| Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral) | sauber | 0.2 % | 94.7 % | 0.5 % | 2.1 | 0.56 | 0 |
| Mistral Small 4 (Angebot Infomaniak, gemessen bei Mistral) | verzerrt | 10.4 % | 81.6 % | 9.4 % | 2.1 | 0.4 | 0 |
| Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral) | echt | – | 86.0 % | – | 5.6 | 0.95 | 0 |
| Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral) | sauber | 1.8 % | 80.9 % | 1.2 % | 2.5 | 0.6 | 0 |
| Ministral 3 14B (Angebot Infomaniak, gemessen bei Mistral) | verzerrt | 12.8 % | 86.8 % | 10.0 % | 2.8 | 0.43 | 0 |
| Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter) | echt | – | 100.0 % | – | 8.1 | 2.6 | 5 |
| Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter) | sauber | 0.3 % | 100.0 % | 0.0 % | 8.3 | 1.68 | 0 |
| Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter) | verzerrt | 1.6 % | 89.5 % | 4.1 % | 5.8 | 1.06 | 0 |
| Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter) | echt | – | 95.5 % | – | 7.0 | – | 4 |
| Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter) | sauber | 1.1 % | 100.0 % | 1.0 % | 5.6 | – | 0 |
| Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter) | verzerrt | 2.7 % | 89.5 % | 4.6 % | 4.8 | – | 0 |
| Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter) | echt | – | 100.0 % | – | 7.7 | – | 4 |
| Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter) | sauber | 0.5 % | 96.8 % | 0.7 % | 5.6 | – | 0 |
| Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter) | verzerrt | 4.8 % | 88.2 % | 7.7 % | 5.3 | – | 0 |
| Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter) | echt | – | 100.0 % | – | 43.3 | 11.18 | 5 |
| Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter) | sauber | 4.2 % | 95.7 % | 0.0 % | 16.5 | 6.24 | 0 |
| Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter) | verzerrt | 1.4 % | 94.7 % | 2.7 % | 12.8 | 3.81 | 0 |
| Gemma 4 31B (Angebot kvant, gemessen über OpenRouter) | echt | – | 98.2 % | – | 14.4 | 0.18 | 5 |
| Gemma 4 31B (Angebot kvant, gemessen über OpenRouter) | sauber | 0.4 % | 97.9 % | 0.3 % | 22.9 | 0.14 | 0 |
| Gemma 4 31B (Angebot kvant, gemessen über OpenRouter) | verzerrt | 1.3 % | 96.1 % | 2.6 % | 18.7 | 0.22 | 0 |
| Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter) | echt | – | 93.0 % | – | 8.4 | 1 | 6 |
| Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter) | sauber | 2.6 % | 96.8 % | 2.2 % | 9.2 | 0.81 | 0 |
| Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter) | verzerrt | 10.4 % | 77.6 % | 13.0 % | 9.7 | 0.59 | 0 |
| Llama 4 Scout (Angebot kvant, gemessen über OpenRouter) | echt | – | – | – | – | – | 10 |
| Llama 4 Scout (Angebot kvant, gemessen über OpenRouter) | sauber | – | – | – | – | – | 13 |
| Llama 4 Scout (Angebot kvant, gemessen über OpenRouter) | verzerrt | 3.6 % | 100.0 % | 3.5 % | 3.9 | 0.45 | 10 |

## Nicht gefundene Felder (verzerrt, echt, Fahrzeugausweis)

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
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 10 von 10 Feldern
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Qwen3-VL 235B (Angebot kvant, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 2024-0847, M-AB 1234, 187,50, 486,90
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): 25-1182, TMBJJ7NE5L0123456, 92'300
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 3 von 10 Feldern
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Qwen3-VL 32B (selbst betreibbar, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 15.01.2025, M-AB 1234, 47.500, 486,90
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), serviceheft (verzerrt): WVWZZZ1KZMP012345, 28.400
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456, 561.00
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), fahrzeugausweis (sauber): 4000
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Qwen3-VL 8B (selbst betreibbar, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), rechnung-de (verzerrt): DE89 3704 0044 0532 0130 00
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 15.01.2025, M-AB 1234, 486,90
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 10 von 10 Feldern
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Qwen3.5 122B (Angebot Infomaniak, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), rechnung-de (verzerrt): SM-2024-001, DE89 3704 0044 0532 0130 00
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): TMBJJ7NE5L0123456
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), fahrzeugausweis (sauber): GESELLSCHAFTSWAGEN
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-05-quittung-quer (echt): 1 von 13 Feldern
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 10 von 10 Feldern
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Gemma 4 31B (Angebot kvant, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
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
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-05-quittung-quer (echt): 13 von 13 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 10 von 10 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Llama 4 Maverick (Angebot kvant, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), rechnung-de (verzerrt): SM-2024-001, 15.11.2024, 12345678, 91,20, 127,50, DE89 3704 0044 0532 0130 00
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), mietvertrag (verzerrt): 1.200,00, 250,00, 3.600,00, 01.02.2025, 15.01.2025, Hohenzollernstr. 15
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), arztbrief (verzerrt): 10.12.2024, J06.9, A123456789, 15.03.1985, 38,2, 13.12.2024
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), werkstatt-de (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 47.500, 187,50, 486,90
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), werkstatt-de-quer (verzerrt): 2024-0847, 15.01.2025, M-AB 1234, 47.500, 187,50, 486,90
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), kaufvertrag (verzerrt): WVWZZZ1KZMP012345, B-HS 4321, 38.500, 22.500,00, 20.01.2025, 03/2021
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), serviceheft (verzerrt): WVWZZZ1KZMP012345, 15.03.2022, 15.200, 28.400, 10.06.2024, 90.000
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), rechnung-ch-foto (verzerrt): 25-1182, 03.03.2025, CHE-123.456.789, TMBJJ7NE5L0123456, 92'300, ZH 123456, 561.00, 45.45, 606.45
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), rechnung-ch-scan (verzerrt): 25-1182, 03.03.2025, CHE-123.456.789, TMBJJ7NE5L0123456, 92'300, ZH 123456, 561.00, 45.45, 606.45
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), sammel-1 (verzerrt): R-4471, 28.10.2024, 41'200, 60.00, 148.00
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), fahrzeugausweis (sauber): HEIDIPOST, VETERANENFAHRZEUG, GESELLSCHAFTSWAGEN, SAURER 3 DUX, 2 100 728, 180.88.125, 10300, 8600, 4000, 12600, 03.64, 17.12.02/10M, 09.02/BS, 11.11.2002, 405260, A10, GELB, 52,46
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-01-quittung (echt): 13 von 13 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-02-quittung-quer (echt): 8 von 8 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-03-quittung-quer (echt): 11 von 11 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-04-quittung-quer-dunkel (echt): 11 von 11 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-05-quittung-quer (echt): 13 von 13 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-06-quittung-quer (echt): 10 von 10 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-07-rechnung-de-quer (echt): 9 von 9 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-08-rechnung-at-quer (echt): 10 von 10 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-09-abrechnung-at (echt): 13 von 13 Feldern
- Llama 4 Scout (Angebot kvant, gemessen über OpenRouter), echt-10-rechnung-at (echt): 16 von 16 Feldern
