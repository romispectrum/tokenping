import { useId } from "react";
import { CircleCheck, ExternalLink, RotateCw, Send } from "lucide-react";
import { SUBTLE_DESTRUCTIVE_CLASS } from "~~/components/custom/notifications/styles";
import { Alert, Button } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type TelegramConnectFieldProps = {
  /** The group's id, for links to it (the error summary). */
  id?: string;
  chatId: string | undefined;
  username: string | null | undefined;
  /** The bot link while a handshake waits for the user, in case the Telegram tab could not be opened. */
  deepLink: string | undefined;
  /** The link status could not be read: offering Connect would treat a possibly linked wallet as unlinked. */
  isStatusUnknown: boolean;
  isCheckingStatus: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  /** Shown after a failed Save. */
  error?: string;
  onRetryStatus: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
};

const StatusUnknown = ({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <Alert
      variant="destructive"
      // Only the message is announced, so the button's label changing does not repeat it.
      title={<span role="alert">{t.telegramStatusUnknown}</span>}
      action={
        <Button variant="outline" size="sm" loading={isRetrying} loadingText={t.retrying} onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          {t.tryAgain}
        </Button>
      }
    />
  );
};

export const TelegramConnectField = ({
  id: groupId,
  chatId,
  username,
  deepLink,
  isStatusUnknown,
  isCheckingStatus,
  isConnecting,
  isDisconnecting,
  error,
  onRetryStatus,
  onConnect,
  onDisconnect,
}: TelegramConnectFieldProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const showsHelp = !chatId && !isStatusUnknown;
  const describedBy = [showsHelp ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <fieldset
      id={groupId}
      data-field="telegram"
      aria-describedby={describedBy || undefined}
      className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
    >
      <legend className="mb-2 p-0 text-sm leading-snug font-medium text-foreground">{t.telegramLegend}</legend>
      {chatId ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted py-1 pr-1 pl-3">
          <p className="m-0 flex min-w-0 items-center gap-2 text-sm break-all text-foreground">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
            {t.telegramConnected(username)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className={SUBTLE_DESTRUCTIVE_CLASS}
            loading={isDisconnecting}
            loadingText={t.disconnecting}
            onClick={onDisconnect}
          >
            {t.disconnectTelegram}
          </Button>
        </div>
      ) : isStatusUnknown ? (
        <StatusUnknown isRetrying={isCheckingStatus} onRetry={onRetryStatus} />
      ) : (
        <>
          <Button
            variant="outline"
            className="w-full sm:w-auto sm:self-start"
            loading={isConnecting}
            loadingText={t.waitingForTelegram}
            onClick={onConnect}
          >
            <Send aria-hidden="true" />
            {t.connectTelegram}
          </Button>
          {deepLink && (
            <p className="m-0 text-sm text-muted-foreground">
              {t.telegramDidNotOpen}{" "}
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-link underline underline-offset-4"
              >
                {t.openTelegram}
                <ExternalLink aria-hidden="true" className="size-4" />{" "}
                <span className="sr-only">{t.opensInNewTab}</span>
              </a>
            </p>
          )}
          <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
            {t.telegramHelp.beforeStart}
            <span className="font-medium text-foreground">{t.telegramHelp.start}</span>
            {t.telegramHelp.afterStart}
          </p>
        </>
      )}
      {error ? (
        <p id={errorId} role="alert" className="m-0 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
};
