/**
 * Zugriff der Edge Functions auf Mistral, immer über die Edge Function `ai-proxy`
 * (zählt Verbrauch, setzt Plan-Limits durch, hält den Mistral-Key).
 *
 * Zwei Aufrufarten:
 * - als Nutzer: Authorization-Header des Requests durchreichen (chat, search)
 * - als Service im Namen eines Nutzers: Service-Role-Key + x-user-id (Pipeline ohne Nutzer-Session)
 */
const AI_PROXY_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-proxy`

export class AiProxyError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'AiProxyError'
  }
}

export function aiFetchAsUser(path: string, authHeader: string, body: unknown): Promise<Response> {
  return fetch(`${AI_PROXY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify(body),
  })
}

export function aiFetchAsService(path: string, userId: string, body: unknown): Promise<Response> {
  return fetch(`${AI_PROXY_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'x-user-id': userId,
    },
    body: JSON.stringify(body),
  })
}

/** Liest die Fehlermeldung im Mistral-/Proxy-Format aus einer Antwort. */
async function errorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  try {
    const parsed = JSON.parse(text)
    return parsed.message ?? parsed.error?.message ?? parsed.error ?? text
  } catch {
    return text
  }
}

/**
 * Antwort als JSON, oder Fehler mit nutzbarer Meldung.
 * 402 (Limit erreicht) wird unverändert durchgereicht, damit der Text im UI erscheint.
 */
export async function aiJson(response: Response, context: string): Promise<any> {
  if (response.ok) return response.json()
  const message = await errorMessage(response)
  if (response.status === 402) throw new AiProxyError(message, 402)
  throw new AiProxyError(`${context} fehlgeschlagen (${response.status}): ${message}`, response.status)
}

/** Nur das Limit ist ein harter Fehler; andere Fehler behandelt der Aufrufer selbst (z. B. optionaler Schritt). */
export async function ensureNotLimited(response: Response): Promise<Response> {
  if (response.status === 402) throw new AiProxyError(await errorMessage(response), 402)
  return response
}
