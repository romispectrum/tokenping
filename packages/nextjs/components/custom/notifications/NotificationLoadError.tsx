import { RotateCw } from "lucide-react";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { Alert, Button } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type NotificationLoadErrorProps = {
  isRetrying: boolean;
  onRetry: () => void;
};

export const NotificationLoadError = ({ isRetrying, onRetry }: NotificationLoadErrorProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <NotificationCard isActive={false}>
      <Alert
        variant="destructive"
        // Only the message is announced, so the button's label changing does not repeat it.
        title={<span role="alert">{t.loadErrorTitle}</span>}
        action={
          <Button variant="outline" size="sm" loading={isRetrying} loadingText={t.retrying} onClick={onRetry}>
            <RotateCw aria-hidden="true" />
            {t.tryAgain}
          </Button>
        }
      >
        {t.loadErrorDescription}
      </Alert>
    </NotificationCard>
  );
};
