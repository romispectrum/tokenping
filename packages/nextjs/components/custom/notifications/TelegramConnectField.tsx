import { useId } from "react";
import { CircleCheck, ExternalLink, RotateCw, Send } from "lucide-react";
import { SUBTLE_DESTRUCTIVE_CLASS } from "~~/components/custom/notifications/styles";
import { Alert, Button } from "~~/components/ui";

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

const StatusUnknown = ({ isRetrying, onRetry }: { isRetrying: boolean; onRetry: () => void }) => (
  <Alert
    variant="destructive"
    // Only the message is announced, so the button's label changing does not repeat it.
    title={<span role="alert">Couldn&apos;t check your Telegram link</span>}
    action={
      <Button variant="outline" size="sm" loading={isRetrying} loadingText="Retrying" onClick={onRetry}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    }
  />
);

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
      <legend className="mb-2 p-0 text-sm leading-snug font-medium text-foreground">Telegram</legend>
      {chatId ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted py-1 pr-1 pl-3">
          <p className="m-0 flex min-w-0 items-center gap-2 text-sm break-all text-foreground">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
            Connected{username ? ` as @${username}` : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className={SUBTLE_DESTRUCTIVE_CLASS}
            loading={isDisconnecting}
            loadingText="Disconnecting"
            onClick={onDisconnect}
          >
            Disconnect Telegram
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
            loadingText="Waiting for Telegram"
            onClick={onConnect}
          >
            <Send aria-hidden="true" />
            Connect Telegram
          </Button>
          {deepLink && (
            <p className="m-0 text-sm text-muted-foreground">
              Telegram did not open?{" "}
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-link underline underline-offset-4"
              >
                Open Telegram
                <ExternalLink aria-hidden="true" className="size-4" />{" "}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </p>
          )}
          <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
            Opens our bot in Telegram. Press <span className="font-medium text-foreground">Start</span> there to link
            this wallet to your chat.
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
