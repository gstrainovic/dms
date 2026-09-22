-- Mehrbenutzer: Die Organisation besitzt Dokumente, Tags, Felder, Schemas und Chats; Zugriff läuft über die
-- Mitgliedschaft statt über user_id. Jede Person gehört genau einer Organisation an, ein Privatkonto ist eine
-- Organisation mit einer Person. `user_id` an Dokumenten, Tags und Chats bleibt als Urheber bzw. Besitzer.

-- ─── Tabellen ────────────────────────────────────────────────────────────────

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null default '',
  kind text not null default 'privat' check (kind in ('privat', 'betrieb')),
  created_at timestamptz not null default now()
);

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table organization_invitations (
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null check (email = lower(email)),
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (org_id, email)
);

-- Dokumenttypen, die nur Admins sehen (z. B. Lohn und Personal)
create table restricted_document_types (
  org_id uuid not null references organizations(id) on delete cascade,
  document_type text not null,
  primary key (org_id, document_type)
);

-- Protokoll: wer hat was hochgeladen, geändert, gelöscht. user_id null = automatische Verarbeitung (Pipeline)
create table audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  document_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on audit_log(org_id, created_at desc);
create index audit_log_document_idx on audit_log(document_id);

-- ─── Hilfsfunktionen (security definer, damit RLS auf den Mitgliedern nicht rekursiv wird) ─────────────

create function current_org_id() returns uuid
language sql stable security definer set search_path = public
as $$ select org_id from organization_members where user_id = auth.uid() $$;

create function is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from organization_members where org_id = p_org and user_id = auth.uid()) $$;

create function is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from organization_members where org_id = p_org and user_id = auth.uid() and role = 'admin') $$;

-- Sichtbarkeit eines Dokuments: Mitglied der Organisation, und bei gesperrtem Typ Admin oder selbst hochgeladen
create function can_see_document(p_org uuid, p_type text, p_owner uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.org_id = p_org and m.user_id = auth.uid()
      and (m.role = 'admin' or p_owner = auth.uid() or p_type is null
        or not exists (select 1 from restricted_document_types r where r.org_id = p_org and r.document_type = p_type))
  )
$$;

