-- Add signal_recipient column for Signal notification delivery.
-- Stores the user's Signal username (e.g. alice.42) without the @ prefix.
-- The sender service prefixes it with "u:" when calling signal-cli-rest-api.

alter table public.notification_configs
  add column if not exists signal_recipient text;

comment on column public.notification_configs.signal_recipient is 'Signal username (e.g. alice.42) for Signal notifications. Stored without @ prefix.';
