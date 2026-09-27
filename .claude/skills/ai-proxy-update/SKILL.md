---
name: ai-proxy-update
description: Neue Version von gstrainovic/ai-proxy in dms einbinden (gepinnter Commit-Hash, deno.json, Plan-Katalog). Laden wenn der ai-proxy aktualisiert, sein Import geändert oder ein Fehler im Proxy-Code selbst behoben werden soll.
---

# ai-proxy in dms aktualisieren

Der Proxy-Code liegt im eigenen Repo `~/projects/ai-proxy` (GitHub `gstrainovic/ai-proxy`). auto-service nutzt ihn als npm-Paket, dms als Edge Function `supabase/functions/ai-proxy/index.ts`, die `createEdgeApp(env, { plans, functionName, accountOf })` aus `src/edge.ts` importiert. Der Plan-Katalog (`_shared/plans.ts`) und das Konto (`accountOf` = Organisation) werden von dms injiziert.

## Pinnen
Der Import zeigt auf einen **Commit-Hash**, nicht auf einen Tag, weil Tags verschiebbar sind:
`https://raw.githubusercontent.com/gstrainovic/ai-proxy/<sha des Tags>/src/edge.ts`. Der Kommentar in `index.ts` nennt den zugehörigen Tag. Die Import-Map liegt pro Function in `supabase/functions/ai-proxy/deno.json` (hono, stripe, swissqrbill, supabase-js).

## Ablauf
1. In `~/projects/ai-proxy` Änderung committen, Tests grün, neuen Tag setzen und pushen.
2. Commit-Hash des Tags holen: `git -C ~/projects/ai-proxy rev-list -n 1 <tag>`.
3. Hash und Tag im Kommentar von `supabase/functions/ai-proxy/index.ts` eintragen.
4. `deno.json` mit den Abhängigkeiten des ai-proxy-Repos (`deno.json`/`package.json` dort) abgleichen.
5. Edge Runtime neu starten: `docker restart supabase_edge_runtime_dms` (auf dms-dev: `scripts/dev-vm.sh sync`).
6. `pnpm test` bzw. `pnpm test:functions`; nie `deno.lock` in `supabase/functions/` entstehen lassen (`--no-lock`).

Der Proxy muss in beiden Apps derselbe Code sein, weil er Verbrauch zählt und Limits durchsetzt; Änderungen an Texten oder Preisen müssen pro Katalog injizierbar bleiben statt auf eine App zugeschnitten.
