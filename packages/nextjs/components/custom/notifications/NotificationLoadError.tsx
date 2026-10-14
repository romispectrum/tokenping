import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";

type NotificationLoadErrorProps = {
  isRetrying: boolean;
  onRetry: () => void;
};

export const NotificationLoadError = ({ isRetrying, onRetry }: NotificationLoadErrorProps) => (
  <NotificationCard isActive={false}>
    <div className="flex items-center justify-between gap-3">
      {/* Not DaisyUI's text-error: its #ff8863 is 2.35:1 on the light theme's white, below WCAG AA. */}
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        Could not load your notification settings.
      </p>
      <button type="button" onClick={onRetry} disabled={isRetrying} className="btn btn-sm btn-outline">
        {isRetrying ? "Retrying..." : "Retry"}
      </button>
    </div>
  </NotificationCard>
);
