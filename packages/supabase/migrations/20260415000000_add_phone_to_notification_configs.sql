-- Add phone column for Signal notification delivery.
-- Users who enable the "signal" service will store their phone number here.

alter table public.notification_configs
  add column if not exists phone text;

comment on column public.notification_configs.phone is 'E.164 phone number for Signal notifications (e.g. +14155551234).';
