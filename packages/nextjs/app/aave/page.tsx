import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";
import type { NextPage } from "next";
import { AaveDashboard } from "~~/app/aave/_components/AaveDashboard";
import { getDashboardDescription, getNetworkNames, getPublishedPost, joinList } from "~~/components/home/homeContent";
import { Container } from "~~/components/home/marketingLayout";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { pageMetadata, postPath } from "~~/utils/seo";

export const metadata = pageMetadata({
  title: "Aave V3 positions and health factor",
  description: getDashboardDescription(),
  path: "/aave",
});

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
      {/* Title beside the explanation from lg, on the same 5/7 tracks as the dashboard grid below. */}
      <header className="grid lg:grid-cols-12 lg:items-start lg:gap-x-6">
        <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground lg:col-span-5">
          Aave V3 positions and health factor alerts
        </h1>
        <div className="mt-3 flex flex-col gap-3 lg:col-span-7 lg:mt-0">
          <div className="flex max-w-prose flex-col gap-2 text-sm text-muted-foreground">
            <p className="m-0">
              {`Connect the wallet you borrow with to see its Aave V3 collateral, debt and health factor on ${joinList(getNetworkNames())}. Viewing is free and needs no transaction.`}
            </p>
            {/* Folded by default: the alert and check facts are in the HTML for crawlers and a tap away for a
                first visit, and they stop costing a phone's screen on every visit after it. */}
            <details className="group">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm font-medium text-foreground pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
                What alerts cost and how often we check
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform duration-150 ease-[ease] group-open:rotate-180"
                />
              </summary>
              <div className="flex flex-col gap-2 pt-2">
                <p className="m-0">
                  {`To get a message on ${formatAlertChannels("or")} when a network's health factor drops below a threshold you choose, unlock alerts with a USDC payment${paymentChainName ? ` on ${paymentChainName}` : ""}. The current price is shown before you pay.`}
                </p>
                <p className="m-0">
                  {`Tokenping checks every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. While the health factor stays below your threshold, every check sends another message on each channel you chose.`}
                </p>
              </div>
            </details>
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
        </div>
      </header>

      <AaveDashboard />
    </Container>
  );
};

export default AavePage;
