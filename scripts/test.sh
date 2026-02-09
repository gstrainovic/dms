#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[test]${NC} $1"; }
warn() { echo -e "${YELLOW}[test]${NC} $1"; }
err() { echo -e "${RED}[test]${NC} $1" >&2; }

# 1. Podman Socket
PODMAN_SOCKET="/run/user/$(id -u)/podman/podman.sock"
export DOCKER_HOST="unix://$PODMAN_SOCKET"

if [[ -S "$PODMAN_SOCKET" ]]; then
  log "Podman-Socket laeuft bereits"
else
  log "Starte Podman-Socket..."
  systemctl --user start podman.socket
  sleep 1
  if [[ -S "$PODMAN_SOCKET" ]]; then
    log "Podman-Socket gestartet"
  else
    err "Podman-Socket konnte nicht gestartet werden"
    exit 1
  fi
fi

# 2. Secrets fuer Edge Functions bereitstellen (VOR supabase start)
ENV_FILE="$PROJECT_ROOT/.env"
FUNCTIONS_ENV="$PROJECT_ROOT/supabase/functions/.env"
if [[ -f "$ENV_FILE" ]]; then
  if [[ ! -f "$FUNCTIONS_ENV" ]] || ! diff -q "$ENV_FILE" "$FUNCTIONS_ENV" >/dev/null 2>&1; then
    cp "$ENV_FILE" "$FUNCTIONS_ENV"
    log "Secrets nach supabase/functions/.env kopiert"
  else
    log "Secrets bereits aktuell"
  fi
fi

# 3. Supabase
SUPABASE_DB_RUNNING=$(docker ps --filter "name=supabase_db_" --filter "status=running" -q 2>/dev/null || true)

if [[ -n "$SUPABASE_DB_RUNNING" ]]; then
  log "Supabase laeuft bereits"
else
  STALE_CONTAINERS=$(docker ps -a --filter "name=supabase_" -q 2>/dev/null || true)
  if [[ -n "$STALE_CONTAINERS" ]]; then
    warn "Alte Supabase-Container gefunden — raeume auf..."
    supabase stop --no-backup 2>/dev/null || true
    sleep 2
  fi
  log "Starte Supabase (kann ~60s dauern)..."
  supabase start
  log "Supabase gestartet"
fi

# 4. DB zuruecksetzen fuer saubere Tests
log "Setze Datenbank zurueck..."
supabase db reset 2>&1 | tail -5
log "Datenbank bereit"

# 5. Tests ausfuehren
log "Starte Tests..."
cd "$PROJECT_ROOT"
pnpm -r test "$@"
