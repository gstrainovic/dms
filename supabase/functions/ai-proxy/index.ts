/**
 * AI-Proxy als Edge Function: Mistral-Key serverseitig, Nutzungszählung, Testzeit, Plan-Limits, Stripe.
 * Code kommt aus dem Repo gstrainovic/ai-proxy, gepinnt auf einen Commit-Hash (Tag v0.3.0), weil Tags verschiebbar sind.
 * Update: neuen Commit-Hash eintragen, deno.json abgleichen, Edge Runtime neu starten.
 * Routen: /functions/v1/ai-proxy/{health, v1/chat/completions, v1/ocr, v1/embeddings, me/usage, billing/*, stripe/webhook}
 *
 * Konto im Proxy ist die Organisation: Verbrauch, Testzeit und Abo gelten für alle Mitglieder gemeinsam.
 * Pipeline-Functions geben die Organisation des Dokuments direkt in x-user-id an.
 */
import { createClient } from '@supabase/supabase-js'
import { createEdgeApp } from 'https://raw.githubusercontent.com/gstrainovic/ai-proxy/6749188a96f3f16cb61a9869e6a0ad46f81e6d36/src/edge.ts'
import { DMS_PLANS } from '../_shared/plans.ts'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function organizationOf(user: { id: string }): Promise<string | null> {
  const { data, error } = await db.from('organization_members').select('org_id').eq('user_id', user.id).maybeSingle()
  if (error) throw new Error(`Organisation lesen fehlgeschlagen: ${error.message}`)
  return data?.org_id ?? null
}

const app = createEdgeApp(Deno.env.toObject(), { plans: DMS_PLANS, functionName: 'ai-proxy', accountOf: organizationOf })

Deno.serve(app.fetch)
