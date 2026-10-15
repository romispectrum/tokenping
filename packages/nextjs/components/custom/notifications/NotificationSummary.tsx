import type { ReactNode } from "react";
import { SERVICE_ICONS } from "~~/components/custom/notifications/serviceIcons";
import { Alert, Badge } from "~~/components/ui";
import { AVAILABLE_SERVICES } from "~~/constants/notifications";
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
}: NotificationSummaryProps) => (
  <div className="flex flex-col gap-4">
    <dl className="m-0 flex flex-col gap-3 text-sm">
      <SummaryRow label="Services">
        {services.length > 0 ? (
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 sm:justify-end">
            {services.map(serviceId => {
              const service = AVAILABLE_SERVICES.find(s => s.id === serviceId);
              if (!service) return null;
              const Icon = SERVICE_ICONS[serviceId];
              return (
                <li key={serviceId}>
                  <Badge variant="neutral">
                    <Icon aria-hidden="true" />
                    {service.name}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="text-muted-foreground">None selected</span>
        )}
      </SummaryRow>
      {services.includes("email") && email && <SummaryRow label="Email">{email}</SummaryRow>}
      {services.includes("signal") && signalRecipient && <SummaryRow label="Signal">@{signalRecipient}</SummaryRow>}
      {services.includes("telegram") && telegramChatId && (
        <SummaryRow label="Telegram">{telegramUsername ? `@${telegramUsername}` : "Linked"}</SummaryRow>
      )}
      <SummaryRow label="Threshold">
        <span className="tabular-nums">{threshold}</span>
      </SummaryRow>
    </dl>
    {showBelowThresholdWarning && (
      <Alert variant="warning" title="Below your alert threshold">
        Your current health factor ({currentHealthFactor}) is below your threshold of {threshold}.
      </Alert>
    )}
  </div>
);
