/**
 * AI-Proxy als Edge Function: Mistral-Key serverseitig, Nutzungszählung, Plan-Limits, Stripe.
 * Code kommt aus dem Repo gstrainovic/ai-proxy, gepinnt auf einen Commit-Hash (Tag v0.2.0), weil Tags verschiebbar sind.
 * Update: neuen Commit-Hash eintragen, deno.json abgleichen, Edge Runtime neu starten.
 * Routen: /functions/v1/ai-proxy/{health, v1/chat/completions, v1/ocr, v1/embeddings, me/usage, billing/*, stripe/webhook}
 */
import { createEdgeApp } from 'https://raw.githubusercontent.com/gstrainovic/ai-proxy/cd0dee431dd285dcbab2bfc1d3676af709c29638/src/edge.ts'
import { DMS_PLANS } from '../_shared/plans.ts'

const app = createEdgeApp(Deno.env.toObject(), { plans: DMS_PLANS, functionName: 'ai-proxy' })

Deno.serve(app.fetch)
