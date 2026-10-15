import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ARTICLE_LINK_CLASS_NAME } from "~~/components/blog/MdxElements";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { EXTERNAL_LINK_REL } from "~~/constants/links";

// Shared building blocks of the homepage sections. Server Components only.

export const HOME_LINK_CLASS_NAME = ARTICLE_LINK_CLASS_NAME;

export const HOME_TEXT_CLASS_NAME = "my-2 leading-relaxed text-base-content/90 dark:text-gray-200";

export const HOME_H3_CLASS_NAME = "m-0 mt-5 mb-1 text-lg font-semibold leading-snug text-base-content";

type HomeSectionProps = {
  /** Also the id the section's aria-labelledby points at. */
  id: string;
  title: string;
  children: ReactNode;
};

/** A titled card: one <h2>, so the page outline is h1 → h2 → h3 with no skipped level. */
export const HomeSection = ({ id, title, children }: HomeSectionProps) => (
  <section
    aria-labelledby={id}
    className="rounded-3xl border border-base-300 bg-base-100 p-5 sm:p-6 md:p-8 dark:border-white/10 dark:bg-gray-900/60"
  >
    <h2 id={id} className="m-0 mb-3 text-xl sm:text-2xl font-bold leading-tight text-base-content">
      {title}
    </h2>
    {children}
  </section>
);

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
};

/** Same-tab link to another site, like the links in the articles. */
export const ExternalLink = ({ href, children }: ExternalLinkProps) => (
  <a href={href} rel={EXTERNAL_LINK_REL} className={HOME_LINK_CLASS_NAME}>
    {children}
  </a>
);

/** Says what the button does before the click (marketing plan §2.5). */
export const DASHBOARD_CTA_MICROCOPY = `Connect a wallet to see your Aave V3 health factor on ${AAVE_MARKETS.length} networks. Viewing is read-only.`;

/** The page's one primary action, used in the hero and again at the end: the same words, the same target. */
export const DashboardCta = () => (
  <div className="flex flex-col items-center gap-2">
    <Link href="/aave" className="btn btn-primary btn-lg rounded-full gap-2 px-8">
      Open the free dashboard
      <ArrowRightIcon className="h-5 w-5" aria-hidden />
    </Link>
    <p className="m-0 max-w-md text-center text-sm text-base-content/70 dark:text-gray-400">
      {DASHBOARD_CTA_MICROCOPY}
    </p>
  </div>
);
