import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { MorphoDashboard } from "~~/components/dashboard/MorphoDashboard";
import { Container } from "~~/components/home/marketingLayout";
import { PAGE_LINK_CLASS_NAME } from "~~/components/pages/pageLinks";
import { MORPHO_CHAINS } from "~~/config/morpho";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { getPostByKey, isPublished } from "~~/content/blog";
import { joinList } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";
import { postPath, routeAlternates, routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { needsAbsoluteTitle, pageMetadata } from "~~/utils/seo";

export const morphoMetadata = (locale: Locale) => {
  const { page } = MORPHO_MESSAGES[locale];
  return pageMetadata({
    title: page.metaTitle,
    // Naming Blue and Midnight leaves no room for the " | Tokenping" suffix within 60 characters.
    absoluteTitle: needsAbsoluteTitle(page.metaTitle),
    description: page.metaDescription(MORPHO_CHAINS.length, formatAlertChannelsIn(locale, "disjunction")),
    locale,
    alternates: routeAlternates("morpho"),
  });
};

// The Morpho guides the page links, by key, with their label in the page's messages.
const GUIDE_LINKS = [
  { key: "morpho-health-factor", label: "guideHealthFactor" },
  { key: "how-morpho-liquidation-works", label: "guideLiquidation" },
  { key: "morpho-midnight-fixed-rate-loans", label: "guideMidnight" },
] as const;

/**
 * The Morpho dashboard page of one language; app/(en)/morpho/page.tsx and app/(cs)/cz/morpho/page.tsx render it. A
 * server shell like /aave: the heading and the explanation are in the initial HTML, and only the wallet-dependent
 * dashboard is a client island.
 */
export const MorphoPage = ({ locale }: { locale: Locale }) => {
  const { page } = MORPHO_MESSAGES[locale];
  // Each guide in this page's language, linked only once it is published there.
  const guides = GUIDE_LINKS.flatMap(({ key, label }) => {
    const post = getPostByKey(key, locale);
    return post && isPublished(post) ? [{ slug: post.meta.slug, label: page[label] }] : [];
  });
  return (
    <Container className="flex flex-col gap-6 pt-6 pb-12 md:pt-8 md:pb-16">
      <header className="grid lg:grid-cols-12 lg:items-start lg:gap-x-6">
        <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground lg:col-span-5">{page.title}</h1>
        <div className="mt-3 flex max-w-prose flex-col gap-2 text-sm text-muted-foreground lg:col-span-7 lg:mt-0">
          <p className="m-0">
            {page.intro(
              joinList(
                locale,
                MORPHO_CHAINS.map(({ name }) => name),
              ),
            )}
          </p>
          <p className="m-0">{page.checks(NOTIFICATION_CHECK_INTERVAL_MINUTES)}</p>
          <p className="m-0">{page.access}</p>
          <p className="m-0">{page.notAffiliated}</p>
          <ul className="m-0 mt-1 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
            {guides.map(({ slug, label }) => (
              <li key={slug} className="m-0 p-0">
                <Link href={postPath(locale, slug)} className={PAGE_LINK_CLASS_NAME}>
                  <BookOpen aria-hidden="true" className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
            <li className="m-0 p-0">
              <Link href={routePath(locale, "dashboard")} className={PAGE_LINK_CLASS_NAME}>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                {page.aaveDashboard}
              </Link>
            </li>
          </ul>
        </div>
      </header>

      <MorphoDashboard />
    </Container>
  );
};
