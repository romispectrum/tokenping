import { Field, Input } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import type { NotificationService } from "~~/types/notifications";

type RecipientFieldsProps = {
  /** The fields' ids, for links to them (the error summary). */
  emailFieldId?: string;
  signalFieldId?: string;
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  /** Shown after a failed Save. */
  emailError?: string;
  signalError?: string;
  onEmailChange: (email: string) => void;
  onSignalRecipientChange: (signalRecipient: string) => void;
};

/** Email and Signal recipient inputs, each shown only while its service is selected. */
export const RecipientFields = ({
  emailFieldId,
  signalFieldId,
  services,
  email,
  signalRecipient,
  emailError,
  signalError,
  onEmailChange,
  onSignalRecipientChange,
}: RecipientFieldsProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <>
      {services.includes("email") && (
        <div id={emailFieldId} data-field="email">
          <Field label={t.emailLabel} description={t.emailDescription} error={emailError} required>
            {control => (
              <Input
                {...control}
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={e => onEmailChange(e.target.value)}
                placeholder={t.emailPlaceholder}
              />
            )}
          </Field>
        </div>
      )}
      {services.includes("signal") && (
        <div id={signalFieldId} data-field="signalRecipient">
          <Field label={t.signalLabel} description={t.signalDescription} error={signalError} required>
            {control => (
              <Input
                {...control}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={signalRecipient}
                onChange={e => onSignalRecipientChange(e.target.value)}
                placeholder="alice.42"
              />
            )}
          </Field>
        </div>
      )}
    </>
  );
};