create function new_personal_org(p_user uuid, p_email text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_org uuid;
begin
  insert into organizations (name, kind) values (coalesce(p_email, ''), 'privat') returning id into v_org;
  insert into organization_members (org_id, user_id, role) values (v_org, p_user, 'admin');
  return v_org;
end $$;

-- Offene Einladung annehmen. Ein bestehendes Privatkonto wird nur aufgegeben, wenn es leer ist (keine Dokumente,
-- Chats oder weiteren Mitglieder); sonst bleibt die Einladung offen ('pending'). 'none' = keine Einladung.
create function join_invited_org(p_user uuid, p_email text) returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_inv organization_invitations;
  v_current uuid;
begin
  select * into v_inv from organization_invitations where email = lower(p_email) order by created_at limit 1;
  if not found then return 'none'; end if;

  select org_id into v_current from organization_members where user_id = p_user;
  if v_current = v_inv.org_id then
    delete from organization_invitations where org_id = v_inv.org_id and email = v_inv.email;
    return 'added';
  end if;
  if v_current is not null then
    if exists (select 1 from documents where org_id = v_current)
      or exists (select 1 from chat_sessions where org_id = v_current)
      or exists (select 1 from organization_members where org_id = v_current and user_id <> p_user) then
      return 'pending';
    end if;
    delete from organizations where id = v_current;
  end if;

  insert into organization_members (org_id, user_id, role) values (v_inv.org_id, p_user, v_inv.role);
  delete from organization_invitations where org_id = v_inv.org_id and email = v_inv.email;
  return 'added';
end $$;

-- Neue Person: eingeladen → Mitglied der einladenden Organisation, sonst eigenes Privatkonto
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if join_invited_org(new.id, new.email) <> 'added' then
    perform new_personal_org(new.id, new.email);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

revoke all on function new_personal_org(uuid, text) from public, anon, authenticated;
revoke all on function join_invited_org(uuid, text) from public, anon, authenticated;
revoke all on function handle_new_user() from public, anon, authenticated;

-- ─── Bestehende Konten übernehmen ────────────────────────────────────────────

do $$
declare u record;
begin
  for u in select id, email from auth.users where id not in (select user_id from organization_members) loop
    perform new_personal_org(u.id, u.email);
  end loop;
end $$;

alter table documents add column org_id uuid references organizations(id) on delete cascade;
alter table tags add column org_id uuid references organizations(id) on delete cascade;
alter table chat_sessions add column org_id uuid references organizations(id) on delete cascade;
alter table document_schemas add column org_id uuid references organizations(id) on delete cascade default current_org_id();

update documents d set org_id = m.org_id from organization_members m where m.user_id = d.user_id;
update tags t set org_id = m.org_id from organization_members m where m.user_id = t.user_id;
update chat_sessions s set org_id = m.org_id from organization_members m where m.user_id = s.user_id;

alter table documents alter column org_id set not null;
alter table tags alter column org_id set not null;
alter table chat_sessions alter column org_id set not null;

create index documents_org_id_idx on documents(org_id);
create index tags_org_id_idx on tags(org_id);
create index chat_sessions_org_id_idx on chat_sessions(org_id);

drop index if exists documents_sha256_user_idx;
create unique index documents_sha256_org_idx on documents(sha256, org_id);
drop index if exists tags_name_user_idx;
create unique index tags_name_org_idx on tags(name, org_id);

-- Schemas: org_id null = mitgeliefert (für alle lesbar, nicht änderbar), sonst eigenes Schema der Organisation
alter table document_schemas drop constraint if exists document_schemas_name_key;
alter table document_schemas drop constraint if exists document_schemas_document_type_key;
create unique index document_schemas_type_org_idx
  on document_schemas(coalesce(org_id, '00000000-0000-0000-0000-000000000000'::uuid), document_type);

-- Organisation und Urheber beim Anlegen setzen: Urheber ist, wer angemeldet ist; die Organisation die des Urhebers
create function set_org_from_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;
  if new.org_id is null then
    select org_id into new.org_id from organization_members where user_id = new.user_id;
  end if;
  return new;
end $$;

create trigger documents_set_org before insert on documents for each row execute function set_org_from_user();
create trigger tags_set_org before insert on tags for each row execute function set_org_from_user();
create trigger chat_sessions_set_org before insert on chat_sessions for each row execute function set_org_from_user();

-- ─── AI-Proxy: Verbrauch, Testzeit und Abo pro Organisation (Spalte user_id = Konto) ─────────────────

alter table ai_usage drop constraint ai_usage_user_id_fkey;
alter table ai_subscriptions drop constraint ai_subscriptions_user_id_fkey;

-- Zähler mehrerer Personen einer Organisation gibt es noch nicht (eine Person = eine Organisation), darum 1:1
update ai_usage u set user_id = m.org_id from organization_members m where m.user_id = u.user_id;
update ai_subscriptions s set user_id = m.org_id from organization_members m where m.user_id = s.user_id;
delete from ai_usage where user_id not in (select id from organizations);
delete from ai_subscriptions where user_id not in (select id from organizations);

alter table ai_usage add constraint ai_usage_account_fkey foreign key (user_id) references organizations(id) on delete cascade;
alter table ai_subscriptions add constraint ai_subscriptions_account_fkey foreign key (user_id) references organizations(id) on delete cascade;
comment on column ai_usage.user_id is 'Konto im ai-proxy = organizations.id';
comment on column ai_subscriptions.user_id is 'Konto im ai-proxy = organizations.id';

drop policy "Nutzer lesen eigene Nutzung" on ai_usage;
drop policy "Nutzer lesen eigenes Abo" on ai_subscriptions;
create policy "Mitglieder lesen Nutzung der Organisation" on ai_usage for select using (is_org_member(user_id));
create policy "Mitglieder lesen Abo der Organisation" on ai_subscriptions for select using (is_org_member(user_id));

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_invitations enable row level security;
alter table restricted_document_types enable row level security;
alter table audit_log enable row level security;

create policy "Mitglieder sehen ihre Organisation" on organizations for select using (is_org_member(id));
create policy "Admins benennen die Organisation" on organizations for update using (is_org_admin(id)) with check (is_org_admin(id));

create policy "Mitglieder sehen die Mitglieder" on organization_members for select using (is_org_member(org_id));

create policy "Admins sehen Einladungen" on organization_invitations for select using (is_org_admin(org_id));
create policy "Admins ziehen Einladungen zurück" on organization_invitations for delete using (is_org_admin(org_id));

create policy "Mitglieder sehen gesperrte Typen" on restricted_document_types for select using (is_org_member(org_id));
create policy "Admins sperren Typen" on restricted_document_types for insert with check (is_org_admin(org_id));
create policy "Admins geben Typen frei" on restricted_document_types for delete using (is_org_admin(org_id));

create policy "Admins lesen das Protokoll" on audit_log for select using (is_org_admin(org_id));

-- Dokumente
drop policy "Users can select own documents" on documents;
drop policy "Users can insert own documents" on documents;
drop policy "Users can update own documents" on documents;
drop policy "Users can delete own documents" on documents;
create policy "Mitglieder sehen Dokumente" on documents for select using (can_see_document(org_id, document_type, user_id));
create policy "Mitglieder legen Dokumente an" on documents for insert with check (is_org_member(org_id));
create policy "Mitglieder ändern Dokumente" on documents for update
  using (can_see_document(org_id, document_type, user_id)) with check (is_org_member(org_id));
create policy "Mitglieder löschen Dokumente" on documents for delete using (can_see_document(org_id, document_type, user_id));

-- Tags
drop policy "Users can select own tags" on tags;
drop policy "Users can insert own tags" on tags;
drop policy "Users can update own tags" on tags;
drop policy "Users can delete own tags" on tags;
create policy "Mitglieder verwalten Tags" on tags for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Zuordnungen, Felder, Embeddings: sichtbar wie das Dokument
drop policy "Users can manage own document_tags" on document_tags;
drop policy "Users can manage own document_fields" on document_fields;
drop policy "Users can manage own document_embeddings" on document_embeddings;
create policy "Tags sichtbarer Dokumente" on document_tags for all
  using (exists (select 1 from documents d where d.id = document_id and can_see_document(d.org_id, d.document_type, d.user_id)))
  with check (exists (select 1 from documents d join tags t on t.org_id = d.org_id
    where d.id = document_id and t.id = tag_id and can_see_document(d.org_id, d.document_type, d.user_id)));
create policy "Felder sichtbarer Dokumente" on document_fields for all
  using (exists (select 1 from documents d where d.id = document_id and can_see_document(d.org_id, d.document_type, d.user_id)));
create policy "Embeddings sichtbarer Dokumente" on document_embeddings for all
  using (exists (select 1 from documents d where d.id = document_id and can_see_document(d.org_id, d.document_type, d.user_id)));

-- Schemas
drop policy "Authenticated users can read schemas" on document_schemas;
drop policy "Authenticated users can manage schemas" on document_schemas;
create policy "Mitglieder lesen Schemas" on document_schemas for select using (org_id is null or is_org_member(org_id));
create policy "Admins legen Schemas an" on document_schemas for insert with check (org_id is not null and is_org_admin(org_id));
create policy "Admins ändern Schemas" on document_schemas for update
  using (org_id is not null and is_org_admin(org_id)) with check (org_id is not null and is_org_admin(org_id));
create policy "Admins löschen Schemas" on document_schemas for delete using (org_id is not null and is_org_admin(org_id));

-- Chats bleiben persönlich, aber nur solange die Person Mitglied der Organisation ist
drop policy "Users can manage own sessions" on chat_sessions;
drop policy "Users can manage own messages" on chat_messages;
create policy "Eigene Chats in der eigenen Organisation" on chat_sessions for all
  using (user_id = auth.uid() and is_org_member(org_id)) with check (user_id = auth.uid() and is_org_member(org_id));
create policy "Nachrichten eigener Chats" on chat_messages for all
  using (exists (select 1 from chat_sessions s where s.id = session_id and s.user_id = auth.uid() and is_org_member(s.org_id)));

-- Storage: Lesen nur mit sichtbarem Dokument, Hochladen nur in den Ordner der eigenen Organisation
drop policy "Authenticated users can read documents" on storage.objects;
drop policy "Authenticated users can upload documents" on storage.objects;
drop policy "Authenticated users can delete documents" on storage.objects;

create function can_read_object(p_name text) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from documents d where d.storage_path = p_name and can_see_document(d.org_id, d.document_type, d.user_id))
$$;

