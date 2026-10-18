import type { ReactNode } from "react";
import { TestSendButton } from "~~/components/custom/notifications/TestSendButton";
import { SERVICE_ICONS } from "~~/components/custom/notifications/serviceIcons";
import { Alert, Badge } from "~~/components/ui";
import { AVAILABLE_SERVICES, TEST_SEND_COOLDOWN_MINUTES, getTelegramBotUsername } from "~~/constants/notifications";
import { useTelegramUsernameStatus } from "~~/hooks/custom/useTelegramUsernameStatus";
import { useLocale } from "~~/i18n/LocaleProvider";
import { formatDecimal } from "~~/i18n/format";
import { LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import type { NotificationService } from "~~/types/notifications";

/** The "Send test" buttons, one per saved channel. Absent without paid access: the server would refuse the send. */
export type SummaryTestSends = {
  /** Milliseconds until `channel` can send another test; 0 when it can now. */
  waitFor: (channel: NotificationService) => number;
  /** The channel whose test is on its way. */
  sendingChannel?: NotificationService;
  onSend: (channel: NotificationService) => void;
};

type NotificationSummaryProps = {
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  /** As saved: lowercased, without "@". */
  telegramUsername: string;
  /** The language each channel's alerts are written in. */
  channelLocales: Record<NotificationService, Locale>;
  threshold: number;
  currentHealthFactor: string;
  showBelowThresholdWarning: boolean;
  testSends?: SummaryTestSends;
};

type SummaryRowProps = { label: string; children: ReactNode; language?: ReactNode; action?: ReactNode };

const SummaryRow = ({ label, children, language, action }: SummaryRowProps) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="m-0 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-foreground sm:justify-end sm:text-right">
      <span className="min-w-0 break-all">{children}</span>
      {language}
      {action}
    </dd>
  </div>
);

export const NotificationSummary = ({
  services,
  email,
  signalRecipient,
  telegramUsername,
  channelLocales,
  threshold,
  currentHealthFactor,
  showBelowThresholdWarning,
  testSends,
}: NotificationSummaryProps) => {
  const locale = useLocale();
  const t = ALERTS_MESSAGES[locale];
  const showsTelegram = services.includes("telegram") && Boolean(telegramUsername);
  const telegram = useTelegramUsernameStatus(showsTelegram ? telegramUsername : "");
  const bot = getTelegramBotUsername();
  const testButton = (channel: NotificationService, isUnavailable = false) =>
    testSends && (
      <TestSendButton
        channelName={t.serviceNames[channel]}
        waitMs={testSends.waitFor(channel)}
        isSending={testSends.sendingChannel === channel}
        isBusy={testSends.sendingChannel !== undefined && testSends.sendingChannel !== channel}
        isUnavailable={isUnavailable}
        onSend={() => testSends.onSend(channel)}
      />
    );
  // The language after the recipient, named in itself ("Čeština"), so a wrong pick is easy to spot.
  const language = (channel: NotificationService) => {
    const { name, htmlLang } = LOCALE_INFO[channelLocales[channel]];
    return (
      <span className="text-muted-foreground">
        <span className="sr-only">{`${t.summaryLanguage}: `}</span>
        <span lang={htmlLang}>{name}</span>
      </span>
    );
  };
  const showsEmail = services.includes("email") && Boolean(email);
  const showsSignal = services.includes("signal") && Boolean(signalRecipient);
  // The user's own number, written the way the form takes it: "1,5" in Czech.
  const thresholdText = formatDecimal(locale, threshold);
  return (
    <div className="flex flex-col gap-4">
      <dl className="m-0 flex flex-col gap-3 text-sm">
        <SummaryRow label={t.summaryServices}>
          {services.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 sm:justify-end">
              {services.map(serviceId => {
                if (!AVAILABLE_SERVICES.some(s => s.id === serviceId)) return null;
                const Icon = SERVICE_ICONS[serviceId];
                return (
                  <li key={serviceId}>
                    <Badge variant="neutral">
                      <Icon aria-hidden="true" />
                      {t.serviceNames[serviceId]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className="text-muted-foreground">{t.summaryNoServices}</span>
          )}
        </SummaryRow>
        {showsEmail && (
          <SummaryRow label={t.summaryEmail} language={language("email")} action={testButton("email")}>
            {email}
          </SummaryRow>
        )}
        {showsSignal && (
          <SummaryRow label={t.summarySignal} language={language("signal")} action={testButton("signal")}>
            @{signalRecipient}
          </SummaryRow>
        )}
        {showsTelegram && (
          // A username that has not pressed Start cannot get a message yet; the warning below says what to do.
          <SummaryRow
            label={t.summaryTelegram}
            language={language("telegram")}
            action={testButton("telegram", telegram.status === "notLinked")}
          >
            @{telegramUsername}
          </SummaryRow>
        )}
        <SummaryRow label={t.summaryThreshold}>
          <span className="tabular-nums">{thresholdText}</span>
        </SummaryRow>
      </dl>
      {testSends && (showsEmail || showsSignal || showsTelegram) && (
        <p className="m-0 text-sm text-muted-foreground">{t.testLimitNote(TEST_SEND_COOLDOWN_MINUTES)}</p>
      )}
      {/* Saved, but no alert can reach Telegram until that account presses Start in the bot. */}
      {showsTelegram && telegram.status === "notLinked" && bot && (
        <Alert variant="warning" title={t.summaryTelegramNotLinked(bot)}>
          <a href={`https://t.me/${bot}`} target="_blank" rel="noopener noreferrer">
            {t.openBot(bot)}
            {/* the space sits outside the hidden text, so the link's accessible name keeps it */}{" "}
            <span className="sr-only">{t.opensInNewTab}</span>
          </a>
        </Alert>
      )}
      {showBelowThresholdWarning && (
        <Alert variant="warning" title={t.belowThresholdTitle}>
          {t.belowThresholdDescription(formatDecimal(locale, currentHealthFactor), thresholdText)}
        </Alert>
      )}
    </div>
  );
};
