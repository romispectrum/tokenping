-- The API caps recipients at these lengths and stores each service once. The same limits here keep an oversized row out
-- whatever writes it, because the cron loads these columns for every enabled alert on every run.
--
-- `not valid`: new writes are checked and existing rows are left alone, so this cannot fail on a row already stored.
-- Idempotent: the checks are dropped and recreated.

alter table public.notification_configs
  drop constraint if exists notification_configs_email_length,
  drop constraint if exists notification_configs_signal_recipient_length,
  drop constraint if exists notification_configs_services_count;

alter table public.notification_configs
  add constraint notification_configs_email_length
    check (email is null or char_length(email) <= 254) not valid,
  add constraint notification_configs_signal_recipient_length
    check (signal_recipient is null or char_length(signal_recipient) <= 64) not valid,
  add constraint notification_configs_services_count
    check (cardinality(services) <= 3) not valid;
