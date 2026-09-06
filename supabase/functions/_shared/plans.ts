/**
 * Plan-Katalog des DMS. Wird vom ai-proxy durchgesetzt und über /me/usage ans Frontend geliefert.
 * Limits pro Monat: ocrPages = Seiten, die an Mistral OCR gehen (lokal extrahierte PDFs zählen nicht),
 * chatTokens = Tokens für Chat, Auswertung und Embeddings.
 * Preise stehen auch in apps/dms/src/views/PricingView.vue, beides zusammen ändern.
 */
export interface DmsPlan {
  id: string
  name: string
  priceChfPerMonth: number
  limits: { ocrPages: number, chatTokens: number }
}

export const DMS_PLANS: { plans: Record<string, DmsPlan>, defaultPlan: string } = {
  defaultPlan: 'starter',
  plans: {
    starter: {
      id: 'starter',
      name: 'Starter',
      priceChfPerMonth: 0,
      limits: { ocrPages: 100, chatTokens: 500_000 },
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      priceChfPerMonth: 19,
      limits: { ocrPages: 2_000, chatTokens: 10_000_000 },
    },
  },
}
