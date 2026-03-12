"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessPaywall } from "./AccessPaywall";
import { HealthFactorBadge } from "./HealthFactorBadge";
import { NotificationConfig } from "./NotificationConfig";
import { NetworkPosition, TokenPosition, useAavePositions } from "~~/hooks/custom/useAavePositions";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { formatTokenAmount, formatUSD } from "~~/utils/format";

const LoadingSkeleton = ({ columns = 2 }: { columns?: 1 | 2 }) => (
  <div className={`grid ${columns === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"} gap-4`}>
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 p-5 animate-pulse"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-base-300 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-base-300 dark:bg-white/10 rounded" />
              <div className="h-3 w-16 bg-base-300 dark:bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-base-300 dark:bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="bg-base-200 dark:bg-white/5 rounded-xl p-3">
              <div className="h-2 w-12 bg-base-300 dark:bg-white/10 rounded mb-2" />
              <div className="h-5 w-16 bg-base-300 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const NetworkSummaryRow = ({
  position,
  isSelected,
  onSelect,
  hasNotification,
}: {
  position: NetworkPosition;
  isSelected: boolean;
  onSelect: () => void;
  hasNotification: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full text-left rounded-xl border backdrop-blur-xl transition-all",
        "px-2.5 py-1.5 flex items-center justify-between gap-2",
        isSelected
          ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10 dark:border-purple-500/40 dark:bg-purple-500/10 dark:shadow-purple-500/10"
          : "border-base-300 bg-base-200 hover:bg-base-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
          style={{
            background: `linear-gradient(135deg, ${position.chainColor}30, ${position.chainColor}10)`,
            border: `1px solid ${position.chainColor}40`,
          }}
        >
          {position.chainIcon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-base-content dark:text-white truncate text-[13px] leading-none">
              {position.chainName}
            </p>
            {position.hasPosition ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 leading-none">
                Active
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-base-300 bg-base-200 text-base-content/70 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 leading-none">
                Empty
              </span>
            )}
            {hasNotification && (
              <svg
                className="w-3.5 h-3.5 text-primary dark:text-purple-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            )}
          </div>
          <p className="hidden sm:block text-[10px] text-base-content/70 dark:text-gray-400 truncate leading-tight mt-0.5">
            {formatUSD(position.totalCollateralUSD)} supplied · {formatUSD(position.totalDebtUSD)} borrowed
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {position.hasPosition ? (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-base-300 bg-base-200 text-base-content dark:bg-white/5 dark:border-white/10 dark:text-gray-200 leading-none">
            HF {position.healthFactor}
          </span>
        ) : null}
      </div>
    </button>
  );
};

const CollateralRow = ({ token }: { token: TokenPosition }) => {
  const hasSupply = token.aTokenBalance > 0n;
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-base-300 hover:bg-base-200 dark:border-white/5 dark:hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {token.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-base-content dark:text-white truncate">{token.symbol}</p>
          <p className="text-[10px] text-base-content/60 dark:text-gray-500 leading-tight">
            {token.usageAsCollateralEnabled ? "Collateral enabled" : "Collateral disabled"}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
          {hasSupply ? formatTokenAmount(token.aTokenBalance, token.decimals) : "—"}
        </p>
        <p className="text-[10px] text-base-content/60 dark:text-gray-500">
          {hasSupply ? `${token.liquidityRate.toFixed(2)}% APY` : "\u00A0"}
        </p>
      </div>
    </div>
  );
};

const DebtRow = ({ token }: { token: TokenPosition }) => {
  const hasStableDebt = token.stableDebt > 0n;
  const hasVariableDebt = token.variableDebt > 0n;
  const hasDebt = hasStableDebt || hasVariableDebt;
  const totalDebt = token.stableDebt + token.variableDebt;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-base-300 hover:bg-base-200 dark:border-white/5 dark:hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {token.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-base-content dark:text-white truncate">{token.symbol}</p>
          <p className="text-[10px] text-base-content/60 dark:text-gray-500 leading-tight">
            {hasStableDebt && hasVariableDebt
              ? `Stable ${formatTokenAmount(token.stableDebt, token.decimals)} · Variable ${formatTokenAmount(token.variableDebt, token.decimals)}`
              : hasVariableDebt
                ? `Variable ${formatTokenAmount(token.variableDebt, token.decimals)}`
                : hasStableDebt
                  ? `Stable ${formatTokenAmount(token.stableDebt, token.decimals)}`
                  : "\u00A0"}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-red-600 dark:text-red-400">
          {hasDebt ? formatTokenAmount(totalDebt, token.decimals) : "—"}
        </p>
        <p className="text-[10px] text-base-content/60 dark:text-gray-500">{hasDebt ? "Borrowed" : "\u00A0"}</p>
      </div>
    </div>
  );
};

const PositionDetails = ({
  position,
  hasNotificationConfig,
}: {
  position: NetworkPosition;
  hasNotificationConfig: boolean;
}) => {
  const hasTokens = position.tokens.length > 0;
  const collateralTokens = position.tokens.filter(t => t.aTokenBalance > 0n);
  const debtTokens = position.tokens.filter(t => t.stableDebt > 0n || t.variableDebt > 0n);

  return (
    <div className="space-y-4">
      {/* Notification Config - gated by paid access */}
      <AccessPaywall
        description={
          hasNotificationConfig
            ? `Your saved ${position.chainName} notification config is still in your account. Pay again to extend access and edit it.`
            : `Pay once to configure health factor alerts on ${position.chainName} and other networks. No auto-charges—you pay from your wallet when you want to extend.`
        }
        hasExistingConfig={hasNotificationConfig}
      >
        <NotificationConfig
          chainId={position.chainId}
          chainName={position.chainName}
          currentHealthFactor={position.healthFactor}
        />
      </AccessPaywall>

      {/* Position Details */}
      <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl">
        {/* subtle glow */}
        <div
          className="absolute inset-0 opacity-60 dark:opacity-60"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${position.chainColor}20 0%, transparent 55%)`,
          }}
        />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${position.chainColor}30, ${position.chainColor}10)`,
                  border: `1px solid ${position.chainColor}40`,
                }}
              >
                {position.chainIcon}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base-content dark:text-white truncate">{position.chainName}</h3>
                <p className="text-xs text-base-content/70 dark:text-gray-400">Aave V3 · Token-level positions</p>
              </div>
            </div>

            <div className="shrink-0">
              {position.hasPosition ? <HealthFactorBadge healthFactor={position.healthFactor} /> : null}
            </div>
          </div>

          {position.hasPosition ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-base-200 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-base-content/60 dark:text-gray-500 mb-1">
                    Collateral
                  </p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatUSD(position.totalCollateralUSD)}
                  </p>
                </div>
                <div className="bg-base-200 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-base-content/60 dark:text-gray-500 mb-1">
                    Debt
                  </p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatUSD(position.totalDebtUSD)}</p>
                </div>
                <div className="bg-base-200 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-base-content/60 dark:text-gray-500 mb-1">
                    Net Worth
                  </p>
                  <p className="text-lg font-bold text-base-content dark:text-white">
                    {formatUSD(position.netWorthUSD)}
                  </p>
                </div>
              </div>

              {hasTokens ? (
                <div className="border-t border-base-300 dark:border-white/10 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* LEFT: Collateral list */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/15 dark:bg-emerald-950/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Collateral</p>
                        <p className="text-[10px] text-base-content/60 dark:text-gray-500">
                          {collateralTokens.length} assets
                        </p>
                      </div>
                      {collateralTokens.length > 0 ? (
                        <div className="space-y-2">
                          {collateralTokens.map((token, i) => (
                            <CollateralRow key={`collateral-${token.asset}-${i}`} token={token} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-base-content/60 dark:text-gray-500 text-sm">
                          No collateral supplied
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Debt list */}
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 dark:border-red-500/15 dark:bg-red-950/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-300">Debt</p>
                        <p className="text-[10px] text-base-content/60 dark:text-gray-500">
                          {debtTokens.length} assets
                        </p>
                      </div>
                      {debtTokens.length > 0 ? (
                        <div className="space-y-2">
                          {debtTokens.map((token, i) => (
                            <DebtRow key={`debt-${token.asset}-${i}`} token={token} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-base-content/60 dark:text-gray-500 text-sm">
                          No outstanding debt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-base-content/70 dark:text-gray-500">
                  <p className="text-sm">No token-level data returned for this position.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-base-content/70 dark:text-gray-500">
              <p className="text-sm">No active position on {position.chainName}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AavePositions = () => {
  const { positions, isLoading, error, totalNetWorthUSD, totalCollateralUSD, totalDebtUSD, refetch } =
    useAavePositions();
  const { hasConfig, isLoaded: configsLoaded } = useNotificationConfig();
  const [mounted, setMounted] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const positionsWithData = useMemo(() => positions.filter(p => p.hasPosition), [positions]);
  const hasAnyPosition = positionsWithData.length > 0;

  // Default selection: first active position, otherwise first known network entry.
  useEffect(() => {
    if (!mounted) return;
    const preferred = positionsWithData[0]?.chainId ?? positions[0]?.chainId;
    if (preferred && selectedChainId === null) setSelectedChainId(preferred);
    // If selection disappeared (e.g., refresh), reset.
    if (selectedChainId !== null && !positions.some(p => p.chainId === selectedChainId) && preferred) {
      setSelectedChainId(preferred);
    }
  }, [mounted, positions, positionsWithData, selectedChainId]);

  const selectedPosition = useMemo(() => {
    if (selectedChainId === null) return null;
    return positions.find(p => p.chainId === selectedChainId) ?? null;
  }, [positions, selectedChainId]);

  if (!mounted) return null;

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

      {/* Error State */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Overview */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-gradient-to-br dark:from-emerald-950/50 dark:to-gray-900/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-emerald-600/90 dark:text-emerald-400/80 mb-1">
                Total Supplied
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatUSD(totalCollateralUSD)}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 dark:border-red-500/20 dark:bg-gradient-to-br dark:from-red-950/50 dark:to-gray-900/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-red-600/90 dark:text-red-400/80 mb-1">
                Total Borrowed
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatUSD(totalDebtUSD)}</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 dark:border-purple-500/20 dark:bg-gradient-to-br dark:from-purple-950/50 dark:to-gray-900/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-primary/90 dark:text-purple-400/80 mb-1">
                Net Worth
              </p>
              <p className="text-xl font-bold text-base-content dark:text-white">{formatUSD(totalNetWorthUSD)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-base-content dark:text-white">Networks</h3>
              <p className="text-xs text-base-content/60 dark:text-gray-500">{positionsWithData.length} active</p>
            </div>

            {isLoading ? (
              <LoadingSkeleton columns={1} />
            ) : (
              <div className="space-y-2">
                {positions.map(p => (
                  <NetworkSummaryRow
                    key={p.chainId}
                    position={p}
                    isSelected={p.chainId === selectedChainId}
                    onSelect={() => setSelectedChainId(p.chainId)}
                    hasNotification={configsLoaded && hasConfig(p.chainId)}
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && !hasAnyPosition && (
              <div className="mt-4 text-center text-base-content/70 dark:text-gray-500 text-sm">
                No active Aave positions detected on supported networks.
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT: Selected network only */}
        <section className="lg:col-span-7">
          {isLoading ? (
            <LoadingSkeleton columns={2} />
          ) : selectedPosition ? (
            <PositionDetails
              position={selectedPosition}
              hasNotificationConfig={configsLoaded && hasConfig(selectedPosition.chainId)}
            />
          ) : (
            <div className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl p-6 text-center text-base-content/70 dark:text-gray-500">
              <p className="text-sm">Select a network on the left to view its Aave position.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
