import { Send } from "lucide-react";
import { Button } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type TestSendButtonProps = {
  /** The channel's name in the page's language ("Email", "E-mail", "Signal", "Telegram"). */
  channelName: string;
  /** Milliseconds until this channel can send another test; 0 when it can now. */
  waitMs: number;
  isSending: boolean;
  /** Another channel's test is on its way: one at a time. */
  isBusy: boolean;
  /** The channel cannot be reached yet (a Telegram username that has not pressed Start). */
  isUnavailable?: boolean;
  onSend: () => void;
};

/**
 * "Send test" next to a channel in an alert's summary. While the channel cools down it reads "Again in 12 min" and
 * is off; the server enforces the limit too, so this only saves a refused click. The channel's name is in the
 * accessible name, since three of these sit in one list.
 */
export const TestSendButton = ({
  channelName,
  waitMs,
  isSending,
  isBusy,
  isUnavailable = false,
  onSend,
}: TestSendButtonProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  const coolingDown = waitMs > 0;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      loading={isSending}
      loadingText={t.sendingTest}
      disabled={coolingDown || isBusy || isUnavailable}
      onClick={onSend}
    >
      <Send aria-hidden="true" />
      {coolingDown ? t.testAgainIn(Math.ceil(waitMs / 60_000)) : t.sendTest}
      {/* the space sits outside the hidden text, so the button's accessible name keeps it */}{" "}
      <span className="sr-only">({channelName})</span>
    </Button>
  );
};
