/**
 * AI-Proxy als Edge Function: Mistral-Key serverseitig, Nutzungszählung, Plan-Limits, Stripe.
 * Code kommt gepinnt aus dem Repo gstrainovic/ai-proxy (Tag). Bei Updates Tag hier und in deno.json prüfen.
 * Routen: /functions/v1/ai-proxy/{health, v1/chat/completions, v1/ocr, v1/embeddings, me/usage, billing/*, stripe/webhook}
 */
import { createEdgeApp } from 'https://raw.githubusercontent.com/gstrainovic/ai-proxy/v0.2.0/src/edge.ts'
import { DMS_PLANS } from '../_shared/plans.ts'

const app = createEdgeApp(Deno.env.toObject(), { plans: DMS_PLANS, functionName: 'ai-proxy' })

Deno.serve(app.fetch)
