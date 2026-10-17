import { CircleCheck, ExternalLink, Info, TriangleAlert } from "lucide-react";
import { Field, Input, Spinner } from "~~/components/ui";
import { getTelegramBotUsername } from "~~/constants/notifications";
import { type TelegramUsernameLinkStatus, useTelegramUsernameStatus } from "~~/hooks/custom/useTelegramUsernameStatus";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type TelegramUsernameFieldProps = {
  /** The field's id, for links to it (the error summary). */
  id?: string;
  value: string;
  /** Shown after a failed Save. */
  error?: string;
  onChange: (value: string) => void;
};

type TelegramLinkStatusLineProps = {
  status: TelegramUsernameLinkStatus;
  username: string | null;
};

/**
 * Whether the typed username can get alerts yet: linked, or "press Start in the bot once" with a link to the bot.
 * A bot cannot message someone who never wrote to it, so that one Start is the only step besides typing the name.
 */
export const TelegramLinkStatusLine = ({ status, username }: TelegramLinkStatusLineProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  const bot = getTelegramBotUsername();
  if (status === "idle" || !username) return null;

  if (status === "checking") {
    return (
      <p className="m-0 flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {t.telegramChecking}
      </p>
    );
  }
  if (status === "linked") {
    return (
      <p className="m-0 flex items-start gap-2 text-sm text-foreground">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
        {t.telegramLinked(username)}
      </p>
    );
  }
  if (status === "unknown") {
    return (
      <p className="m-0 flex items-start gap-2 text-sm text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {t.telegramStatusUnknown}
      </p>
    );
  }
  // Not linked yet. Without a configured bot there is no link to offer, so the text names the bot generically.
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl bg-warning-subtle px-3 py-2.5 text-sm text-foreground">
      <p className="m-0 flex items-start gap-2">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        {t.telegramPressStart(bot)}
      </p>
      {bot && (
        <a
          href={`https://t.me/${bot}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-link underline underline-offset-4 pointer-coarse:min-h-11"
        >
          {t.openBot(bot)}
          <ExternalLink aria-hidden="true" className="size-4" />
          {/* the space sits outside the hidden text, so the link's accessible name keeps it */}{" "}
          <span className="sr-only">{t.opensInNewTab}</span>
        </a>
      )}
    </div>
  );
};

/**
 * The Telegram username an alert goes to, typed like the Signal username, with its link status under it. The status
 * line is a live region, so "linked" is announced when the person comes back from pressing Start in the bot.
 */
export const TelegramUsernameField = ({ id, value, error, onChange }: TelegramUsernameFieldProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  const { status, username } = useTelegramUsernameStatus(value, { poll: true });
  return (
    <div id={id} data-field="telegram" className="flex flex-col gap-2">
      <Field label={t.telegramLabel} description={t.telegramDescription} error={error} required>
        {control => (
          <Input
            {...control}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={t.telegramPlaceholder}
          />
        )}
      </Field>
      <div role="status" aria-live="polite">
        <TelegramLinkStatusLine status={status} username={username} />
      </div>
    </div>
  );
};
