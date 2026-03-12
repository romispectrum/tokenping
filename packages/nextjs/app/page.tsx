"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowRightIcon, BellAlertIcon, ChartBarIcon, WalletIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-base-200 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center grow pt-6 sm:pt-8 pb-24 sm:pb-10">
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4">
          {/* Hero */}
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

          {/* Main CTA card */}
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
                aria-label="Open Aave dashboard"
              >
                Open Aave dashboard
                <ArrowRightIcon className="w-5 h-5" aria-hidden />
              </Link>
            </div>

            {!isConnected ? (
              <p className="mt-4 text-sm text-base-content/60 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning" aria-hidden />
                Connect your wallet (top right) to see your positions on the Aave page.
              </p>
            ) : null}
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 mb-4 sm:mb-6">
            <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/50 backdrop-blur-sm p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary dark:bg-purple-500/20 dark:text-purple-400 mb-2">
                <WalletIcon className="w-5 h-5" aria-hidden />
              </div>
              <h3 className="text-base-content font-semibold mb-1">Connect your wallet</h3>
              <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">
                Link your wallet once. We read positions on-chain, no custody.
              </p>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/50 backdrop-blur-sm p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary dark:bg-indigo-500/20 dark:text-indigo-400 mb-2">
                <ChartBarIcon className="w-5 h-5" aria-hidden />
              </div>
              <h3 className="text-base-content font-semibold mb-1">Track positions</h3>
              <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">
                See collateral, debt, and health factor across supported protocols.
              </p>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/50 backdrop-blur-sm p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/20 text-accent dark:bg-pink-500/20 dark:text-pink-400 mb-2">
                <BellAlertIcon className="w-5 h-5" aria-hidden />
              </div>
              <h3 className="text-base-content font-semibold mb-1">Get notified</h3>
              <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">
                Configure alerts and get notified before your position is at risk.
              </p>
            </div>
          </div>

          {/* How notifications work */}
          <div className="rounded-3xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/50 backdrop-blur-sm p-5 md:p-6 mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-base-content mb-3">How notifications work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-base-300/80 dark:border-white/10 bg-base-200/60 dark:bg-gray-900/40 p-3">
                <p className="text-sm font-medium text-base-content mb-1">1. Set your alert</p>
                <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">
                  Choose the wallet and safety level that feels right for you.
                </p>
              </div>
              <div className="rounded-2xl border border-base-300/80 dark:border-white/10 bg-base-200/60 dark:bg-gray-900/40 p-3">
                <p className="text-sm font-medium text-base-content mb-1">2. We check every 5 minutes</p>
                <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">
                  Tokenping checks your latest health factor based on your saved settings.
                </p>
              </div>
              <div className="rounded-2xl border border-base-300/80 dark:border-white/10 bg-base-200/60 dark:bg-gray-900/40 p-3">
                <p className="text-sm font-medium text-base-content mb-1">3. You get an alert</p>
                <p className="text-xs sm:text-sm text-base-content/70 dark:text-gray-400">
                  If your health factor drops below your limit, we notify you right away through your selected channel.
                </p>
              </div>
            </div>
          </div>

          {/* Footer line */}
          <p className="text-center text-base-content/60 text-xs sm:text-sm mt-6">
            Tokenping — DeFi notification service. Start with Aave, more protocols coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
