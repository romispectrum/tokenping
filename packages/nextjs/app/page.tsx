import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightIcon, BellAlertIcon, ChartBarIcon, WalletIcon } from "@heroicons/react/24/outline";
import { ConnectWalletHint } from "~~/components/ConnectWalletHint";
import { PageBackground } from "~~/components/custom/PageBackground";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";

const VALUE_PROPS = [
  {
    Icon: WalletIcon,
    iconColorClassName: "bg-primary/20 text-primary dark:bg-purple-500/20 dark:text-purple-400",
    title: "Connect your wallet",
    body: "Link your wallet once. We read positions on-chain, no custody.",
  },
  {
    Icon: ChartBarIcon,
    iconColorClassName: "bg-primary/20 text-primary dark:bg-indigo-500/20 dark:text-indigo-400",
    title: "Track positions",
    body: "See collateral, debt, and health factor across supported protocols.",
  },
  {
    Icon: BellAlertIcon,
    iconColorClassName: "bg-accent/20 text-accent dark:bg-pink-500/20 dark:text-pink-400",
    title: "Get notified",
    body: "Configure alerts and get notified before your position is at risk.",
  },
];

const NOTIFICATION_STEPS = [
  {
    title: "Set your alert",
    body: "Choose the wallet and safety level that feels right for you.",
  },
  {
    title: `We check every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes`,
    body: "Tokenping checks your latest health factor based on your saved settings.",
  },
  {
    title: "You get an alert",
    body: "If your health factor drops below your limit, we notify you right away through your selected channel.",
  },
];

const Home: NextPage = () => {
  return (
    <PageBackground>
      <div className="relative z-10 flex flex-col items-center grow pt-6 sm:pt-8 pb-24 sm:pb-10">
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-xs font-medium text-primary dark:text-purple-300 uppercase tracking-widest mb-2">
              DeFi notifications
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-neutral via-primary to-accent dark:from-white dark:via-purple-200 dark:to-indigo-400 bg-clip-text text-transparent">
                Tokenping
              </span>
            </h1>
            <p className="text-base-content/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Stay on top of your DeFi positions. Tokenping monitors your collateral and debt, and notifies you when you
              need to act — so you never miss a health factor warning.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-base-content mb-2">Aave positions</h2>
                <p className="text-base-content/70 dark:text-gray-400 text-sm max-w-lg">
                  View your Aave V3 collateral and debt across networks. Set up health factor alerts to get early
                  warnings before liquidation risk increases.
                </p>
              </div>
              <Link
                href="/aave"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-gradient-to-r from-primary/30 to-accent/30 border border-primary/40 text-base-content font-semibold hover:from-primary/40 hover:to-accent/40 dark:from-purple-500/30 dark:to-indigo-500/30 dark:border-purple-500/30 dark:text-white dark:hover:from-purple-500/40 dark:hover:to-indigo-500/40 transition-all shrink-0 touch-target-min min-h-[2.75rem] w-full sm:w-auto"
              >
                Open Aave dashboard
                <ArrowRightIcon className="w-5 h-5" aria-hidden />
              </Link>
            </div>

            <ConnectWalletHint />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6">
            {VALUE_PROPS.map(({ Icon, iconColorClassName, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/50 backdrop-blur-sm p-4 text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${iconColorClassName} mb-2`}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <h3 className="text-base-content font-semibold mb-1">{title}</h3>
                <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/50 backdrop-blur-sm p-5 md:p-6 mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-base-content mb-3">How notifications work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {NOTIFICATION_STEPS.map(({ title, body }, index) => (
                <div
                  key={title}
                  className="rounded-2xl border border-base-300/80 dark:border-white/10 bg-base-200/60 dark:bg-gray-900/40 p-3"
                >
                  {/* One template string keeps the heading a single text node in the server HTML. */}
                  <p className="text-sm font-medium text-base-content mb-1">{`${index + 1}. ${title}`}</p>
                  <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-base-content/60 text-xs sm:text-sm mt-6">
            Tokenping — DeFi notification service. Start with Aave, more protocols coming soon.
          </p>
        </div>
      </div>
    </PageBackground>
  );
};

export default Home;
