"use client";

import { useIsClient } from "usehooks-ts";
import { useAccount } from "wagmi";
import { AavePositions } from "~~/components/custom/AavePositions";

/** The wallet-dependent part of /aave. The page around it is server-rendered, so crawlers still get its text. */
export const AaveDashboard = () => {
  const { address, isConnected } = useAccount();
  const isClient = useIsClient();

  // Wallet state is only known on the client, so render nothing until then to avoid a hydration mismatch.
  if (!isClient) return null;

  if (isConnected && address) {
    // The dashboard's own headings are h3s (networks, the selected position, notification settings), so this h2
    // keeps the page outline h1 → h2 → h3, like the disconnected state's visible h2.
    return (
      <section aria-labelledby="your-positions" className="w-full">
        <h2 id="your-positions" className="sr-only">
          Your Aave positions
        </h2>
        <AavePositions />
      </section>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl p-8 md:p-12 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-primary/20 to-transparent dark:from-purple-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 dark:from-purple-500/20 dark:to-indigo-500/20 dark:border-purple-500/30 mb-6">
            <svg
              className="w-10 h-10 text-primary dark:text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-base-content dark:text-white mb-3">Connect your wallet</h2>
          <p className="text-base-content/70 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Connect the wallet you borrow with to see its Aave V3 positions. Viewing needs no transaction.
          </p>
          <p className="text-sm text-base-content/70 dark:text-gray-400">
            Use the Connect button in the top right corner.
          </p>
        </div>
      </div>
    </div>
  );
};
