import type { ReactNode } from "react";
import { TelegramUsernameField } from "~~/components/custom/notifications/TelegramUsernameField";
import { Field, Input, Select } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { LOCALES, LOCALE_INFO, type Locale, isLocale } from "~~/i18n/locales";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import type { NotificationService } from "~~/types/notifications";

type RecipientFieldsProps = {
  /** The fields' ids, for links to them (the error summary). */
  emailFieldId?: string;
  signalFieldId?: string;
  telegramFieldId?: string;
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  telegramUsername: string;
  /** The language each channel's alerts are written in. */
  channelLocales: Record<NotificationService, Locale>;
  /** Shown after a failed Save. */
  emailError?: string;
  signalError?: string;
  telegramError?: string;
  onEmailChange: (email: string) => void;
  onSignalRecipientChange: (signalRecipient: string) => void;
  onTelegramUsernameChange: (telegramUsername: string) => void;
  onChannelLocaleChange: (channel: NotificationService, locale: Locale) => void;
};

type ChannelLanguageSelectProps = {
  channel: NotificationService;
  value: Locale;
  onChange: (channel: NotificationService, locale: Locale) => void;
};

/** The language one channel's alerts are written in. Each language is named in itself ("Čeština"). */
const ChannelLanguageSelect = ({ channel, value, onChange }: ChannelLanguageSelectProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <Field label={t.channelLanguageLabels[channel]} className="sm:w-44 sm:shrink-0">
      {control => (
        <Select
          {...control}
          value={value}
          onChange={e => {
            if (isLocale(e.target.value)) onChange(channel, e.target.value);
          }}
        >
          {LOCALES.map(locale => (
            <option key={locale} value={locale} lang={LOCALE_INFO[locale].htmlLang}>
              {LOCALE_INFO[locale].name}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
};

/** A channel's recipient with its language beside it (below it on narrow screens). */
const ChannelRow = ({ children, language }: { children: ReactNode; language: ReactNode }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
    <div className="min-w-0 flex-1">{children}</div>
    {language}
  </div>
);

/**
 * Email, Signal and Telegram recipient inputs, each with its language and shown only while its service is selected.
 */
export const RecipientFields = ({
  emailFieldId,
  signalFieldId,
  telegramFieldId,
  services,
  email,
  signalRecipient,
  telegramUsername,
  channelLocales,
  emailError,
  signalError,
  telegramError,
  onEmailChange,
  onSignalRecipientChange,
  onTelegramUsernameChange,
  onChannelLocaleChange,
}: RecipientFieldsProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  const language = (channel: NotificationService) => (
    <ChannelLanguageSelect channel={channel} value={channelLocales[channel]} onChange={onChannelLocaleChange} />
  );
  return (
    <>
      {services.includes("email") && (
        <ChannelRow language={language("email")}>
          <div id={emailFieldId} data-field="email">
            <Field label={t.emailLabel} description={t.emailDescription} error={emailError} required>
              {control => (
                <Input
                  {...control}
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={e => onEmailChange(e.target.value)}
                  placeholder={t.emailPlaceholder}
                />
              )}
            </Field>
          </div>
        </ChannelRow>
      )}
      {services.includes("signal") && (
        <ChannelRow language={language("signal")}>
          <div id={signalFieldId} data-field="signalRecipient">
            <Field label={t.signalLabel} description={t.signalDescription} error={signalError} required>
              {control => (
                <Input
                  {...control}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={signalRecipient}
                  onChange={e => onSignalRecipientChange(e.target.value)}
                  placeholder="alice.42"
                />
              )}
            </Field>
          </div>
        </ChannelRow>
      )}
      {services.includes("telegram") && (
        <ChannelRow language={language("telegram")}>
          <TelegramUsernameField
            id={telegramFieldId}
            value={telegramUsername}
            error={telegramError}
            onChange={onTelegramUsernameChange}
          />
        </ChannelRow>
      )}
    </>
  );
};
