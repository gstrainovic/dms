---
name: dev-vm
description: Entwickeln ohne Docker/Podman über die Dev-Supabase auf der Infomaniak-Instanz dms-dev per SSH-Tunnel. Laden bei scripts/dev-vm.sh, auf einem PC ohne Docker, beim Tunnel, bei Sync/Reset der Dev-Instanz oder wenn dms-dev neu aufgesetzt, pausiert oder geprüft wird.
---

# Dev-Supabase auf dms-dev per SSH-Tunnel

Alles im Repo spricht Supabase nur über `127.0.0.1:54321` an (`apps/dms/.env`, Tests, E2E-Fixtures). Darum reicht auf einem PC ohne Docker oder Podman ein SSH-Tunnel zur Dev-Instanz; am Code ändert sich nichts. Gleiches Muster wie `wartungsheft-dev` (`~/projects/wartungsheft/AGENTS.md`).

## Instanz
- `dms-dev` im OpenStack-Projekt PCP-CTPZLR8 (dc3-a, Flavor `a2-ram4-disk50-perf1`, Debian 13, Docker CE, Supabase CLI als Debian-Paket).
- Zugriff `ssh debian@195.15.243.89` mit dem Key `claude-laptop` (derselbe wie für wartungsheft).
- Security Group `default`: nur 22, 80 und 443 offen. Kong bindet 54321 auf 0.0.0.0, von aussen kommt trotzdem nur SSH durch.

## Stack
- Checkout in `/opt/dms`, dort `supabase start` mit `.env` und `supabase/functions/.env` (Kopie der lokalen `.env` mit Mistral-Key und `AI_PROXY_BURST_LIMIT=1000`).
- Container haben `restart: unless-stopped`, nach einem Reboot kommt der Stack ohne Unit zurück.
- Analytics ist in `config.toml` aus (rund 1 GB weniger, der Stack braucht so etwa 1 GB); gilt auch lokal.
- Daten: leere Datenbank mit Migrationen und Seed wie nach `supabase db reset`. Tests leeren Tabellen selbst, alles dort ist Wegwerfdaten. Auth-Mails landen in Mailpit (Port 54324 im Tunnel).

## Bedienung
`scripts/dev-vm.sh tunnel | tunnel-stop | sync | reset | status | logs | restart | ssh`, Host per `DMS_DEV_VM` überschreibbar.
- Die Edge Functions laufen **auf der Instanz** aus deren Checkout: Änderungen an `supabase/` erst pushen, dann `dev-vm.sh sync` (git pull + Edge Runtime neu starten).
- `reset` macht zusätzlich `supabase db reset`.
- Änderungen an `config.toml` oder `.env` brauchen `restart` (`supabase stop && start`).
- Auf dem Laptop den Tunnel vor `pnpm dev` schliessen, sonst kollidiert das lokale Supabase mit Port 54321.

## Ablauf auf dem anderen PC
Braucht Node, pnpm, Git, Playwright-Browser, Deno (für `test:functions`), den SSH-Key und `.env` aus dem Gmail-Entwurf «DMS: Dev-Zugang für den zweiten PC».

```bash
scripts/dev-vm.sh tunnel   # 54321, 54323 (Studio), 54324 (Mailpit) → dms-dev
pnpm dev:frontend          # Vite auf Port 3000, redet über den Tunnel
scripts/dev-vm.sh reset && pnpm test:only                # Unit/Integration
scripts/dev-vm.sh reset && pnpm exec playwright test     # E2E, reuseExistingServer nimmt den laufenden Vite
```

`pnpm dev`, `pnpm test`, `pnpm test:e2e` starten Podman und sind nur für den Laptop.

## Kosten und Neuaufsetzen
- Läuft sie, kostet sie rund 13 CHF im Monat mit IPv4. Nach 2 h ohne SSH-Verbindung (Shell oder Tunnel) schaltet sie sich selbst ab (`~/projects/tools/leerlauf-aus.sh`, systemd-Timer), der Kostenwächter stellt sie beim nächsten Akquise-Lauf zurück (`shelve`); dann bleiben rund 3.50 CHF für IPv4 und Abbild.
- `dev-vm.sh` weckt sie vor jedem Befehl über `~/projects/tools/dev-instanz-wecken.sh dms-dev` (braucht `openstack` und `~/.config/openstack/clouds.yaml`; aus dem Zurückgestellten einige Minuten). Ohne openstack-CLI (zweiter PC) meldet das Skript den Befehl zum Zurückholen.
- Der Kostenwächter `~/.local/bin/wartungsheft-cost-watch` zählt alle Instanzen des Projekts, Limit 60 CHF.
- Neu aufsetzen: cloud-init installiert Docker CE, Supabase CLI und klont das Repo nach `/opt/dms`; danach `.env` per scp nach `/opt/dms/.env` und `/opt/dms/supabase/functions/.env`, dann `supabase start` in `/opt/dms`.
