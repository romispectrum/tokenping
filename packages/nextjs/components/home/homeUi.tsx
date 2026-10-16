import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Container,
  SECTION_CLASS_NAME,
  SECTION_SURFACES,
  type SectionSurface,
} from "~~/components/home/marketingLayout";
import { SectionHeader } from "~~/components/ui/SectionHeader";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { cx } from "~~/components/ui/classNames";
import { AAVE_NETWORK_NAMES } from "~~/config/aaveConfig";
import { EXTERNAL_LINK_REL } from "~~/constants/links";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";
import { routePath } from "~~/i18n/routes";

// Shared building blocks of the homepage sections. Server Components only.

/**
 * A paragraph of running text. Inline links inside it are plain <a> or <Link> without a class: the base styles give
 * them the link colour and an underline.
 */
export const HOME_TEXT_CLASS_NAME = "m-0 leading-relaxed md:leading-[1.75]";

/** A marketing card: flat card surface plus the card shadow (none in dark), 20px padding (28px from md). */
export const HOME_CARD_CLASS_NAME =
  "rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card md:p-7";

const CONTENT_WIDTHS = {
  /** Running text at a reading measure. */
  prose: "mx-auto max-w-[72ch]",
  /** A column of cards. */
  list: "mx-auto max-w-[820px]",
  /** Grids that use the whole container. */
  wide: "",
} as const;

type HomeSectionProps = {
  /** The section's id (an in-page link target); the heading gets `${id}-title`. */
  id: string;
  title: string;
  /** One sentence under the heading, in the header formula's lead slot. */
  lead?: ReactNode;
  surface?: SectionSurface;
  width?: keyof typeof CONTENT_WIDTHS;
  children: ReactNode;
};

/** A section with the one header formula: one <h2>, so the page outline is h1, h2, h3 with no skipped level. */
export const HomeSection = ({ id, title, lead, surface = "plain", width = "prose", children }: HomeSectionProps) => (
  <section id={id} aria-labelledby={`${id}-title`} className={cx(SECTION_CLASS_NAME, SECTION_SURFACES[surface])}>
    <Container>
      <SectionHeader id={`${id}-title`} title={title} lead={lead} />
      <div className={CONTENT_WIDTHS[width] || undefined}>{children}</div>
    </Container>
  </section>
);

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
};

/** Same-tab link to another site, like the links in the articles. */
export const ExternalLink = ({ href, children }: ExternalLinkProps) => (
  <a href={href} rel={EXTERNAL_LINK_REL}>
    {children}
  </a>
);

/** The same link as a renderer for rich message text (i18n/messages/home), which places it in its own word order. */
export const externalLinkText = (href: string) =>
  function ExternalLinkText(text: string) {
    return <ExternalLink href={href}>{text}</ExternalLink>;
  };

type DashboardCtaProps = {
  locale: Locale;
  /** A quieter second action next to it (inverse, never pink) that jumps to a section of the same page. */
  secondary?: { label: string; sectionId: string };
  /** Centred by default; "start" lines it up with left-aligned text from lg (the split hero). */
  align?: "center" | "start";
};

/**
 * The page's one primary action, used in the hero and again at the end: the same words, the same target, the
 * view's one pink element. Stacked full width (up to 384px) on phones, side by side from sm.
 */
export const DashboardCta = ({ locale, secondary, align = "center" }: DashboardCtaProps) => (
  <div className={cx("mt-8 flex flex-col items-center gap-3", align === "start" && "lg:items-start")}>
    <div
      className={cx(
        "flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center",
        align === "start" && "lg:justify-start",
      )}
    >
      <Link
        href={routePath(locale, "dashboard")}
        className={buttonClasses({ size: "lg", className: "w-full sm:w-auto sm:min-w-40" })}
      >
        {HOME_MESSAGES[locale].dashboardCta}
        <ArrowRight aria-hidden="true" />
      </Link>
      {secondary ? (
        // A plain fragment link, not next/link: the browser then moves the keyboard's starting point to the section,
        // so the next Tab continues there instead of back in the hero.
        <a
          href={`#${secondary.sectionId}`}
          className={buttonClasses({ variant: "inverse", size: "lg", className: "w-full sm:w-auto sm:min-w-40" })}
        >
          {secondary.label}
        </a>
      ) : null}
    </div>
    {/* foreground, not muted: in the hero a glow can tint the card behind this line */}
    <p
      className={cx(
        "m-0 max-w-md text-center text-sm text-pretty text-foreground",
        align === "start" && "lg:text-left",
      )}
    >
      {/* Says what the button does before the click (marketing plan §2.5). */}
      {HOME_MESSAGES[locale].dashboardCtaMicrocopy(AAVE_NETWORK_NAMES.length)}
    </p>
  </div>
);
