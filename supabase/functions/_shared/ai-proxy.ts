/**
 * Zugriff der Edge Functions auf Mistral, immer über die Edge Function `ai-proxy`
 * (zählt Verbrauch, setzt Plan-Limits durch, hält den Mistral-Key).
 *
 * Zwei Aufrufarten:
 * - als Nutzer: Authorization-Header des Requests durchreichen (chat, search)
 * - als Service im Namen eines Nutzers: Service-Role-Key + x-user-id (Pipeline ohne Nutzer-Session)
 */
const AI_PROXY_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-proxy`

/** Längste Wartezeit nach 429; die Fair-Use-Bremse des Proxys zählt in Fenstern von einer Minute */
const MAX_RETRY_WAIT_MS = 60_000

/**
 * Wiederholt eine Anfrage nach 429 (Fair-Use-Bremse des Proxys) und wartet dazwischen so lange, wie `Retry-After`
 * sagt. Ohne das scheitert ein Mehrfach-Upload, weil jedes Dokument rund vier KI-Aufrufe braucht.
 */
export async function withRateLimitRetry(
  doFetch: () => Promise<Response>,
  { retries = 3, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) }: { retries?: number, sleep?: (ms: number) => Promise<void> } = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await doFetch()
    if (response.status !== 429 || attempt >= retries) return response
    await response.body?.cancel()
    const seconds = Number(response.headers.get('Retry-After'))
    await sleep(seconds > 0 ? Math.min(seconds * 1000, MAX_RETRY_WAIT_MS) : MAX_RETRY_WAIT_MS)
  }
}

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

/** Pipeline ohne Nutzer-Session: wartet bei 429 und versucht erneut, weil niemand vor dem Bildschirm wartet */
export function aiFetchAsService(path: string, userId: string, body: unknown): Promise<Response> {
  return withRateLimitRetry(() => fetch(`${AI_PROXY_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'x-user-id': userId,
    },
    body: JSON.stringify(body),
  }))
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