-- Datei ohne Dokument (gerade hochgeladen oder verwaist): gehört dem Ordner, also der Organisation im ersten Pfadteil
create function is_own_loose_object(p_name text) returns boolean
language sql stable security definer set search_path = public
as $$
  select (storage.foldername(p_name))[1] = current_org_id()::text
    and not exists (select 1 from documents d where d.storage_path = p_name)
$$;

create policy "Dateien sichtbarer Dokumente lesen" on storage.objects for select
  using (bucket_id = 'documents' and (can_read_object(name) or is_own_loose_object(name)));
create policy "In den Ordner der eigenen Organisation hochladen" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = current_org_id()::text);
create policy "Dateien sichtbarer Dokumente löschen" on storage.objects for delete
  using (bucket_id = 'documents' and (can_read_object(name) or is_own_loose_object(name)));

-- ─── Suche: nur sichtbare Dokumente ──────────────────────────────────────────

create or replace function hybrid_search(
  query_text text,
  query_embedding vector(1024),
  match_count int default 20,
  fulltext_weight float default 0.4,
  vector_weight float default 0.6,
  filter_document_type text default null,
  filter_tags text[] default null
)
returns table (id uuid, title text, excerpt text, score float, match_type text, document_type text, tags text[])
language sql stable security invoker
as $$
  with visible as (
    select d.* from documents d
    where d.status = 'ready'
      and can_see_document(d.org_id, d.document_type, d.user_id)
      and (filter_document_type is null or d.document_type = filter_document_type)
  ),
  fulltext_results as (
    select v.id, v.title, left(v.ocr_text, 300) as excerpt,
      ts_rank(v.fts, websearch_to_tsquery('german', query_text)) as rank
    from visible v
    where v.fts @@ websearch_to_tsquery('german', query_text)
  ),
  vector_results as (
    select v.id, v.title, de.chunk_text as excerpt, 1 - (de.embedding <=> query_embedding) as rank
    from document_embeddings de
    join visible v on v.id = de.document_id
    order by de.embedding <=> query_embedding
    limit match_count * 2
  ),
  combined as (
    select
      coalesce(ft.id, vr.id) as id,
      coalesce(ft.title, vr.title) as title,
      coalesce(ft.excerpt, vr.excerpt) as excerpt,
      (coalesce(ft.rank, 0) * fulltext_weight + coalesce(vr.rank, 0) * vector_weight) as score,
      case
        when ft.id is not null and vr.id is not null then 'hybrid'
        when ft.id is not null then 'fulltext'
        else 'vector'
      end as match_type,
      (select v2.document_type from visible v2 where v2.id = coalesce(ft.id, vr.id)) as document_type
    from fulltext_results ft
    full outer join vector_results vr on ft.id = vr.id
  )
  select c.id, c.title, c.excerpt, c.score, c.match_type, c.document_type,
    array(select t.name from document_tags dt join tags t on t.id = dt.tag_id where dt.document_id = c.id) as tags
  from combined c
  where (filter_tags is null or exists (
    select 1 from document_tags dt join tags t on t.id = dt.tag_id
    where dt.document_id = c.id and t.name = any(filter_tags)
  ))
  order by c.score desc
  limit match_count;
