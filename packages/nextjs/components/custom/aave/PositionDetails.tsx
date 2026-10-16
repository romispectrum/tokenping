import { Layers } from "lucide-react";
import { HealthFactorBadge } from "~~/components/custom/HealthFactorBadge";
import { StatCard } from "~~/components/custom/aave/StatCard";
import { COLLATERAL_COLUMNS, CollateralTokenRow, DEBT_COLUMNS, DebtTokenRow } from "~~/components/custom/aave/TokenRow";
import { TokenTable } from "~~/components/custom/aave/TokenTable";
import { getCollateralTokens, getDebtTokens } from "~~/components/custom/aave/positionsView";
import { Alert, Card } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import type { NetworkPosition } from "~~/services/aave/positions";
import { formatUSD } from "~~/utils/format";

type PositionDetailsProps = {
  position: NetworkPosition;
};

const PositionContent = ({ position }: PositionDetailsProps) => {
  const t = useMessages(DASHBOARD_MESSAGES);
  if (!position.hasPosition) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Layers aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <p className="m-0 text-base font-medium text-foreground">{t.position.noPositionTitle(position.chainName)}</p>
          <p className="m-0 text-sm text-muted-foreground">{t.position.noPositionDetail(position.chainName)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Three label-value rows on a phone, three panels side by side from sm. */}
      <dl className="m-0 grid gap-2 sm:grid-cols-3 sm:gap-3">
        <StatCard variant="panel" label={t.position.collateral} value={formatUSD(position.totalCollateralUSD)} />
        <StatCard variant="panel" label={t.position.debt} value={formatUSD(position.totalDebtUSD)} />
        <StatCard variant="panel" label={t.position.netWorth} value={formatUSD(position.netWorthUSD)} />
      </dl>

      {position.tokens.length > 0 ? (
        <>
          <TokenTable
            id={`supplied-${position.chainId}`}
            title={t.position.suppliedTitle}
            columns={COLLATERAL_COLUMNS}
            tokens={getCollateralTokens(position.tokens)}
            chainId={position.chainId}
            Row={CollateralTokenRow}
            emptyText={t.position.noCollateral}
          />
          <TokenTable
            id={`borrowed-${position.chainId}`}
            title={t.position.borrowedTitle}
            columns={DEBT_COLUMNS}
            tokens={getDebtTokens(position.tokens)}
            chainId={position.chainId}
            Row={DebtTokenRow}
            emptyText={t.position.noDebt}
          />
          <p className="m-0 text-xs text-muted-foreground">
            {t.position.tokenIconsFrom}{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-link underline underline-offset-3 hover:decoration-2 pointer-coarse:min-h-11"
            >
              CoinGecko
              <span className="sr-only">{` ${t.opensInNewTab}`}</span>
            </a>
          </p>
        </>
      ) : (
        // Partial data: the account summary loaded but the per-token reads did not.
        <Alert variant="warning" title={t.position.tokenDetailsFailedTitle}>
          <p>{t.position.tokenDetailsFailedBody}</p>
        </Alert>
      )}
    </>
  );
};

/** The selected network's position: its health factor, the three totals and the token tables. */
export const PositionDetails = ({ position }: PositionDetailsProps) => {
  const t = useMessages(DASHBOARD_MESSAGES);
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 px-[var(--card-spacing)]">
        <div className="min-w-0">
          <h3 className="m-0 truncate text-base font-medium text-foreground">{position.chainName}</h3>
          <p className="m-0 text-sm text-muted-foreground">{t.position.market}</p>
        </div>
        {position.hasPosition ? <HealthFactorBadge healthFactor={position.healthFactor} /> : null}
      </div>
      <div className="flex flex-col gap-4 px-[var(--card-spacing)] sm:gap-6">
        <PositionContent position={position} />
      </div>
    </Card>
  );
};
