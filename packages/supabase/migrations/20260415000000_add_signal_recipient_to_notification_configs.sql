-- Add signal_recipient column for Signal notification delivery.
-- Stores the user's Signal username (e.g. alice.42) without @ or u: prefixes.
-- signal-cli-rest-api auto-classifies non-phone strings as usernames and adds the
-- "u:" prefix internally, so we send the bare username.

alter table public.notification_configs
  add column if not exists signal_recipient text;

comment on column public.notification_configs.signal_recipient is 'Signal username (e.g. alice.42) for Signal notifications. Stored without @ or u: prefixes.';