$$;

-- ─── Mitglieder verwalten (nur Admins) ───────────────────────────────────────

create function require_admin() returns uuid
language plpgsql stable security definer set search_path = public
as $$
declare v_org uuid := current_org_id();
begin
  if v_org is null or not is_org_admin(v_org) then
    raise exception 'Nur Admins der Organisation dürfen das.' using errcode = '42501';
  end if;
  return v_org;
end $$;

-- Ergebnis: 'invited' (noch kein Konto, Einladungsmail nötig), 'added' (sofort Mitglied),
-- 'pending' (Konto mit eigenen Daten, Einladung bleibt offen), 'member' (schon Mitglied)
create function invite_member(p_email text, p_role text default 'member') returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid := require_admin();
  v_email text := lower(trim(p_email));
  v_user uuid;
begin
  if p_role not in ('admin', 'member') then raise exception 'Unbekannte Rolle %', p_role; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Ungültige E-Mail-Adresse'; end if;

  select id into v_user from auth.users where lower(email) = v_email;
  if v_user is not null and exists (select 1 from organization_members where org_id = v_org and user_id = v_user) then
    return 'member';
  end if;

  insert into organization_invitations (org_id, email, role, invited_by) values (v_org, v_email, p_role, auth.uid())
    on conflict (org_id, email) do update set role = excluded.role, invited_by = excluded.invited_by, created_at = now();

  if v_user is null then return 'invited'; end if;
  return join_invited_org(v_user, v_email);
end $$;

-- Beim Anmelden: offene Einladung für die eigene E-Mail annehmen
create function accept_invitation() returns text
language plpgsql security definer set search_path = public
as $$
begin
  return join_invited_org(auth.uid(), (select email from auth.users where id = auth.uid()));
end $$;

create function remove_member(p_user_id uuid) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid := require_admin();
  v_role text;
begin
  select role into v_role from organization_members where org_id = v_org and user_id = p_user_id;
  if not found then raise exception 'Diese Person ist kein Mitglied.'; end if;
  if v_role = 'admin' and (select count(*) from organization_members where org_id = v_org and role = 'admin') = 1 then
    raise exception 'Der letzte Admin kann nicht entfernt werden.';
  end if;
  delete from organization_members where org_id = v_org and user_id = p_user_id;
  perform new_personal_org(p_user_id, (select email from auth.users where id = p_user_id));
  insert into audit_log (org_id, user_id, action, details)
    values (v_org, auth.uid(), 'member.removed', jsonb_build_object('email', (select email from auth.users where id = p_user_id)));
