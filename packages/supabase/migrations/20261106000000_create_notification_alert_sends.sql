-- notification_alert_sends records when each alert last reached each channel, so a position that stays below its
-- threshold is messaged every 15 minutes instead of on every 5-minute check. The cron writes the row after a send that
-- worked and deletes the alert's rows once the position recovers, so the next dip alerts at once. The 7-day and 1-day
-- maturity reminders stay in notification_maturity_reminders.
--
-- Idempotent: the table is created only if missing.

create table if not exists public.notification_alert_sends (
  config_id uuid not null references public.notification_configs (id) on delete cascade,
  channel   text not null check (channel in ('email', 'signal', 'telegram')),
  sent_at   timestamptz not null default now(),
  primary key (config_id, channel)
);

comment on table public.notification_alert_sends is
  'When each alert last reached each channel, for the repeat limit of the alert cron. Service role only.';

-- Server-only like the other tables: RLS on with no policies, and the default grants of anon and authenticated revoked.
alter table public.notification_alert_sends enable row level security;

revoke all on public.notification_alert_sends from anon, authenticated;
