import { Container } from "~~/components/home/marketingLayout";
import { EXTERNAL_LINK_REL, SOCIAL_LINKS } from "~~/constants/links";

// The X mark is a logo, not an icon: drawn in currentColor.
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/**
 * The skip link to `<main id="main">`. It lives here because this strip is the first thing the app shell renders, so
 * the link is the first tab stop on every page; if the strip goes, the link moves to the top of the header.
 */
const SkipLink = () => (
  <a
    href="#main"
    // The padding sits on focus: not-sr-only resets padding to 0 and comes later in the stylesheet than px-4 and py-3.
    className="sr-only rounded-lg bg-background text-sm font-medium text-foreground shadow-card focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-3"
  >
    Skip to content
  </a>
);

/** A quiet strip above the header: the beta status in words and the X account. Muted surface, no pink. */
export const BetaBanner = () => {
  return (
    <>
      <SkipLink />
      <section aria-label="App status and social" className="border-b border-border bg-muted text-foreground">
        <Container className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 py-1.5 text-sm">
          <span className="font-medium">Tokenping is in beta</span>
          <span aria-hidden className="hidden text-muted-foreground sm:inline">
            ·
          </span>
          <a
            href={SOCIAL_LINKS.x}
            target="_blank"
            rel={EXTERNAL_LINK_REL}
            className="inline-flex items-center gap-1.5 rounded-sm text-link underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11"
            // The visible words plus the mark's name, so speech input can say "Follow us on".
            aria-label="Follow us on X"
          >
            <span>Follow us on</span>
            <XIcon className="size-4" />
          </a>
        </Container>
      </section>
    </>
  );
};
