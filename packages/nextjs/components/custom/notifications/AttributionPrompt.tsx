import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { FIELD_LABEL_CLASS, TEXT_INPUT_CLASS } from "~~/components/custom/notifications/styles";
import { submitAttributionAnswer } from "~~/services/notifications/attributionClient";
import { ATTRIBUTION_MAX_LENGTH, parseAttributionAnswer } from "~~/services/notifications/attributionInput";
import { notification } from "~~/utils/scaffold-eth";

const SEND_FAILED = "Couldn't send your answer. Try again or skip.";

type AttributionPromptProps = {
  /** The wallet the answer is stored for. */
  address: string;
  /** Take focus on mount, so keyboard and screen-reader users land on the question that replaced the Save button. */
  autoFocus?: boolean;
  /** Called after Skip or a successful Send. */
  onClose: () => void;
};

/**
 * Optional free-text "How did you hear about Tokenping?" question (free text rather than a list, so it also catches
 * channels nobody thought to offer, like a private recommendation or an AI assistant).
 */
export const AttributionPrompt = ({ address, autoFocus = false, onClose }: AttributionPromptProps) => {
  const labelId = useId();
  const inputId = useId();
  const hintId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [answer, setAnswer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canSend = answer.trim() !== "" && !isSending;

  useEffect(() => {
    // The form, not the input: screen readers announce its name, and phones do not pop up a keyboard for an
    // optional question.
    if (autoFocus) formRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    // The server runs the same check; doing it here lets the message say what to fix.
    const parsed = parseAttributionAnswer(answer);
    if ("error" in parsed) {
      setErrorMessage(parsed.error);
      return;
    }
    setIsSending(true);
    setErrorMessage(null);
    try {
      await submitAttributionAnswer(address, parsed.value);
      notification.success("Thanks for telling us.");
      onClose();
    } catch (error) {
      console.error("Failed to send attribution answer:", error);
      setErrorMessage(SEND_FAILED);
      setIsSending(false);
    }
  };

  return (
    <form
      ref={formRef}
      tabIndex={-1}
      aria-labelledby={labelId}
      onSubmit={handleSubmit}
      className="mt-4 pt-4 border-t border-base-300 dark:border-white/10"
    >
      <label id={labelId} htmlFor={inputId} className={FIELD_LABEL_CLASS}>
        How did you hear about Tokenping? <span className="text-base-content/70 dark:text-gray-400">(optional)</span>
      </label>
      <input
        id={inputId}
        type="text"
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        maxLength={ATTRIBUTION_MAX_LENGTH}
        autoComplete="off"
        aria-describedby={hintId}
        className={TEXT_INPUT_CLASS}
      />
      <p id={hintId} className="text-xs text-base-content/70 dark:text-gray-400 mt-1">
        Helps us learn which channels work. Saved with your wallet address.
      </p>
      {errorMessage && (
        // Not DaisyUI's text-error: its #ff8863 is below WCAG AA on the light theme's white.
        <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">
          {errorMessage}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <button type="submit" disabled={!canSend} className="btn btn-sm btn-outline">
          {isSending ? "Sending..." : "Send"}
        </button>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
          Skip
        </button>
      </div>
    </form>
  );
};
