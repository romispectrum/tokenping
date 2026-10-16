import { Layers } from "lucide-react";
import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { HealthFactorBadge } from "~~/components/custom/HealthFactorBadge";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { StatCard } from "~~/components/custom/aave/StatCard";
import { COLLATERAL_COLUMNS, CollateralTokenRow, DEBT_COLUMNS, DebtTokenRow } from "~~/components/custom/aave/TokenRow";
import { TokenTable } from "~~/components/custom/aave/TokenTable";
import { getCollateralTokens, getDebtTokens } from "~~/components/custom/aave/positionsView";
import { Alert, Card } from "~~/components/ui";
import type { NetworkPosition } from "~~/services/aave/positions";
import { formatUSD } from "~~/utils/format";

type PositionDetailsProps = {
  position: NetworkPosition;
  hasNotificationConfig: boolean;
};

const PositionContent = ({ position }: { position: NetworkPosition }) => {
  if (!position.hasPosition) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Layers aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <p className="m-0 text-base font-medium text-foreground">{`No active position on ${position.chainName}`}</p>
          <p className="m-0 text-sm text-muted-foreground">
            {`Aave reports no collateral and no debt for this wallet on ${position.chainName}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        <StatCard variant="panel" label="Collateral" value={formatUSD(position.totalCollateralUSD)} />
        <StatCard variant="panel" label="Debt" value={formatUSD(position.totalDebtUSD)} />
        <StatCard variant="panel" label="Net worth" value={formatUSD(position.netWorthUSD)} />
      </dl>

      {position.tokens.length > 0 ? (
        <>
          <TokenTable
            id={`supplied-${position.chainId}`}
            title="Supplied"
            columns={COLLATERAL_COLUMNS}
            tokens={getCollateralTokens(position.tokens)}
            chainId={position.chainId}
            Row={CollateralTokenRow}
            emptyText="No collateral supplied"
          />
          <TokenTable
            id={`borrowed-${position.chainId}`}
            title="Borrowed"
            columns={DEBT_COLUMNS}
            tokens={getDebtTokens(position.tokens)}
            chainId={position.chainId}
            Row={DebtTokenRow}
            emptyText="No outstanding debt"
          />
          <p className="m-0 text-xs text-muted-foreground">
            Token icons from{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link underline underline-offset-3 hover:decoration-2"
            >
              CoinGecko
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </>
      ) : (
        // Partial data: the account summary loaded but the per-token reads did not.
        <Alert variant="warning" title="Token details did not load">
          <p>The totals above come from Aave&apos;s account summary. Refresh positions to try again.</p>
        </Alert>
      )}
    </>
  );
};

export const PositionDetails = ({ position, hasNotificationConfig }: PositionDetailsProps) => (
  <div className="flex flex-col gap-6">
    <AccessPaywall
      description={
        hasNotificationConfig
          ? `Your saved ${position.chainName} alert settings are still in your account. Pay again to extend access and edit them.`
          : `Pay once to set health factor alerts on ${position.chainName} and other networks. Nothing renews automatically: you pay from your wallet when you want to extend.`
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

    <Card>
      <div className="flex items-start justify-between gap-4 px-[var(--card-spacing)]">
        <div className="min-w-0">
          <h3 className="m-0 truncate text-base font-medium text-foreground">{position.chainName}</h3>
          <p className="m-0 text-sm text-muted-foreground">Aave V3 market</p>
        </div>
        {position.hasPosition ? <HealthFactorBadge healthFactor={position.healthFactor} /> : null}
      </div>
      <div className="flex flex-col gap-6 px-[var(--card-spacing)]">
        <PositionContent position={position} />
      </div>
    </Card>
  </div>
);
