import { useId } from "react";
import { FIELD_LABEL_CLASS } from "~~/components/custom/notifications/styles";

type TelegramConnectFieldProps = {
  chatId: string | undefined;
  username: string | null | undefined;
  /** The bot link while a handshake waits for the user, in case the Telegram tab could not be opened. */
  deepLink: string | undefined;
  isConnecting: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export const TelegramConnectField = ({
  chatId,
  username,
  deepLink,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: TelegramConnectFieldProps) => {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId}>
      <p id={headingId} className={FIELD_LABEL_CLASS}>
        Telegram
      </p>
      {chatId ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <div className="text-sm text-emerald-700 dark:text-emerald-400 break-all">
            ✅ Connected{username ? ` as @${username}` : ""}
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="text-xs px-2 py-1 rounded-md border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full px-3 py-2 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-sm font-medium hover:bg-sky-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? "Waiting for Telegram… (open the bot and press Start)" : "Connect Telegram"}
          </button>
          {deepLink && (
            <p className="text-xs text-base-content/70 dark:text-gray-400">
              Telegram did not open?{" "}
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="link font-medium text-sky-700 dark:text-sky-300"
              >
                Open Telegram
              </a>
            </p>
          )}
          <p className="text-xs text-base-content/70 dark:text-gray-400">
            Opens our bot in Telegram. Press <strong>Start</strong> there to link this wallet to your chat.
          </p>
        </div>
      )}
    </div>
  );
};
