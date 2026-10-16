import { STAT_STRIP_CLASS_NAME, StatCardSkeleton } from "~~/components/custom/aave/StatCard";
import { Card, Skeleton } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";

// Placeholders at the geometry of the real dashboard, so nothing jumps when the data arrives.

const NETWORK_ROW_COUNT = 4;
const STAT_COUNT = 3;
const TABLE_ROW_COUNT = 3;

/** The network list while positions load: rows as tall as NetworkSummaryRow. */
export const NetworkListSkeleton = () => (
  <div aria-hidden="true" className="flex flex-col gap-1">
    {Array.from({ length: NETWORK_ROW_COUNT }, (_, i) => (
      <div key={i} className="flex min-h-11 items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

/** The wallet-wide totals while positions load: the strip with three cells. */
export const StatStripSkeleton = () => (
  <div aria-hidden="true" className={STAT_STRIP_CLASS_NAME}>
    {Array.from({ length: STAT_COUNT }, (_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

/** The selected network's card while positions load: title and badge, three totals, a token table. */
export const PositionDetailsSkeleton = () => (
  <Card aria-hidden="true">
    <div className="flex items-start justify-between gap-4 px-[var(--card-spacing)]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <div className="flex flex-col gap-4 px-[var(--card-spacing)] sm:gap-6">
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {Array.from({ length: STAT_COUNT }, (_, i) => (
          <StatCardSkeleton key={i} variant="panel" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="h-10 bg-muted" />
        {Array.from({ length: TABLE_ROW_COUNT }, (_, i) => (
          <div key={i} className="flex h-12 items-center justify-between gap-6 border-t border-border px-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </Card>
);

/** The alert settings card while positions load: a title row and two summary lines. */
export const AlertSettingsSkeleton = () => (
  <Card aria-hidden="true">
    <div className="flex items-center justify-between gap-4 px-[var(--card-spacing)]">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="flex flex-col gap-3 px-[var(--card-spacing)]">
      <Skeleton className="h-4 w-full max-w-64" />
      <Skeleton className="h-4 w-full max-w-48" />
    </div>
  </Card>
);

/** The whole dashboard before the wallet state is known: the toolbar, the totals and the two columns. */
export const DashboardSkeleton = () => {
  const t = useMessages(DASHBOARD_MESSAGES);
  return (
    <div aria-busy="true" className="flex flex-col gap-4 sm:gap-6">
      <span role="status" className="sr-only">
        {t.loadingDashboard}
      </span>
      <div aria-hidden="true" className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="size-11 sm:h-10 sm:w-44" />
      </div>
      <StatStripSkeleton />
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
        <Card aria-hidden="true" size="sm" className="min-w-0 lg:col-span-5">
          <div className="px-[var(--card-spacing)]">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="px-2">
            <NetworkListSkeleton />
          </div>
        </Card>
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:col-span-7">
          <AlertSettingsSkeleton />
          <PositionDetailsSkeleton />
        </div>
      </div>
    </div>
  );
};
