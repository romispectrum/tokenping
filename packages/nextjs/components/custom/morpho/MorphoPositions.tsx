"use client";

import { useState } from "react";
import { Layers, RotateCw } from "lucide-react";
import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import { AddressChip } from "~~/components/custom/aave/AddressChip";
import {
  AlertSettingsSkeleton,
  NetworkListSkeleton,
  PositionDetailsSkeleton,
} from "~~/components/custom/aave/PositionsSkeleton";
import { MorphoPositionDetails } from "~~/components/custom/morpho/MorphoPositionDetails";
import { MorphoPositionRow } from "~~/components/custom/morpho/MorphoPositionRow";
import { hasDebt, healthFactorText, marketName } from "~~/components/custom/morpho/morphoView";
import { Alert, Button, Card, EmptyState, LiveRegion } from "~~/components/ui";
import type { MarketRef } from "~~/config/aaveConfig";
import { getMorphoChain } from "~~/config/morpho";
import { type MorphoPositionItem, useMorphoPositions } from "~~/hooks/custom/useMorphoPositions";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { useLocale } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";

const refOf = ({ ref }: MorphoPositionItem): MarketRef => ({
  protocol: ref.protocol,
  chainId: ref.chainId,
  market: ref.marketId,
});

/** The name the alert form and the paywall use, before the market is read too. */
const itemName = (item: MorphoPositionItem) =>
  item.position
    ? marketName(item.position)
    : marketName({ chain: getMorphoChain(item.ref.chainId)!, params: null, marketId: item.ref.marketId });

/**
 * The Morpho dashboard, laid out like /aave: the market list and the payment on the left; the selected market's alert
 * settings and its position on the right.
 */
export const MorphoPositions = () => {
  const locale = useLocale();
  const t = MORPHO_MESSAGES[locale];
  const dashboard = DASHBOARD_MESSAGES[locale];
  const { account, items, isDiscovering, discoveryFailed, refetch } = useMorphoPositions();
  const { hasConfig, isLoaded: configsLoaded } = useNotificationConfig();
  const hasNotification = (item: MorphoPositionItem) => configsLoaded && hasConfig(refOf(item));

  // A pick belongs to the account it was made for and holds while the list still has it; otherwise the first market.
  const [pick, setPick] = useState<{ account: string | null; key: string | null }>({ account: null, key: null });
  const selected =
    (pick.account === account ? items.find(({ key }) => key === pick.key) : undefined) ?? items[0] ?? null;

  const isLoading = isDiscovering || items.some(item => item.isLoading);
  const withDebt = items.filter(({ position }) => hasDebt(position?.reading)).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-3">
        {account ? (
          <p className="m-0 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true">{dashboard.toolbar.wallet}</span>
            <AddressChip address={account} label={dashboard.toolbar.wallet} />
          </p>
        ) : (
          <span />
        )}
        <Button
          variant="outline"
          onClick={refetch}
          loading={isLoading}
          loadingText={<span className="sr-only sm:not-sr-only">{dashboard.toolbar.refreshing}</span>}
          className="shrink-0"
        >
          <RotateCw aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{dashboard.toolbar.refresh}</span>
        </Button>
      </div>

      <LiveRegion className="sr-only">{isLoading ? dashboard.toolbar.loadingPositions : ""}</LiveRegion>

      {discoveryFailed ? (
        <Alert
          role="alert"
          variant="warning"
          title={dashboard.errors.positionsDidNotLoad}
          action={
            <Button variant="outline" size="sm" onClick={refetch}>
              <RotateCw aria-hidden="true" />
              {dashboard.errors.tryAgain}
            </Button>
          }
        >
          <p>{t.list.discoveryFailed}</p>
        </Alert>
      ) : null}

      <div aria-busy={isLoading || undefined} className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-5">
          <section aria-labelledby="morpho-markets-heading" className="min-w-0">
            <Card size="sm">
              <div className="flex items-baseline justify-between gap-3 px-[var(--card-spacing)]">
                <h3 id="morpho-markets-heading" className="m-0 text-base font-medium text-foreground">
                  {t.list.heading}
                </h3>
                <p className="m-0 text-sm text-muted-foreground tabular-nums">{t.list.count(withDebt)}</p>
              </div>
              <div className="flex flex-col gap-3 px-2">
                {isDiscovering && items.length === 0 ? (
                  <NetworkListSkeleton />
                ) : items.length === 0 ? (
                  <p className="m-0 px-3 text-sm text-muted-foreground">{t.list.none}</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {items.map(item => (
                      <li key={item.key} className="m-0">
                        <MorphoPositionRow
                          item={item}
                          isSelected={item.key === selected?.key}
                          onSelect={() => setPick({ account, key: item.key })}
                          hasNotification={hasNotification(item)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </section>

          {selected && !selected.isLoading ? (
            <AccessPaywall
              description={
                hasNotification(selected)
                  ? t.paywall.descriptionExtend(itemName(selected))
                  : t.paywall.descriptionNew(itemName(selected))
              }
              hasExistingConfig={hasNotification(selected)}
            />
          ) : null}
        </div>

        <section aria-label={dashboard.networks.selectedRegion} className="min-w-0 lg:col-span-7">
          {selected?.isLoading || (isDiscovering && !selected) ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              <AlertSettingsSkeleton />
              <PositionDetailsSkeleton />
            </div>
          ) : selected ? (
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Keyed by market, so switching markets drops the previous market's unsaved form. */}
              <NotificationConfig
                key={selected.key}
                chainId={selected.ref.chainId}
                market={selected.ref.marketId}
                protocol={selected.ref.protocol}
                chainName={itemName(selected)}
                chainNameKind="market"
                currentHealthFactor={selected.position?.reading ? healthFactorText(selected.position.reading) : ""}
              />
              <MorphoPositionDetails item={selected} onRetry={refetch} />
            </div>
          ) : (
            <Card>
              <EmptyState
                size="inline"
                icon={Layers}
                headingLevel={3}
                title={dashboard.networks.noneSelectedTitle}
                description={t.list.noneSelectedDescription}
              />
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};
