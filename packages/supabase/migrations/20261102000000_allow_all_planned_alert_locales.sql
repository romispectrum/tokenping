-- Tokenping is growing from six site languages to 31 (docs/i18n.md), one language at a time. Rather than a migration
-- per language, this allows every planned language code at once in the four language checks of notification_configs,
-- so an alert can be saved from any of those pages and each channel can be sent in any of them. The app only offers
-- the languages it ships (LOCALES), so allowing a code early changes nothing. No data changes. Idempotent: the checks
-- are dropped and recreated.

alter table public.notification_configs
  drop constraint if exists notification_configs_locale_check,
  drop constraint if exists notification_configs_email_locale_check,
  drop constraint if exists notification_configs_signal_locale_check,
  drop constraint if exists notification_configs_telegram_locale_check;

alter table public.notification_configs
  add constraint notification_configs_locale_check check (locale in ('en', 'cs', 'es', 'hi', 'de', 'vi', 'fr', 'pt', 'it', 'pl', 'tr', 'id', 'nl', 'ro', 'hu', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'nb', 'fil', 'ru', 'uk', 'bg', 'el', 'th', 'ja', 'ko', 'zh')),
  add constraint notification_configs_email_locale_check
    check (email_locale is null or email_locale in ('en', 'cs', 'es', 'hi', 'de', 'vi', 'fr', 'pt', 'it', 'pl', 'tr', 'id', 'nl', 'ro', 'hu', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'nb', 'fil', 'ru', 'uk', 'bg', 'el', 'th', 'ja', 'ko', 'zh')),
  add constraint notification_configs_signal_locale_check
    check (signal_locale is null or signal_locale in ('en', 'cs', 'es', 'hi', 'de', 'vi', 'fr', 'pt', 'it', 'pl', 'tr', 'id', 'nl', 'ro', 'hu', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'nb', 'fil', 'ru', 'uk', 'bg', 'el', 'th', 'ja', 'ko', 'zh')),
  add constraint notification_configs_telegram_locale_check
    check (telegram_locale is null or telegram_locale in ('en', 'cs', 'es', 'hi', 'de', 'vi', 'fr', 'pt', 'it', 'pl', 'tr', 'id', 'nl', 'ro', 'hu', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'nb', 'fil', 'ru', 'uk', 'bg', 'el', 'th', 'ja', 'ko', 'zh'));

comment on column public.notification_configs.locale is 'The page language the alert was last saved from (a site language code: en, cs, es, hi, de, vi, fr, pt, it, pl, tr, id, nl, ro, hu, sk, hr, sl, sr, sv, da, nb, fil, ru, uk, bg, el, th, ja, ko or zh): the language of any channel without its own *_locale.';
comment on column public.notification_configs.email_locale is 'Language of the email alerts, a site language code; null means locale.';
comment on column public.notification_configs.signal_locale is 'Language of the Signal alerts, a site language code; null means locale.';
comment on column public.notification_configs.telegram_locale is 'Language of the Telegram alerts, a site language code; null means locale.';
