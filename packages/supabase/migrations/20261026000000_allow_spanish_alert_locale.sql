-- Spanish joins English and Czech as a site language (/es), so an alert can be saved from the Spanish pages and each
-- channel can be sent in Spanish. Widens the four language checks of notification_configs to 'es'; no data changes.
-- Idempotent: the checks are dropped and recreated.

alter table public.notification_configs
  drop constraint if exists notification_configs_locale_check,
  drop constraint if exists notification_configs_email_locale_check,
  drop constraint if exists notification_configs_signal_locale_check,
  drop constraint if exists notification_configs_telegram_locale_check;

alter table public.notification_configs
  add constraint notification_configs_locale_check check (locale in ('en', 'cs', 'es')),
  add constraint notification_configs_email_locale_check
    check (email_locale is null or email_locale in ('en', 'cs', 'es')),
  add constraint notification_configs_signal_locale_check
    check (signal_locale is null or signal_locale in ('en', 'cs', 'es')),
  add constraint notification_configs_telegram_locale_check
    check (telegram_locale is null or telegram_locale in ('en', 'cs', 'es'));

comment on column public.notification_configs.locale is 'The page language the alert was last saved from (en, cs or es): the language of any channel without its own *_locale.';
comment on column public.notification_configs.email_locale is 'Language of the email alerts: en, cs or es; null means locale.';
comment on column public.notification_configs.signal_locale is 'Language of the Signal alerts: en, cs or es; null means locale.';
comment on column public.notification_configs.telegram_locale is 'Language of the Telegram alerts: en, cs or es; null means locale.';
