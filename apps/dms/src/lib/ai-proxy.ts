/**
 * Client für die Edge Function `ai-proxy`: Plan, Verbrauch, Limits und Stripe-Checkout des angemeldeten Nutzers.
 * Der Proxy liefert den Plan-Katalog mit, das Frontend hält keine eigene Kopie der Pläne.
 */
import { supabase } from './supabase'

const AI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`

export type LimitKind = 'ocrPages' | 'chatTokens'

export interface PlanInfo {
  id: string
  name: string
  priceChfPerMonth: number
  limits: Record<LimitKind, number>
}

export interface UsageInfo {
  plan: string
  month: string
  usage: Record<LimitKind, number>
  limits: Record<LimitKind, number>
  plans: Record<string, PlanInfo>
}

export const LIMIT_LABELS: Record<LimitKind, string> = {
  ocrPages: 'Texterkennung (Seiten)',
  chatTokens: 'KI-Tokens',
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Nicht angemeldet')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function proxyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${AI_PROXY_URL}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init.headers as Record<string, string> | undefined) },
  })
}

async function errorText(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({})) as { error?: { message?: string } | string, message?: string }
  if (typeof body.error === 'string') return body.error
  return body.error?.message ?? body.message ?? `${fallback} (${res.status})`
}

export async function fetchUsage(): Promise<UsageInfo> {
  const res = await proxyFetch('/me/usage')
  if (!res.ok) throw new Error(await errorText(res, 'Nutzung konnte nicht geladen werden'))
  return res.json()
}

/** Startet Stripe Checkout und liefert die URL, zu der weitergeleitet wird. */
export async function startCheckout(plan: string): Promise<string> {
  const res = await proxyFetch('/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
  const body = await res.json().catch(() => ({})) as { url?: string }
  if (!res.ok || !body.url) throw new Error(await errorText(new Response(JSON.stringify(body), { status: res.status }), 'Checkout nicht möglich'))
  return body.url
}

/** Öffnet das Stripe-Kundenportal (Abo ändern oder kündigen). */
export async function openPortal(): Promise<string> {
  const res = await proxyFetch('/billing/portal', { method: 'POST' })
  const body = await res.json().catch(() => ({})) as { url?: string }
  if (!res.ok || !body.url) throw new Error(await errorText(new Response(JSON.stringify(body), { status: res.status }), 'Kundenportal nicht verfügbar'))
  return body.url
}
