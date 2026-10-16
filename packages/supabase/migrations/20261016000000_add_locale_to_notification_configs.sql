-- The language an alert is sent in: the site language the config was saved from ('en' at the root, 'cs' under /cs).
-- Written by PUT /api/notifications/config (optional `locale`, 'en' when absent) and read by the notification cron,
-- which builds the alert text, the email subject and html and the timestamp in that language.
-- Existing rows get 'en', so alerts saved before this migration keep their English copy.
-- Idempotent: the column is added only if missing, and the check is dropped and recreated.

alter table public.notification_configs
  add column if not exists locale text not null default 'en';

alter table public.notification_configs
  drop constraint if exists notification_configs_locale_check;

alter table public.notification_configs
  add constraint notification_configs_locale_check check (locale in ('en', 'cs'));

comment on column public.notification_configs.locale is 'Language the alert is sent in: en or cs (the site language it was saved from).';
