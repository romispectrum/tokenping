import Link from "next/link";
import type { NextPage } from "next";
import { AaveDashboard } from "~~/app/aave/_components/AaveDashboard";
import { ARTICLE_LINK_CLASS_NAME } from "~~/components/blog/MdxElements";
import { PageBackground } from "~~/components/custom/PageBackground";
import { getDashboardDescription, getNetworkNames, getPublishedPost, joinList } from "~~/components/home/homeContent";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { type Crumb, breadcrumbJsonLd, pageMetadata, postPath } from "~~/utils/seo";

export const metadata = pageMetadata({
  title: "Aave V3 Positions & Health Factor",
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
 * visitors before the wallet UI loads; only the wallet-dependent dashboard is a client island.
 */
const AavePage: NextPage = () => {
  const paymentChainName = getPaymentChainName();
  const guides = GUIDE_LINKS.filter(({ slug }) => getPublishedPost(slug));

  return (
    <PageBackground>
      <div className="relative z-10 flex flex-col items-center grow pt-6 sm:pt-10 pb-24 sm:pb-20 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 mb-6 sm:mb-8">
          <Breadcrumbs crumbs={CRUMBS} />
          <h1 className="m-0 text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-neutral via-indigo-800 to-indigo-600 dark:from-white dark:via-purple-200 dark:to-indigo-300 bg-clip-text text-transparent">
            Aave V3 positions and health factor alerts
          </h1>
          <div className="max-w-3xl text-sm md:text-base leading-relaxed text-base-content/80 dark:text-gray-300">
            <p className="mt-3 mb-2">
              {`Connect the wallet you borrow with to see its Aave V3 collateral, debt and health factor on ${joinList(getNetworkNames())}. Viewing is free and needs no transaction.`}
            </p>
            <p className="my-2">
              {`To get a message on ${formatAlertChannels("or")} when a network's health factor drops below a threshold you choose, unlock alerts with a USDC payment${paymentChainName ? ` on ${paymentChainName}` : ""}. The current price is shown before you pay.`}
            </p>
            <p className="my-2">
              {`Tokenping checks every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. While the health factor stays below your threshold, every check sends another message on each channel you chose.`}
            </p>
            {guides.length > 0 && (
              <ul className="m-0 mt-3 flex flex-wrap gap-x-6 gap-y-2 list-none p-0">
                {guides.map(({ slug, label }) => (
                  <li key={slug} className="m-0 p-0">
                    <Link href={postPath(slug)} className={ARTICLE_LINK_CLASS_NAME}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <AaveDashboard />
      </div>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
    </PageBackground>
  );
};

export default AavePage;
