#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[e2e]${NC} $1"; }
warn() { echo -e "${YELLOW}[e2e]${NC} $1"; }
err() { echo -e "${RED}[e2e]${NC} $1" >&2; }

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

# 2. SELinux-Kontext fuer Edge Functions (immer pruefen, auch bei laufendem Supabase)
if command -v getenforce &>/dev/null && [[ "$(getenforce)" != "Disabled" ]]; then
  FUNCTIONS_DIR="$PROJECT_ROOT/supabase/functions"
  if [[ -d "$FUNCTIONS_DIR" ]]; then
    CURRENT_CONTEXT=$(ls -dZ "$FUNCTIONS_DIR" 2>/dev/null | awk '{print $1}' || true)
    if [[ "$CURRENT_CONTEXT" != *"container_file_t"* ]]; then
      log "Setze SELinux-Kontext fuer Edge Functions..."
      chcon -R -t container_file_t "$FUNCTIONS_DIR"
    fi
  fi
fi

# 3. Secrets fuer Edge Functions bereitstellen (immer pruefen)
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

# 4. Prüfe ob Supabase bereits läuft (Docker CE oder Podman)
SUPABASE_DB_RUNNING=$(DOCKER_HOST= docker ps --filter "name=supabase_db_" --filter "status=running" -q 2>/dev/null || true)
if [[ -z "$SUPABASE_DB_RUNNING" ]]; then
  SUPABASE_DB_RUNNING=$(docker ps --filter "name=supabase_db_" --filter "status=running" -q 2>/dev/null || true)
fi

if [[ -n "$SUPABASE_DB_RUNNING" ]]; then
  log "Supabase laeuft bereits — ueberspringe Start"
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

# 5. DB zuruecksetzen fuer saubere Tests
log "Setze Datenbank zurueck..."
supabase db reset 2>&1 | tail -5
log "Datenbank bereit"

# 6. Playwright E2E Tests ausfuehren
log "Starte E2E Tests..."
cd "$PROJECT_ROOT"
pnpm exec playwright test "$@"
