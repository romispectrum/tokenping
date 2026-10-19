import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button, Field, Input } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import { submitAttributionAnswer } from "~~/services/notifications/attributionClient";
import { ATTRIBUTION_MAX_LENGTH, parseAttributionAnswer } from "~~/services/notifications/attributionInput";
import { notification } from "~~/utils/scaffold-eth";

type AttributionPromptProps = {
  /** Take focus on mount, so keyboard and screen-reader users land on the question that replaced the Save button. */
  autoFocus?: boolean;
  /** Called after a successful Send, before onClose, so the card can announce it. */
  onSent?: () => void;
  /** Called after Skip or a successful Send. */
  onClose: () => void;
};

/**
 * Optional free-text "How did you hear about Tokenping?" question (free text rather than a list, so it also catches
 * channels nobody thought to offer, like a private recommendation or an AI assistant). The answer is stored for the
 * signed-in wallet.
 */
export const AttributionPrompt = ({ autoFocus = false, onSent, onClose }: AttributionPromptProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAnswer = answer.trim() !== "";
  // "Enter an answer" no longer applies once there is one; other messages stay until the next Send.
  const shownError = errorMessage === t.attributionEmpty && hasAnswer ? null : errorMessage;

  useEffect(() => {
    // The form, not the input: screen readers announce its name, and phones do not pop up a keyboard for an
    // optional question.
    if (autoFocus) formRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSending) return;
    // Send stays enabled (a disabled button gives no reason and drops out of the tab order), so say what is missing.
    if (!hasAnswer) {
      setErrorMessage(t.attributionEmpty);
      inputRef.current?.focus();
      return;
    }
    // The server runs the same check; doing it here lets the message say what to fix.
    const parsed = parseAttributionAnswer(answer);
    if ("error" in parsed) {
      setErrorMessage(t.attributionInvalid(parsed.error));
      return;
    }
    setIsSending(true);
    setErrorMessage(null);
    try {
      await submitAttributionAnswer(parsed.value);
      notification.success(t.answerSent);
      onSent?.();
      onClose();
    } catch (error) {
      console.error("Failed to send attribution answer:", error);
      setErrorMessage(t.attributionSendFailed);
      setIsSending(false);
    }
  };

  return (
    <form
      ref={formRef}
      tabIndex={-1}
      // The visible label's text: the form is announced by the question when it takes focus.
      aria-label={t.attributionFormLabel}
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
    >
      <Field label={t.attributionQuestion} optional description={t.attributionDescription} error={shownError}>
        {control => (
          <Input
            {...control}
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            maxLength={ATTRIBUTION_MAX_LENGTH}
            autoComplete="off"
          />
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="secondary" size="sm" loading={isSending} loadingText={t.sending}>
          {t.sendAnswer}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t.skip}
        </Button>
      </div>
    </form>
  );
};
