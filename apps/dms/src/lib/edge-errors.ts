/**
 * supabase.functions.invoke meldet bei Nicht-2xx nur "Edge Function returned a non-2xx status code".
 * Die eigentliche Meldung (z. B. "Monatslimit erreicht ...") steht im Body der Antwort in `context`.
 */
export async function functionErrorMessage(err: unknown): Promise<string> {
  const context = (err as { context?: Response })?.context
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json()
      if (typeof body?.error === 'string' && body.error) return body.error
    } catch {
      // Body war kein JSON, unten Fallback
    }
  }
  return err instanceof Error ? err.message : 'Unbekannter Fehler'
}
