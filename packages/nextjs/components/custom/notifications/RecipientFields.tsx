import { FIELD_LABEL_CLASS, TEXT_INPUT_CLASS } from "~~/components/custom/notifications/styles";
import type { NotificationService } from "~~/types/notifications";

type RecipientFieldsProps = {
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  onEmailChange: (email: string) => void;
  onSignalRecipientChange: (signalRecipient: string) => void;
};

/** Email and Signal recipient inputs, each shown only while its service is selected. */
export const RecipientFields = ({
  services,
  email,
  signalRecipient,
  onEmailChange,
  onSignalRecipientChange,
}: RecipientFieldsProps) => (
  <>
    {services.includes("email") && (
      <div>
        <label className={FIELD_LABEL_CLASS}>Email address</label>
        <input
          type="email"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className={TEXT_INPUT_CLASS}
        />
        <p className="text-xs text-base-content/70 dark:text-gray-400 mt-1">Alerts will be sent to this address.</p>
      </div>
    )}
    {services.includes("signal") && (
      <div>
        <label className={FIELD_LABEL_CLASS}>Signal username</label>
        <input
          type="text"
          value={signalRecipient}
          onChange={e => onSignalRecipientChange(e.target.value)}
          placeholder="@alice.42"
          className={TEXT_INPUT_CLASS}
        />
        <p className="text-xs text-base-content/70 dark:text-gray-400 mt-1">
          Find your username in Signal → Settings → Profile. Format: alice.42
        </p>
      </div>
    )}
  </>
);
