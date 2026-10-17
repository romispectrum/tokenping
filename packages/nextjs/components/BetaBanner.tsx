"use client";

import { EXTERNAL_LINK_REL, SOCIAL_LINKS } from "~~/constants/links";
import { useMessages } from "~~/i18n/LocaleProvider";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";

// The X mark is a logo, not an icon: drawn in currentColor.
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/**
 * The skip link to `<main id="main">`: the first thing the app shell renders, so it is the first tab stop on every
 * page. Visible only while focused, pinned to the top-left corner over the header.
 */
export const SkipLink = () => {
  const t = useMessages(COMMON_MESSAGES);
  return (
    <a
      href="#main"
      // The padding sits on focus: not-sr-only resets padding to 0 and comes later in the stylesheet than px-4 and py-3.
      className="sr-only rounded-lg bg-background text-sm font-medium text-foreground shadow-card focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-3"
    >
      {t.skipToContent}
    </a>
  );
};

/**
 * The beta status in words and the X account, as a tab on the right edge of the viewport, halfway down, so the
 * header sits at the very top of the page. Vertical writing: it reads top to bottom, with the mark after the words.
 * Fixed under the header's layer (the menu panel and the wallet modals cover it), a quiet surface, no pink. It
 * overlaps the page's right gutter, so on a phone it is a slim tab (14px type, about 28px wide) and takes the 44px
 * touch width only from sm, where the gutter has room for it; from sm the type is 18px.
 */
export const BetaBanner = () => {
  const t = useMessages(COMMON_MESSAGES);

  return (
    <section aria-label={t.beta.region} className="fixed top-1/2 right-0 z-30 -translate-y-1/2 print:hidden">
      {/* In vertical writing a flex row runs down the page, so the words, the dot and the link stack top to bottom. */}
      <div className="flex items-center gap-2.5 rounded-l-xl border border-r-0 border-border bg-muted/90 px-1 py-4 text-sm text-foreground shadow-card backdrop-blur-sm [writing-mode:vertical-rl] sm:px-2.5 sm:text-lg">
        <span className="font-medium">{t.beta.status}</span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <a
          href={SOCIAL_LINKS.x}
          target="_blank"
          rel={EXTERNAL_LINK_REL}
          className="inline-flex items-center justify-center gap-1.5 rounded-sm text-link underline decoration-1 underline-offset-4 hover:decoration-2 sm:pointer-coarse:min-w-11"
          // The visible words plus the mark's name, so speech input can say "Follow us on".
          aria-label={t.beta.followUsLabel}
        >
          <span>{t.beta.followUs}</span>
          <XIcon className="size-5" />
        </a>
      </div>
    </section>
  );
};
