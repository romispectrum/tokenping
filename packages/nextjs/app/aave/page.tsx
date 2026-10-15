import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { NextPage } from "next";
import { AaveDashboard } from "~~/app/aave/_components/AaveDashboard";
import { getDashboardDescription, getNetworkNames, getPublishedPost, joinList } from "~~/components/home/homeContent";
import { Container } from "~~/components/home/marketingLayout";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { type Crumb, breadcrumbJsonLd, pageMetadata, postPath } from "~~/utils/seo";

export const metadata = pageMetadata({
  title: "Aave V3 positions and health factor",
  description: getDashboardDescription(),
  path: "/aave",
});

const CRUMBS: Crumb[] = [{ name: "Home", path: "/" }, { name: "Dashboard" }];

// In-app links from the marketing plan §3.9: threshold choice → the safe-HF guide, alerts → the setup guide.
const GUIDE_LINKS = [
  { slug: "safe-aave-health-factor", label: "How to choose a threshold" },
  { slug: "aave-health-factor-alert-setup", label: "How alerts work" },
];

/**
 * Server shell: the heading, the explanation and the guide links are in the initial HTML for crawlers and for
 * visitors before the wallet UI loads; only the wallet-dependent dashboard is a client island. Product UI is calm:
 * a plain page header and flat surfaces, none of the marketing effects.
 */
const AavePage: NextPage = () => {
  const paymentChainName = getPaymentChainName();
  const guides = GUIDE_LINKS.filter(({ slug }) => getPublishedPost(slug));

  return (
    // The site container, so the page shares its edge with the header and the footer.
    <Container className="flex flex-col gap-6 pt-6 pb-12 md:pt-8 md:pb-16">
      <header className="flex flex-col gap-3">
        {/* The breadcrumb trail brings its own 16px gap above the title. */}
        <div>
          <Breadcrumbs crumbs={CRUMBS} />
          <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground">
            Aave V3 positions and health factor alerts
          </h1>
        </div>
        <div className="flex max-w-prose flex-col gap-2 text-sm text-muted-foreground">
          <p className="m-0">
            {`Connect the wallet you borrow with to see its Aave V3 collateral, debt and health factor on ${joinList(getNetworkNames())}. Viewing is free and needs no transaction.`}
          </p>
          <p className="m-0">
            {`To get a message on ${formatAlertChannels("or")} when a network's health factor drops below a threshold you choose, unlock alerts with a USDC payment${paymentChainName ? ` on ${paymentChainName}` : ""}. The current price is shown before you pay.`}
          </p>
          <p className="m-0">
            {`Tokenping checks every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. While the health factor stays below your threshold, every check sends another message on each channel you chose.`}
          </p>
        </div>
        {guides.length > 0 && (
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm">
            {guides.map(({ slug, label }) => (
              <li key={slug} className="m-0 p-0">
                <Link
                  href={postPath(slug)}
                  className="inline-flex items-center gap-1.5 font-medium text-link underline underline-offset-3 hover:decoration-2 pointer-coarse:min-h-11"
                >
                  <BookOpen aria-hidden="true" className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <AaveDashboard />
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
    </Container>
  );
};

export default AavePage;
