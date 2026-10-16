"use client";

import { useMemo } from "react";
import { Layers, RotateCw } from "lucide-react";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { AddressChip } from "~~/components/custom/aave/AddressChip";
import { InlineError } from "~~/components/custom/aave/InlineError";
import { NetworkSummaryRow } from "~~/components/custom/aave/NetworkSummaryRow";
import { PositionAccess } from "~~/components/custom/aave/PositionAccess";
import { PositionDetails } from "~~/components/custom/aave/PositionDetails";
import {
  AlertSettingsSkeleton,
  NetworkListSkeleton,
  PositionDetailsSkeleton,
  StatStripSkeleton,
} from "~~/components/custom/aave/PositionsSkeleton";
import { STAT_STRIP_CLASS_NAME, StatCard } from "~~/components/custom/aave/StatCard";
import { useSelectedChainId } from "~~/components/custom/aave/useSelectedChainId";
import { Alert, Button, Card, EmptyState, LiveRegion } from "~~/components/ui";
import { useAavePositions } from "~~/hooks/custom/useAavePositions";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { formatUSD } from "~~/utils/format";

export const AavePositions = () => {
  const t = useMessages(DASHBOARD_MESSAGES);
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
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* The one action here is secondary: the view's pink belongs to the paywall or the alert form. One row at every
          width: below sm the button keeps its icon and its name, and drops the visible words. */}
      <div className="flex items-center justify-between gap-3">
        {account ? (
          <p className="m-0 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true">{t.toolbar.wallet}</span>
            <AddressChip address={account} label={t.toolbar.wallet} />
          </p>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          onClick={refetch}
          loading={isLoading}
          loadingText={<span className="sr-only sm:not-sr-only">{t.toolbar.refreshing}</span>}
          className="shrink-0"
        >
          <RotateCw aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t.toolbar.refresh}</span>
        </Button>
      </div>

      <LiveRegion className="sr-only">{isLoading ? t.toolbar.loadingPositions : ""}</LiveRegion>

      {isTotalOutage ? (
        <Card>
          <InlineError title={t.errors.positionsDidNotLoad} detail={error} onRetry={refetch} />
        </Card>
      ) : (
        <>
          {error ? (
            <Alert
              role="alert"
              variant="warning"
              title={t.errors.refreshFailed}
              action={
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RotateCw aria-hidden="true" />
                  {t.errors.tryAgain}
                </Button>
              }
            >
              <p>{error}</p>
              <p>{t.errors.showingLastPositions}</p>
            </Alert>
          ) : null}

          {isLoading && positions.length === 0 ? (
            <StatStripSkeleton />
          ) : (
            <dl className={STAT_STRIP_CLASS_NAME}>
              <StatCard label={t.totals.supplied} value={formatUSD(totalCollateralUSD)} />
              <StatCard label={t.totals.borrowed} value={formatUSD(totalDebtUSD)} />
              <StatCard label={t.totals.netWorth} value={formatUSD(totalNetWorthUSD)} />
            </dl>
          )}

          {/* From lg, two columns: the network picker and the payment on the left, the selected network's alert
              settings and then its position on the right. */}
          <div aria-busy={isLoading || undefined} className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
            {/* The network picker is this view's main control, so a region beside the details, not a complementary
                aside (a named aside inside the positions region would be a nested complementary landmark). */}
            <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-5">
              <section aria-labelledby="networks-heading" className="min-w-0">
                <Card size="sm">
                  <div className="flex items-baseline justify-between gap-3 px-[var(--card-spacing)]">
                    <h3 id="networks-heading" className="m-0 text-base font-medium text-foreground">
                      {t.networks.heading}
                    </h3>
                    <p className="m-0 text-sm text-muted-foreground tabular-nums">
                      {t.networks.active(positionsWithData.length)}
                    </p>
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
                      <p className="m-0 px-3 text-sm text-muted-foreground">{t.networks.noPositions}</p>
                    )}
                  </div>
                </Card>
              </section>

              {/* Absent while refreshing, like the details: the paywall restarts with the new data. */}
              {!isLoading && selectedPosition ? (
                <PositionAccess
                  position={selectedPosition}
                  hasNotificationConfig={hasNotification(selectedPosition.chainId)}
                />
              ) : null}
            </div>

            <section aria-label={t.networks.selectedRegion} className="min-w-0 lg:col-span-7">
              {isLoading ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  <AlertSettingsSkeleton />
                  <PositionDetailsSkeleton />
                </div>
              ) : selectedPosition ? (
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Keyed by chain so switching networks discards the previous network's unsaved form. It shows a
                      locked summary until the wallet has paid, and nothing while there is neither access nor a config. */}
                  <NotificationConfig
                    key={selectedPosition.chainId}
                    chainId={selectedPosition.chainId}
                    chainName={selectedPosition.chainName}
                    currentHealthFactor={selectedPosition.healthFactor}
                  />
                  <PositionDetails position={selectedPosition} />
                </div>
              ) : (
                <Card>
                  <EmptyState
                    size="inline"
                    icon={Layers}
                    headingLevel={3}
                    title={t.networks.noneSelectedTitle}
                    description={t.networks.noneSelectedDescription}
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
