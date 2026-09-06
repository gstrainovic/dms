-- AI-Proxy: Nutzungszähler und Abos.
-- Geschrieben ausschliesslich vom Proxy mit Service-Role (umgeht RLS). Clients dürfen nur ihre eigenen Zeilen lesen.

create table ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  ocr_pages integer not null default 0,
  chat_tokens bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

create table ai_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_end bigint,
  updated_at timestamptz not null default now()
);

alter table ai_usage enable row level security;
alter table ai_subscriptions enable row level security;

create policy "Nutzer lesen eigene Nutzung" on ai_usage
  for select using (auth.uid() = user_id);
create policy "Nutzer lesen eigenes Abo" on ai_subscriptions
  for select using (auth.uid() = user_id);

-- Atomare Erhöhung der Zähler (kein Read-Modify-Write im Proxy nötig)
create or replace function ai_add_usage(p_user_id uuid, p_month text, p_ocr_pages integer, p_chat_tokens bigint)
returns ai_usage
language sql
security definer
set search_path = public
as $$
  insert into ai_usage (user_id, month, ocr_pages, chat_tokens)
  values (p_user_id, p_month, p_ocr_pages, p_chat_tokens)
  on conflict (user_id, month) do update
    set ocr_pages = ai_usage.ocr_pages + excluded.ocr_pages,
        chat_tokens = ai_usage.chat_tokens + excluded.chat_tokens,
        updated_at = now()
  returning *;
$$;

-- Nur der Proxy (Service-Role) darf Zähler erhöhen
revoke all on function ai_add_usage(uuid, text, integer, bigint) from public, anon, authenticated;
