import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import { AaveDashboard } from "~~/components/dashboard/AaveDashboard";
import { Container } from "~~/components/home/marketingLayout";
import { PAGE_LINK_CLASS_NAME } from "~~/components/pages/pageLinks";
import { AAVE_NETWORK_NAMES, AAVE_V3_NETWORKS, AAVE_V4_NETWORK_NAMES } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { getPostByKey, isPublished } from "~~/content/blog";
import { joinList } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { postPath, routeAlternates, routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { pageMetadata } from "~~/utils/seo";

export const dashboardMetadata = (locale: Locale) => {
  const { page } = DASHBOARD_MESSAGES[locale];
  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription(AAVE_NETWORK_NAMES.length, formatAlertChannelsIn(locale, "disjunction")),
    locale,
    alternates: routeAlternates("dashboard"),
  });
};

// In-app links: threshold choice → the safe-HF guide, alerts → the setup guide.
const GUIDE_LINKS = [
  { key: "safe-aave-health-factor", label: "guideThreshold" },
  { key: "aave-health-factor-alert-setup", label: "guideAlerts" },
] as const;

/** The Aave V3 networks in dashboard order, a network with several markets naming them: "Ethereum (Core, ... markets)". */
const v3NetworkNames = (locale: Locale) =>
  AAVE_V3_NETWORKS.map(({ name, marketNames }) =>
    marketNames.length > 1 ? DASHBOARD_MESSAGES[locale].page.networkMarkets(name, joinList(locale, marketNames)) : name,
  );

/**
 * Server shell: the heading, the explanation and the guide links are in the initial HTML for crawlers and for
 * visitors before the wallet UI loads; only the wallet-dependent dashboard is a client island. Product UI is calm:
 * a plain page header and flat surfaces, none of the marketing effects.
 */
/** The dashboard page of one language; app/(en)/aave/page.tsx and app/(cs)/cz/aave/page.tsx render it. */
export const DashboardPage = ({ locale }: { locale: Locale }) => {
  const { page } = DASHBOARD_MESSAGES[locale];
  const channels = formatAlertChannelsIn(locale, "disjunction");
  // Each guide in this page's language, linked only once it is published there.
  const guides = GUIDE_LINKS.flatMap(({ key, label }) => {
    const post = getPostByKey(key, locale);
    return post && isPublished(post) ? [{ slug: post.meta.slug, label: page[label] }] : [];
  });

  return (
    // The site container, so the page shares its edge with the header and the footer.
    <Container className="flex flex-col gap-6 pt-6 pb-12 md:pt-8 md:pb-16">
      {/* Title beside the explanation from lg, on the same 5/7 tracks as the dashboard grid below. */}
      <header className="grid lg:grid-cols-12 lg:items-start lg:gap-x-6">
        <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground lg:col-span-5">{page.title}</h1>
        <div className="mt-3 flex flex-col gap-3 lg:col-span-7 lg:mt-0">
          <div className="flex max-w-prose flex-col gap-2 text-sm text-muted-foreground">
            <p className="m-0">
              {page.intro(joinList(locale, v3NetworkNames(locale)), joinList(locale, AAVE_V4_NETWORK_NAMES))}
            </p>
            {/* Folded by default: the alert and check facts are in the HTML for crawlers and a tap away for a
                first visit, and they stop costing a phone's screen on every visit after it. */}
            <details className="group">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm font-medium text-foreground pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
                {page.disclosureSummary}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform duration-150 ease-[ease] group-open:rotate-180"
                />
              </summary>
              <div className="flex flex-col gap-2 pt-2">
                <p className="m-0">{page.alertsCost(channels, getPaymentChainName())}</p>
                <p className="m-0">{page.checks(NOTIFICATION_CHECK_INTERVAL_MINUTES)}</p>
              </div>
            </details>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm">
            {guides.map(({ slug, label }) => (
              <li key={slug} className="m-0 p-0">
                <Link href={postPath(locale, slug)} className={PAGE_LINK_CLASS_NAME}>
                  <BookOpen aria-hidden="true" className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
            <li className="m-0 p-0">
              <Link href={routePath(locale, "morpho")} className={PAGE_LINK_CLASS_NAME}>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                {page.morphoDashboard}
              </Link>
            </li>
          </ul>
        </div>
      </header>

      <AaveDashboard />
    </Container>
  );
};
