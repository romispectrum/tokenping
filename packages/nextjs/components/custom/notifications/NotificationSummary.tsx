import type { ReactNode } from "react";
import { SERVICE_ICONS } from "~~/components/custom/notifications/serviceIcons";
import { Alert, Badge } from "~~/components/ui";
import { AVAILABLE_SERVICES } from "~~/constants/notifications";
import { useLocale } from "~~/i18n/LocaleProvider";
import { formatDecimal } from "~~/i18n/format";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import type { NotificationService } from "~~/types/notifications";

type NotificationSummaryProps = {
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  telegramChatId: string | undefined;
  telegramUsername: string | null | undefined;
  threshold: number;
  currentHealthFactor: string;
  showBelowThresholdWarning: boolean;
};

const SummaryRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="m-0 min-w-0 break-all text-foreground sm:text-right">{children}</dd>
  </div>
);

export const NotificationSummary = ({
  services,
  email,
  signalRecipient,
  telegramChatId,
  telegramUsername,
  threshold,
  currentHealthFactor,
  showBelowThresholdWarning,
}: NotificationSummaryProps) => {
  const locale = useLocale();
  const t = ALERTS_MESSAGES[locale];
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
        {services.includes("email") && email && <SummaryRow label={t.summaryEmail}>{email}</SummaryRow>}
        {services.includes("signal") && signalRecipient && (
          <SummaryRow label={t.summarySignal}>@{signalRecipient}</SummaryRow>
        )}
        {services.includes("telegram") && telegramChatId && (
          <SummaryRow label={t.summaryTelegram}>
            {telegramUsername ? `@${telegramUsername}` : t.summaryTelegramLinked}
          </SummaryRow>
        )}
        <SummaryRow label={t.summaryThreshold}>
          <span className="tabular-nums">{thresholdText}</span>
        </SummaryRow>
      </dl>
      {showBelowThresholdWarning && (
        <Alert variant="warning" title={t.belowThresholdTitle}>
          {t.belowThresholdDescription(formatDecimal(locale, currentHealthFactor), thresholdText)}
        </Alert>
      )}
    </div>
  );
};
