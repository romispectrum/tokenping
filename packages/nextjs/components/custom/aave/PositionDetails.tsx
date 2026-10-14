import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { HealthFactorBadge } from "~~/components/custom/HealthFactorBadge";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { ChainIcon } from "~~/components/custom/aave/ChainIcon";
import { StatCard } from "~~/components/custom/aave/StatCard";
import { TokenListPanel } from "~~/components/custom/aave/TokenListPanel";
import { CollateralTokenRow, DebtTokenRow } from "~~/components/custom/aave/TokenRow";
import { getCollateralTokens, getDebtTokens } from "~~/components/custom/aave/positionsView";
import type { NetworkPosition } from "~~/services/aave/positions";
import { formatUSD } from "~~/utils/format";

type PositionDetailsProps = {
  position: NetworkPosition;
  hasNotificationConfig: boolean;
};

export const PositionDetails = ({ position, hasNotificationConfig }: PositionDetailsProps) => (
  <div className="space-y-4">
    <AccessPaywall
      description={
        hasNotificationConfig
          ? `Your saved ${position.chainName} notification config is still in your account. Pay again to extend access and edit it.`
          : `Pay once to configure health factor alerts on ${position.chainName} and other networks. No auto-charges—you pay from your wallet when you want to extend.`
      }
      hasExistingConfig={hasNotificationConfig}
    >
      {/* Keyed by chain so switching networks discards the previous network's unsaved form. */}
      <NotificationConfig
        key={position.chainId}
        chainId={position.chainId}
        chainName={position.chainName}
        currentHealthFactor={position.healthFactor}
      />
    </AccessPaywall>

    <div className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-xl">
      {/* Glow tinted with the chain color */}
      <div
        className="absolute inset-0 opacity-60 dark:opacity-60"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${position.chainColor}20 0%, transparent 55%)`,
        }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <ChainIcon icon={position.chainIcon} color={position.chainColor} size="lg" />
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
              <StatCard
                label="Collateral"
                value={formatUSD(position.totalCollateralUSD)}
                variant="detail"
                tone="collateral"
              />
              <StatCard label="Debt" value={formatUSD(position.totalDebtUSD)} variant="detail" tone="debt" />
              <StatCard label="Net Worth" value={formatUSD(position.netWorthUSD)} variant="detail" tone="netWorth" />
            </div>

            {position.tokens.length > 0 ? (
              <div className="border-t border-base-300 dark:border-white/10 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TokenListPanel
                    title="Collateral"
                    tone="collateral"
                    tokens={getCollateralTokens(position.tokens)}
                    Row={CollateralTokenRow}
                    emptyText="No collateral supplied"
                  />
                  <TokenListPanel
                    title="Debt"
                    tone="debt"
                    tokens={getDebtTokens(position.tokens)}
                    Row={DebtTokenRow}
                    emptyText="No outstanding debt"
                  />
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
