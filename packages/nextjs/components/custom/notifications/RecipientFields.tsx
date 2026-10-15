import { Field, Input } from "~~/components/ui";
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
}: RecipientFieldsProps) => (
  <>
    {services.includes("email") && (
      <div id={emailFieldId} data-field="email">
        <Field label="Email address" description="Alerts are sent to this address." error={emailError} required>
          {control => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              placeholder="you@example.com"
            />
          )}
        </Field>
      </div>
    )}
    {services.includes("signal") && (
      <div id={signalFieldId} data-field="signalRecipient">
        <Field
          label="Signal username"
          description="In Signal, open Settings, then Profile. It looks like alice.42."
          error={signalError}
          required
        >
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
