import type { ReactNode } from "react";
import { Alert } from "~~/components/ui/Alert";

export const CALLOUT_TONES = ["info", "warning"] as const;

type CalloutTone = (typeof CALLOUT_TONES)[number];

type CalloutProps = {
  tone?: CalloutTone;
  children: ReactNode;
};

const TONE_LABELS: Record<CalloutTone, string> = {
  info: "Note",
  warning: "Warning",
};

/**
 * A note or a warning inside an article: the status tint, its icon and a visible word, so the colour is never the
 * only signal. It is part of the page from the start, so it is a note, not a live alert.
 */
export const Callout = ({ tone = "info", children }: CalloutProps) => {
  const variant = tone in TONE_LABELS ? tone : "info";
  return (
    <Alert
      variant={variant}
      className="my-6"
      title={
        <>
          {TONE_LABELS[variant]}
          {/* screen readers hear "Warning: Delete alerts ...", not "Warning Delete alerts ..." */}
          <span className="sr-only">: </span>
        </>
      }
    >
      {children}
    </Alert>
  );
};
