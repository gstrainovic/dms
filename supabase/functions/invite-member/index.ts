/**
 * Person per E-Mail in die eigene Organisation einladen (nur Admins).
 * Die Prüfung und die Einladung selbst macht die RPC `invite_member` im Namen des Admins. Hat die Person noch kein
 * Konto ('invited'), legt Supabase Auth es an und verschickt die Einladungsmail; der Trigger `handle_new_user`
 * macht sie dabei zum Mitglied. Ergebnis: { result: 'invited' | 'added' | 'pending' | 'member' }.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userDb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userDb.auth.getUser()
  if (!user) return json({ error: 'Nicht authentifiziert' }, 401)

  try {
    const { email, role = 'member' } = await req.json()
    const { data: result, error } = await userDb.rpc('invite_member', { p_email: String(email ?? ''), p_role: role })
    if (error) {
      // 42501 = kein Admin; alles andere sind Eingabefehler (E-Mail, Rolle)
      return json({ error: error.message }, error.code === '42501' ? 403 : 400)
    }

    if (result === 'invited') {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const redirectTo = Deno.env.get('APP_URL') || undefined
      const { error: mailError } = await admin.auth.admin.inviteUserByEmail(String(email).trim().toLowerCase(), { redirectTo })
      if (mailError) throw new Error(`Einladungsmail fehlgeschlagen: ${mailError.message}`)
    }

    return json({ result })
  } catch (error) {
    return json({ error: (error as Error).message }, 500)
  }
})
