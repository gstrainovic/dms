import type { Price } from './summary.ts'

/**
 * Preise in CHF ohne MWST, abgerufen am 22.09.2026. Tokens pro Seite misst run.ts beim selben Modell (gleicher
 * Tokenizer); wie ein Schweizer Host Bilder vorverarbeitet, ist nicht dokumentiert, darum mit echten Seiten dort
 * nachmessen, bevor ein Anbieter gewählt wird. USD in CHF zum EZB-Kurs vom 22.09.2026: 1 USD = 0.8194 CHF.
 *
 * Quellen:
 * - Mistral: https://mistral.ai/pricing/api/ (OCR 4.1: 4 USD pro 1000 Seiten, OCR 3: 2 USD, im Batch je die Hälfte);
 *   bestätigt durch die Abrechnung von wartungsheft (462 Seiten, 1.85 USD)
 * - Infomaniak AI Services: https://www.infomaniak.com/en/hosting/ai-services/prices, keine Grundgebühr
 * - kvant/Phoeniqs: https://documentation.kvant.cloud/maas/active-models/, Grundgebühr CHF 50 pro Monat (als
 *   Guthaben, verfällt am Monatsende)
 * Selbst betriebene Qwen3-VL 32B/8B: GPU-Stundenpreis statt Tokens, siehe AGENTS.md; hier ohne Preis.
 */
const USD_CHF = 0.8194

export const PRICES: Record<string, Price> = {
  'mistral-ocr': { chfPerPage: (4 / 1000) * USD_CHF },   // mistral-ocr-latest = OCR 4.1 (Alias laut /v1/models)
  'mistral-ocr-3': { chfPerPage: (2 / 1000) * USD_CHF }, // mistral-ocr-2512
  'mistral-small': { inputChfPerM: 0.20, outputChfPerM: 0.75 },   // Infomaniak Mistral-Small-4-119B
  'ministral-14b': { inputChfPerM: 0.30, outputChfPerM: 0.40 },   // Infomaniak Ministral-3-14B
  'qwen3.5-122b': { inputChfPerM: 0.40, outputChfPerM: 3.20 },    // Infomaniak Qwen3.5-122B
  'qwen3-vl-235b': { inputChfPerM: 0.7003, outputChfPerM: 2.0 },  // kvant Qwen3-VL-235B
  'gemma-4-31b': { inputChfPerM: 0.118, outputChfPerM: 0.325 },   // kvant Gemma 4 31B
  'llama-4-maverick': { inputChfPerM: 0.2693, outputChfPerM: 1.0773 }, // kvant
  'llama-4-scout': { inputChfPerM: 0.1924, outputChfPerM: 0.6387 },    // kvant
}
