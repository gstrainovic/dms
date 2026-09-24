#!/usr/bin/env bash
# Dev-Supabase auf der Infomaniak-Instanz dms-dev bedienen (Entwickeln ohne Docker/Podman, siehe AGENTS.md).
# Alles im Repo spricht Supabase über 127.0.0.1:54321 an, ein SSH-Tunnel blendet die Instanz dort ein.
set -euo pipefail

VM="${DMS_DEV_VM:-debian@195.15.243.89}"
REMOTE_DIR=/opt/dms
# 54321 API (Kong), 54323 Studio, 54324 Mailpit (Auth-Mails)
PORTS=(54321 54323 54324)

usage() {
  cat <<EOF
Aufruf: scripts/dev-vm.sh <befehl>

  tunnel   SSH-Tunnel im Hintergrund öffnen (Ports ${PORTS[*]}), danach: pnpm dev:frontend
  sync     git pull auf der Instanz und Edge Runtime neu starten (nach gepushten Änderungen an supabase/)
  reset    sync + supabase db reset (saubere DB vor Tests, wie scripts/test.sh lokal)
  status   Container und API-Antwort auf der Instanz
  logs     Logs der Edge Runtime (folgen)
  restart  Supabase-Stack auf der Instanz neu starten (nach Änderungen an config.toml oder functions/.env)
  ssh      Shell auf der Instanz

Instanz: $VM (überschreibbar mit DMS_DEV_VM)
EOF
}

remote() { ssh -o BatchMode=yes "$VM" "cd $REMOTE_DIR && $*"; }

tunnel_args=()
for p in "${PORTS[@]}"; do tunnel_args+=(-L "$p:localhost:$p"); done

case "${1:-}" in
  tunnel)
    if curl -fsS -o /dev/null "http://127.0.0.1:${PORTS[0]}/rest/v1/" 2>/dev/null || [[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORTS[0]}/rest/v1/")" != "000" ]]; then
      echo "Port ${PORTS[0]} antwortet bereits (Tunnel offen oder lokales Supabase läuft)"
      exit 0
    fi
    ssh -o BatchMode=yes -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -f -N "${tunnel_args[@]}" "$VM"
    echo "Tunnel offen: ${PORTS[*]} → $VM"
    ;;
  sync)
    remote "git pull -q && git log --oneline -n 1 && docker restart supabase_edge_runtime_dms >/dev/null && echo 'Edge Runtime neu gestartet'"
    ;;
  reset)
    remote "git pull -q && git log --oneline -n 1 && supabase db reset 2>&1 | tail -3 && docker restart supabase_edge_runtime_dms >/dev/null && echo 'Edge Runtime neu gestartet'"
    ;;
  status)
    remote "docker ps --format '{{.Names}}\t{{.Status}}' | grep supabase; curl -s -o /dev/null -w 'API http %{http_code}\n' http://127.0.0.1:54321/rest/v1/"
    ;;
  logs)
    remote "docker logs -f --tail 100 supabase_edge_runtime_dms"
    ;;
  restart)
    remote "cp .env supabase/functions/.env && supabase stop && supabase start 2>&1 | tail -3"
    ;;
  ssh)
    ssh "$VM"
    ;;
  *)
    usage
    exit 1
    ;;
esac
