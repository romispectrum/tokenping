-- The language each channel's alerts are sent in, picked per channel in the alert form (the page's language until
-- the person changes it). Written by PUT /api/notifications/config (optional `channelLocales`) and read by the
-- notification cron and the test-send route, which build each channel's message in its own language.
-- null means the row's `locale`: alerts saved before this migration, and channels a client sent no language for.
-- Idempotent: the columns are added only if missing, and the checks are dropped and recreated.

alter table public.notification_configs
  add column if not exists email_locale text,
  add column if not exists signal_locale text,
  add column if not exists telegram_locale text;

alter table public.notification_configs
  drop constraint if exists notification_configs_email_locale_check,
  drop constraint if exists notification_configs_signal_locale_check,
  drop constraint if exists notification_configs_telegram_locale_check;

alter table public.notification_configs
  add constraint notification_configs_email_locale_check check (email_locale is null or email_locale in ('en', 'cs')),
  add constraint notification_configs_signal_locale_check check (signal_locale is null or signal_locale in ('en', 'cs')),
  add constraint notification_configs_telegram_locale_check
    check (telegram_locale is null or telegram_locale in ('en', 'cs'));

comment on column public.notification_configs.email_locale is 'Language of the email alerts: en or cs; null means locale.';
comment on column public.notification_configs.signal_locale is 'Language of the Signal alerts: en or cs; null means locale.';
comment on column public.notification_configs.telegram_locale is 'Language of the Telegram alerts: en or cs; null means locale.';
comment on column public.notification_configs.locale is 'The page language the alert was last saved from (en or cs): the language of any channel without its own *_locale.';
