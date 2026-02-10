#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[dev]${NC} $1"; }
warn() { echo -e "${YELLOW}[dev]${NC} $1"; }
err() { echo -e "${RED}[dev]${NC} $1" >&2; }

cleanup() {
  log "Shutting down..."
  if [[ -n "${VITE_PID:-}" ]]; then
    kill "$VITE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

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

# 2. Prüfe ob Supabase bereits läuft
# supabase status gibt 0 zurueck auch wenn Container kaputt sind
# → pruefe ob der DB-Container tatsaechlich laeuft (Docker CE oder Podman)
SUPABASE_DB_RUNNING=$(DOCKER_HOST= docker ps --filter "name=supabase_db_" --filter "status=running" -q 2>/dev/null || true)
if [[ -z "$SUPABASE_DB_RUNNING" ]]; then
  SUPABASE_DB_RUNNING=$(docker ps --filter "name=supabase_db_" --filter "status=running" -q 2>/dev/null || true)
fi

if [[ -n "$SUPABASE_DB_RUNNING" ]]; then
  log "Supabase laeuft bereits — ueberspringe Setup"
else
  # 2a. SELinux-Kontext fuer Edge Functions setzen (Fedora/RHEL mit rootless Podman)
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

  # 2b. Secrets fuer Edge Functions bereitstellen (VOR supabase start)
  ENV_FILE="$PROJECT_ROOT/.env"
  FUNCTIONS_ENV="$PROJECT_ROOT/supabase/functions/.env"
  if [[ -f "$ENV_FILE" ]]; then
    if [[ ! -f "$FUNCTIONS_ENV" ]] || ! diff -q "$ENV_FILE" "$FUNCTIONS_ENV" >/dev/null 2>&1; then
      cp "$ENV_FILE" "$FUNCTIONS_ENV"
      log "Secrets nach supabase/functions/.env kopiert"
    else
      log "Secrets bereits aktuell"
    fi
  else
    warn "Keine .env-Datei gefunden — Secrets nicht gesetzt"
  fi

  # 2c. Supabase starten
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

# 5. Vite Dev Server
log "Starte Vite Dev Server auf Port 3000..."
cd "$PROJECT_ROOT"
pnpm --filter @dms/app dev &
VITE_PID=$!

wait "$VITE_PID"
