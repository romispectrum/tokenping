"use client";

import { useMemo } from "react";
import { NetworkSummaryRow } from "~~/components/custom/aave/NetworkSummaryRow";
import { PositionDetails } from "~~/components/custom/aave/PositionDetails";
import { PositionsSkeleton } from "~~/components/custom/aave/PositionsSkeleton";
import { StatCard } from "~~/components/custom/aave/StatCard";
import { useSelectedChainId } from "~~/components/custom/aave/useSelectedChainId";
import { useAavePositions } from "~~/hooks/custom/useAavePositions";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { formatUSD } from "~~/utils/format";

export const AavePositions = () => {
  const { account, positions, isLoading, error, totalNetWorthUSD, totalCollateralUSD, totalDebtUSD, refetch } =
    useAavePositions();
  const { hasConfig, isLoaded: configsLoaded } = useNotificationConfig();
  const [selectedChainId, setSelectedChainId] = useSelectedChainId(positions, account);

  const positionsWithData = useMemo(() => positions.filter(p => p.hasPosition), [positions]);

  const selectedPosition = useMemo(
    () => positions.find(p => p.chainId === selectedChainId) ?? null,
    [positions, selectedChainId],
  );

  const hasNotification = (chainId: number) => configsLoaded && hasConfig(chainId);

  // With no network read there is nothing to total or select, so the error box stands alone. A failed refresh keeps
  // the last positions on screen below it.
  const isTotalOutage = error !== null && positions.length === 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-base-200 border border-base-300 text-sm font-medium text-base-content dark:bg-white/5 dark:border-white/10 dark:text-gray-300 hover:bg-base-300 dark:hover:bg-white/10 dark:hover:text-white transition-all disabled:opacity-50 touch-target-min min-h-[2.75rem] w-full sm:w-auto justify-center md:justify-start"
          aria-label={isLoading ? "Refreshing positions" : "Refresh positions"}
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 dark:border-red-500/20 dark:bg-red-950/20 p-6 text-center mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 text-sm hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isTotalOutage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Total Supplied"
                value={formatUSD(totalCollateralUSD)}
                variant="summary"
                tone="collateral"
              />
              <StatCard label="Total Borrowed" value={formatUSD(totalDebtUSD)} variant="summary" tone="debt" />
              <StatCard label="Net Worth" value={formatUSD(totalNetWorthUSD)} variant="summary" tone="netWorth" />
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-base-content dark:text-white">Networks</h3>
                <p className="text-xs text-base-content/60 dark:text-gray-500">{positionsWithData.length} active</p>
              </div>

              {isLoading ? (
                <PositionsSkeleton columns={1} />
              ) : (
                <div className="space-y-2">
                  {positions.map(p => (
                    <NetworkSummaryRow
                      key={p.chainId}
                      position={p}
                      isSelected={p.chainId === selectedChainId}
                      onSelect={() => setSelectedChainId(p.chainId)}
                      hasNotification={hasNotification(p.chainId)}
                    />
                  ))}
                </div>
              )}

              {!isLoading && !error && positionsWithData.length === 0 && (
                <div className="mt-4 text-center text-base-content/70 dark:text-gray-500 text-sm">
                  No active Aave positions detected on supported networks.
                </div>
              )}
            </div>
          </aside>

          <section className="lg:col-span-7">
            {isLoading ? (
              <PositionsSkeleton columns={2} />
            ) : selectedPosition ? (
              <PositionDetails
                position={selectedPosition}
                hasNotificationConfig={hasNotification(selectedPosition.chainId)}
              />
            ) : (
              <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl p-6 text-center text-base-content/70 dark:text-gray-500">
                <p className="text-sm">Select a network on the left to view its Aave position.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
