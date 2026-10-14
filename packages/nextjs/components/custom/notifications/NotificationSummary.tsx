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
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-content/70 dark:text-gray-400">Services:</span>
      <div className="flex items-center gap-1.5">
        {services.length > 0 ? (
          services.map(serviceId => {
            const service = AVAILABLE_SERVICES.find(s => s.id === serviceId);
            return service ? (
              <span
                key={serviceId}
                className="text-xs px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
              >
                {service.icon} {service.name}
              </span>
            ) : null;
          })
        ) : (
          <span className="text-xs text-base-content/60 dark:text-gray-500">None selected</span>
        )}
      </div>
    </div>
    {services.includes("email") && email && (
      <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base-content/70 dark:text-gray-400 shrink-0">Email:</span>
        <span className="min-w-0 break-all text-base-content font-medium dark:text-white" title={email}>
          {email}
        </span>
      </div>
    )}
    {services.includes("signal") && signalRecipient && (
      <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base-content/70 dark:text-gray-400 shrink-0">Signal:</span>
        <span className="min-w-0 break-all text-base-content font-medium dark:text-white" title={signalRecipient}>
          @{signalRecipient}
        </span>
      </div>
    )}
    {services.includes("telegram") && telegramChatId && (
      <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base-content/70 dark:text-gray-400 shrink-0">Telegram:</span>
        <span className="min-w-0 break-all text-base-content font-medium dark:text-white">
          {telegramUsername ? `@${telegramUsername}` : "linked"}
        </span>
      </div>
    )}
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-content/70 dark:text-gray-400">Threshold:</span>
      <span className="text-base-content font-medium dark:text-white">{threshold}</span>
    </div>
    {showBelowThresholdWarning && (
      <div className="mt-2 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          ⚠️ Current Health Factor ({currentHealthFactor}) is below your threshold!
        </p>
      </div>
    )}
  </div>
);