end $$;

create function set_member_role(p_user_id uuid, p_role text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid := require_admin();
  v_role text;
begin
  if p_role not in ('admin', 'member') then raise exception 'Unbekannte Rolle %', p_role; end if;
  select role into v_role from organization_members where org_id = v_org and user_id = p_user_id;
  if not found then raise exception 'Diese Person ist kein Mitglied.'; end if;
  if v_role = 'admin' and p_role = 'member'
    and (select count(*) from organization_members where org_id = v_org and role = 'admin') = 1 then
    raise exception 'Der letzte Admin kann nicht herabgestuft werden.';
  end if;
  update organization_members set role = p_role where org_id = v_org and user_id = p_user_id;
end $$;

-- Mitglieder mit E-Mail (auth.users ist für Clients nicht lesbar)
create function list_members() returns table (user_id uuid, email text, role text, joined_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select m.user_id, u.email::text, m.role, m.created_at
  from organization_members m join auth.users u on u.id = m.user_id
  where m.org_id = current_org_id()
  order by m.created_at
$$;

revoke all on function require_admin() from public, anon;
revoke all on function invite_member(text, text) from public, anon;
revoke all on function accept_invitation() from public, anon;
revoke all on function remove_member(uuid) from public, anon;
revoke all on function set_member_role(uuid, text) from public, anon;
revoke all on function list_members() from public, anon;

-- ─── Protokoll-Trigger ───────────────────────────────────────────────────────

create function audit_documents() returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_changes jsonb := '{}';
begin
  if tg_op = 'INSERT' then
    insert into audit_log (org_id, user_id, action, document_id, details)
      values (new.org_id, auth.uid(), 'document.created', new.id,
        jsonb_build_object('title', new.title, 'filename', new.original_filename));
  elsif tg_op = 'UPDATE' then
    if new.title is distinct from old.title then
      v_changes := v_changes || jsonb_build_object('title', jsonb_build_object('from', old.title, 'to', new.title));
    end if;
    if new.document_type is distinct from old.document_type then
      v_changes := v_changes || jsonb_build_object('document_type', jsonb_build_object('from', old.document_type, 'to', new.document_type));
    end if;
    if v_changes <> '{}' then
      insert into audit_log (org_id, user_id, action, document_id, details)
        values (new.org_id, auth.uid(), 'document.updated', new.id, v_changes);
    end if;
  else
    insert into audit_log (org_id, user_id, action, document_id, details)
      values (old.org_id, auth.uid(), 'document.deleted', old.id,
        jsonb_build_object('title', old.title, 'filename', old.original_filename));
  end if;
  return null;
end $$;

create trigger documents_audit after insert or update or delete on documents
  for each row execute function audit_documents();

-- Tags und Felder: beim Löschen des Dokuments (Kaskade) ist es schon weg, dann nichts protokollieren
create function audit_document_children() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_row record := coalesce(new, old);
  v_org uuid;
  v_details jsonb;
begin
  select org_id into v_org from documents where id = v_row.document_id;
  if v_org is null then return null; end if;
  if tg_table_name = 'document_tags' then
    v_details := jsonb_build_object('tag', (select name from tags where id = v_row.tag_id), 'source', v_row.source);
  else
    if tg_op = 'UPDATE' and new.field_value is not distinct from old.field_value then return null; end if;
    v_details := jsonb_build_object('field', v_row.field_name, 'value', case when tg_op = 'DELETE' then null else new.field_value end,
      'source', v_row.source);
  end if;
  insert into audit_log (org_id, user_id, action, document_id, details)
    values (v_org, auth.uid(),
      (case tg_table_name when 'document_tags' then 'tag.' else 'field.' end)
        || (case tg_op when 'INSERT' then 'added' when 'UPDATE' then 'changed' else 'removed' end),
      v_row.document_id, v_details);
  return null;
end $$;

create trigger document_tags_audit after insert or delete on document_tags
  for each row execute function audit_document_children();
create trigger document_fields_audit after insert or update or delete on document_fields
  for each row execute function audit_document_children();

revoke all on function audit_documents() from public, anon, authenticated;
revoke all on function audit_document_children() from public, anon, authenticated;
revoke all on function set_org_from_user() from public, anon, authenticated;
