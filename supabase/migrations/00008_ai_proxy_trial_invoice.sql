-- AI-Proxy ab v0.3.0: Testzeit statt Gratisplan und Jahresabo auf Rechnung mit QR-Zahlteil.
-- Felder entsprechen `Subscription` in ai-proxy/src/stores/types.ts.

alter table ai_subscriptions drop constraint ai_subscriptions_status_check;
alter table ai_subscriptions add constraint ai_subscriptions_status_check
  check (status in ('active', 'past_due', 'canceled', 'trial'));

alter table ai_subscriptions
  add column trial_started_at timestamptz,
  add column billing text check (billing in ('stripe', 'invoice')),
  add column audience text check (audience in ('privat', 'betrieb')),
  add column billing_address jsonb,
  add column vehicles integer,
  add column cancel_at_period_end boolean,
  add column invoices jsonb;

-- Der tägliche Abo-Job liest alle Rechnungs-Abos
create index ai_subscriptions_billing_idx on ai_subscriptions(billing) where billing is not null;
