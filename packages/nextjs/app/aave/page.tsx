"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { AavePositions } from "~~/components/custom/AavePositions";

const LendingPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      {/* Animated background elements */}
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
        {/* Hero */}
        <div className="w-full max-w-7xl mx-auto px-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-400 bg-clip-text text-transparent">
                Aave dashboard
              </h1>
              <p className="text-sm md:text-base text-gray-400 mt-1">Positions from Aave V3</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isConnected && connectedAddress ? (
          <div className="w-full">
            <AavePositions />
          </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl p-8 md:p-12 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 mb-6">
                  <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Connect your wallet to view your Aave lending and borrowing positions.
                </p>
                <p className="text-sm text-gray-500">Use the Connect button in the top right corner to get started</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LendingPage;
