"use client";

import { useMemo } from "react";
import { Layers, RotateCw } from "lucide-react";
import { AddressChip } from "~~/components/custom/aave/AddressChip";
import { InlineError } from "~~/components/custom/aave/InlineError";
import { NetworkSummaryRow } from "~~/components/custom/aave/NetworkSummaryRow";
import { PositionDetails } from "~~/components/custom/aave/PositionDetails";
import { NetworkListSkeleton, PositionDetailsSkeleton } from "~~/components/custom/aave/PositionsSkeleton";
import { StatCard, StatCardSkeleton } from "~~/components/custom/aave/StatCard";
import { useSelectedChainId } from "~~/components/custom/aave/useSelectedChainId";
import { Alert, Button, Card, EmptyState, LiveRegion } from "~~/components/ui";
import { useAavePositions } from "~~/hooks/custom/useAavePositions";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { formatUSD } from "~~/utils/format";

const STAT_COUNT = 3;

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

  // With no network read there is nothing to total or select, so the error stands alone. A failed refresh keeps the
  // last positions on screen below it.
  const isTotalOutage = error !== null && positions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* The one action here is secondary: the view's pink belongs to the paywall or the alert form. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {account ? (
          <p className="m-0 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true">Wallet</span>
            <AddressChip address={account} label="Wallet" />
          </p>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          onClick={refetch}
          loading={isLoading}
          loadingText="Refreshing"
          className="w-full sm:w-auto"
        >
          <RotateCw aria-hidden="true" />
          Refresh positions
        </Button>
      </div>

      <LiveRegion className="sr-only">{isLoading ? "Loading positions" : ""}</LiveRegion>

      {isTotalOutage ? (
        <Card>
          <InlineError title="Positions did not load" detail={error} onRetry={refetch} />
        </Card>
      ) : (
        <>
          {error ? (
            <Alert
              role="alert"
              variant="warning"
              title="Refresh failed"
              action={
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RotateCw aria-hidden="true" />
                  Try again
                </Button>
              }
            >
              <p>{error}</p>
              <p>Showing the positions from the last successful load.</p>
            </Alert>
          ) : null}

          {isLoading && positions.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: STAT_COUNT }, (_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <dl className="m-0 grid gap-4 sm:grid-cols-3">
              <StatCard label="Total supplied" value={formatUSD(totalCollateralUSD)} />
              <StatCard label="Total borrowed" value={formatUSD(totalDebtUSD)} />
              <StatCard label="Net worth" value={formatUSD(totalNetWorthUSD)} />
            </dl>
          )}

          <div aria-busy={isLoading || undefined} className="grid gap-6 lg:grid-cols-12">
            {/* The network picker is this view's main control, so a region beside the details, not a complementary
                aside (a named aside inside the positions region would be a nested complementary landmark). */}
            <section aria-labelledby="networks-heading" className="min-w-0 lg:col-span-5">
              <Card size="sm">
                <div className="flex items-baseline justify-between gap-3 px-[var(--card-spacing)]">
                  <h3 id="networks-heading" className="m-0 text-base font-medium text-foreground">
                    Networks
                  </h3>
                  <p className="m-0 text-sm text-muted-foreground tabular-nums">{positionsWithData.length} active</p>
                </div>
                <div className="flex flex-col gap-3 px-2">
                  {isLoading ? (
                    <NetworkListSkeleton />
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {positions.map(p => (
                        <li key={p.chainId} className="m-0">
                          <NetworkSummaryRow
                            position={p}
                            isSelected={p.chainId === selectedChainId}
                            onSelect={() => setSelectedChainId(p.chainId)}
                            hasNotification={hasNotification(p.chainId)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {!isLoading && !error && positionsWithData.length === 0 && (
                    <p className="m-0 px-3 text-sm text-muted-foreground">
                      No active Aave positions detected on supported networks.
                    </p>
                  )}
                </div>
              </Card>
            </section>

            <section aria-label="Selected network" className="min-w-0 lg:col-span-7">
              {isLoading ? (
                <PositionDetailsSkeleton />
              ) : selectedPosition ? (
                <PositionDetails
                  position={selectedPosition}
                  hasNotificationConfig={hasNotification(selectedPosition.chainId)}
                />
              ) : (
                <Card>
                  <EmptyState
                    size="inline"
                    icon={Layers}
                    headingLevel={3}
                    title="No network selected"
                    description="Select a network to view its Aave position."
                  />
                </Card>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};
