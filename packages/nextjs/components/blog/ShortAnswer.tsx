import type { ReactNode } from "react";
import { Kicker } from "~~/components/ui/Kicker";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";

type ShortAnswerProps = {
  /** Bound by the post page (blogMdxComponents); articles never pass it. */
  locale?: Locale;
  children: ReactNode;
};

/**
 * The two or three sentence answer directly under the H1, at lead size in a flat card. The label is a kicker, not a
 * heading, so the outline stays H1 then H2.
 */
export const ShortAnswer = ({ locale = DEFAULT_LOCALE, children }: ShortAnswerProps) => (
  <div className="my-8 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
    <Kicker>{BLOG_MESSAGES[locale].shortAnswer}</Kicker>
    <div className="text-lead [&>p]:my-0 [&>p+p]:mt-4">{children}</div>
  </div>
);
