-- Repairs databases that applied version 20260415000000 before that migration was rewritten: its first version added
-- a `phone` column instead, and Supabase tracks migrations by version, so those databases never got signal_recipient.
-- Idempotent: a no-op wherever the column already exists.

alter table public.notification_configs
  add column if not exists signal_recipient text;
