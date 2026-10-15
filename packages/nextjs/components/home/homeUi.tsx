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
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { EXTERNAL_LINK_REL } from "~~/constants/links";

// Shared building blocks of the homepage sections. Server Components only.

/**
 * A paragraph of running text. Inline links inside it are plain <a> or <Link> without a class: the base styles give
 * them the link colour and an underline.
 */
export const HOME_TEXT_CLASS_NAME = "m-0 leading-[1.75]";

/** A marketing card: flat card surface plus the card shadow (none in dark), 24px padding (28px from md). */
export const HOME_CARD_CLASS_NAME =
  "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-card md:p-7";

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
  surface?: SectionSurface;
  width?: keyof typeof CONTENT_WIDTHS;
  children: ReactNode;
};

/** A section with the one header formula: one <h2>, so the page outline is h1, h2, h3 with no skipped level. */
export const HomeSection = ({ id, title, surface = "plain", width = "prose", children }: HomeSectionProps) => (
  <section id={id} aria-labelledby={`${id}-title`} className={cx(SECTION_CLASS_NAME, SECTION_SURFACES[surface])}>
    <Container>
      <SectionHeader id={`${id}-title`} title={title} />
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

/** Says what the button does before the click (marketing plan §2.5). */
export const DASHBOARD_CTA_MICROCOPY = `Connect a wallet to see your Aave V3 health factor on ${AAVE_MARKETS.length} networks. Viewing is read-only.`;

type DashboardCtaProps = {
  /** A quieter second action next to it (inverse, never pink) that jumps to a section of the same page. */
  secondary?: { label: string; sectionId: string };
};

/**
 * The page's one primary action, used in the hero and again at the end: the same words, the same target, the
 * view's one pink element. Stacked full width (up to 384px) on phones, side by side from sm.
 */
export const DashboardCta = ({ secondary }: DashboardCtaProps) => (
  <div className="mt-8 flex flex-col items-center gap-3">
    <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
      <Link href="/aave" className={buttonClasses({ size: "lg", className: "w-full sm:w-auto sm:min-w-40" })}>
        Open the free dashboard
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
    <p className="m-0 max-w-md text-center text-sm text-pretty text-foreground">{DASHBOARD_CTA_MICROCOPY}</p>
  </div>
);
