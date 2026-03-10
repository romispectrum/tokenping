"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowRightIcon, BellAlertIcon, ChartBarIcon, WalletIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center grow pt-12 pb-24">
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-indigo-400/90 uppercase tracking-widest mb-3">DeFi notifications</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5">
              <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-400 bg-clip-text text-transparent">
                Tokenping
              </span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Stay on top of your DeFi positions. Tokenping monitors your collateral and debt, and notifies you when you
              need to act — so you never miss a health factor warning.
            </p>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 mb-3">
                <WalletIcon className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-white font-semibold mb-1">Connect your wallet</h3>
              <p className="text-sm text-gray-400">Link your wallet once. We read positions on-chain, no custody.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 mb-3">
                <ChartBarIcon className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-white font-semibold mb-1">Track positions</h3>
              <p className="text-sm text-gray-400">
                See collateral, debt, and health factor across supported protocols.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 mb-3">
                <BellAlertIcon className="w-6 h-6" aria-hidden />
              </div>
              <h3 className="text-white font-semibold mb-1">Get notified</h3>
              <p className="text-sm text-gray-400">
                Configure alerts and get notified before your position is at risk.
              </p>
            </div>
          </div>

          {/* Main CTA card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Aave positions</h2>
                <p className="text-gray-400 text-sm md:text-base max-w-lg">
                  View your Aave V3 collateral and debt across networks. Notifications for health factor and liquidation
                  risk are coming soon.
                </p>
              </div>
              <Link
                href="/aave"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-500/30 text-white font-semibold hover:from-purple-500/40 hover:to-indigo-500/40 transition-all shrink-0"
                aria-label="Open Aave dashboard"
              >
                Open Aave dashboard
                <ArrowRightIcon className="w-5 h-5" aria-hidden />
              </Link>
            </div>

            {!isConnected ? (
              <p className="mt-5 text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/80" aria-hidden />
                Connect your wallet (top right) to see your positions on the Aave page.
              </p>
            ) : null}
          </div>

          {/* Footer line */}
          <p className="text-center text-gray-500 text-sm mt-10">
            Tokenping — DeFi notification service. Start with Aave, more protocols coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
