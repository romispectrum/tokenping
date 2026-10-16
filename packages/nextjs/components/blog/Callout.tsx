import type { ReactNode } from "react";
import { Alert } from "~~/components/ui/Alert";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";

export const CALLOUT_TONES = ["info", "warning"] as const;

type CalloutTone = (typeof CALLOUT_TONES)[number];

type CalloutProps = {
  tone?: CalloutTone;
  /** Bound by the post page (blogMdxComponents); articles never pass it. */
  locale?: Locale;
  children: ReactNode;
};

/**
 * A note or a warning inside an article: the status tint, its icon and a visible word, so the colour is never the
 * only signal. It is part of the page from the start, so it is a note, not a live alert.
 */
export const Callout = ({ tone = "info", locale = DEFAULT_LOCALE, children }: CalloutProps) => {
  const labels = BLOG_MESSAGES[locale].callout;
  const variant = tone in labels ? tone : "info";
  return (
    <Alert
      variant={variant}
      className="my-6"
      title={
        <>
          {labels[variant]}
          {/* screen readers hear "Warning: Delete alerts ...", not "Warning Delete alerts ..." */}
          <span className="sr-only">: </span>
        </>
      }
    >
      {children}
    </Alert>
  );
};
