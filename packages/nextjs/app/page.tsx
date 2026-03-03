"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";

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

      <div className="relative z-10 flex flex-col items-center grow pt-10 pb-20">
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-400 bg-clip-text text-transparent">
                DeFi Notification App
              </span>
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed">
              Configure alerts for your DeFi positions — starting with{" "}
              <span className="text-white font-semibold">Aave loans</span>.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Borrowing (Aave)</h2>
                <p className="text-sm text-gray-400 mt-1">
                  View your Aave collateral + debt across networks. Notifications will be configurable here later.
                </p>
              </div>

              <Link
                href="/aave"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-500/30 text-white font-semibold hover:from-purple-500/40 hover:to-indigo-500/40 transition-all"
              >
                Open Aave Dashboard →
              </Link>
            </div>

            {!isConnected ? (
              <div className="mt-5 text-sm text-gray-500">
                Tip: connect your wallet first (top right) to see your positions on the Lending page.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
