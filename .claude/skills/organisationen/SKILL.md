---
name: organisationen
description: Mehrbenutzer in dms, Organisationen mit org_id, RLS, Rollen, Einladungen, Rechte pro Dokumenttyp, Storage-Pfade und audit_log. Laden bei Arbeit an Team, Einladen, Rollen, RLS-Policies, Migration 00009_organizations.sql, organizations.test.ts, e2e/team.spec.ts oder wenn Daten zwischen Organisationen sichtbar bzw. unsichtbar sein sollen.
---

# Mehrbenutzer (Organisationen)

Migration `supabase/migrations/00009_organizations.sql`, Tests in `apps/dms/src/__tests__/organizations.test.ts` und `e2e/team.spec.ts`. UI: `TeamCard.vue`, `AuditCard.vue`, `useOrganization.ts`.

- **Die Organisation besitzt alles:** Dokumente, Tags, Felder, eigene Schemas und Chats hängen an `org_id`, RLS prüft die Mitgliedschaft (`is_org_member`, `is_org_admin`, `can_see_document`). `user_id` bleibt als Urheber; der Trigger `set_org_from_user` setzt beim Anlegen Urheber und Organisation.
- **Eine Person gehört genau einer Organisation an.** Ein Privatkonto ist eine Organisation mit einer Person; jede neue Person bekommt es per Trigger `handle_new_user`, ausser eine Einladung wartet. Mehrere Organisationen pro Person bräuchten eine Auswahl der aktiven Organisation im UI und im Proxy.
- **Rollen:** `admin` | `member` in `organization_members`. Der letzte Admin lässt sich weder entfernen noch herabstufen.
- **Einladen:** Edge Function `invite-member` ruft als Admin die RPC `invite_member`; ohne Konto verschickt Supabase Auth die Einladungsmail und der Trigger macht die Person zum Mitglied. Ein bestehendes Konto wechselt nur, wenn es leer ist, sonst bleibt die Einladung offen (`organization_invitations`). Wer entfernt wird, bekommt ein neues leeres Privatkonto.
- **Rechte pro Dokumenttyp:** `restricted_document_types` sperrt Typen für Mitglieder (Einstellungen, Spalte «Nur Admins»). Wer ein Dokument hochgeladen hat, sieht es auch nach der Einstufung. `hybrid_search` filtert mit denselben Regeln, gesperrte Dokumente fliessen weder in Suchtreffer noch in Chat-Quellen.
- **Storage:** Dateien liegen unter `<org_id>/<sha256>/<Dateiname>`. Lesen erlaubt die Policy nur bei sichtbarem Dokument, Hochladen nur in den eigenen Organisationsordner.
- **Protokoll:** `audit_log` per Trigger für Dokumente, Tags, Felder und entfernte Mitglieder, lesbar nur für Admins. `user_id` null heisst automatische Verarbeitung (Pipeline).
- **ai-proxy pro Organisation:** Konto im Proxy ist `organizations.id` (`accountOf` in `supabase/functions/ai-proxy/index.ts`), `ai_usage.user_id` und `ai_subscriptions.user_id` zeigen auf `organizations`. Verbrauch, Testzeit und Abo gelten für alle Mitglieder gemeinsam. Pipeline-Functions geben `doc.org_id` direkt in `x-user-id` an.
- **Schemas:** `org_id` null heisst mitgeliefert, für alle lesbar und nicht änderbar; eigene Schemas legen nur Admins an.
