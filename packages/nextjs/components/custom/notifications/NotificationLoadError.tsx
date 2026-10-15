import { RotateCw } from "lucide-react";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { Alert, Button } from "~~/components/ui";

type NotificationLoadErrorProps = {
  isRetrying: boolean;
  onRetry: () => void;
};

export const NotificationLoadError = ({ isRetrying, onRetry }: NotificationLoadErrorProps) => (
  <NotificationCard isActive={false}>
    <Alert
      variant="destructive"
      // Only the message is announced, so the button's label changing does not repeat it.
      title={<span role="alert">Notification settings did not load</span>}
      action={
        <Button variant="outline" size="sm" loading={isRetrying} loadingText="Retrying" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      }
    >
      Check your connection and try again.
    </Alert>
  </NotificationCard>
);
