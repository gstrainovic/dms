---
name: infomaniak-hosting
description: Hosting von dms in der Infomaniak Public Cloud (OpenStack-Projekt, Zugang, DNS, eigene VM pro Produkt). Laden bei Produktivbetrieb, neuen Instanzen, DNS, Snapshots, Kosten oder Deployment auf Infomaniak.
---

# Hosting bei Infomaniak

- Infomaniak Public Cloud (OpenStack) in der Schweiz, Domain und Server im selben Konto. Instanzen per OpenStack-CLI, DNS per Infomaniak-API, Snapshots vor riskanten Änderungen.
- Kein GitHub Pages für Landing Pages: dessen Bedingungen schliessen Marketing für kommerzielle SaaS aus.
- **Eigene VM pro Produkt.** auto-service (InstantDB, AI-Proxy als Node-Container, Caddy) und dms (Supabase-Stack mit AI-Proxy als Edge Function) teilen keinen Prozess; der Proxy läuft je App als eigene Instanz. So reisst ein voller Supabase-Stack InstantDB nicht mit.
- Die Produktiv-VM für dms entsteht vor den ersten zahlenden Kunden; Supabase dort ohne Studio, Analytics und Log-Pipeline, dann reichen 4 GB. Die offenen Schritte (Deploy, Mail, Backup, Health-Check) stehen in `todo.md` 2.3.

## Projekt und Zugang
- OpenStack-Projekt PCP-CTPZLR8, Region dc3-a. Dort laufen `wartungsheft` (Produkt Wartungsheft, Repo `~/projects/wartungsheft`, auf GitHub `auto-service`) und die Dev-Instanz `dms-dev` (Skill `dev-vm`); die dms-Produktivinstanz kommt ins selbe Projekt.
- Vom Laptop: `openstack --os-cloud PCP-CTPZLR8-dc3-a …` mit Application Credential in `~/.config/openstack/clouds.yaml`.
- DNS-API-Token (nur `dns:write`) in `~/.config/infomaniak/token`, Ergebnis per `dig` prüfen.
- Kostenwächter `~/.local/bin/wartungsheft-cost-watch` zählt alle Instanzen des Projekts.
- Vorgehen und Stolpersteine (Security Group, MinIO nur noch auf quay.io, ein Caddy pro Instanz, DKIM bei Infomaniak nur als Typ «DKIM» im Manager) in `~/projects/wartungsheft/README.md` unter «Produktion».
