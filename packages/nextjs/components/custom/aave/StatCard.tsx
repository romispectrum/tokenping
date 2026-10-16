import { Skeleton, cx } from "~~/components/ui";

type StatCardVariant = "cell" | "panel";

/**
 * The strip the wallet-wide totals sit in: one bordered surface with three cells, side by side from sm and as three
 * label-value rows on a phone, so three numbers never cost three stacked cards and a long value never overflows a
 * narrow cell. A styled list, not cards in a card.
 */
export const STAT_STRIP_CLASS_NAME =
  "m-0 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0";

// Below sm a stat is one row, the label left and the value right; from sm the value sits under the label.
const ROW_TO_COLUMN = "items-baseline justify-between gap-3 sm:flex-col sm:items-start sm:gap-1";

const SURFACE: Record<StatCardVariant, string> = {
  // one cell of the totals strip: the strip draws the border
  cell: `${ROW_TO_COLUMN} px-4 py-2.5 text-card-foreground sm:px-5 sm:py-4`,
  // an inner panel inside a card: cards are never nested
  panel: `${ROW_TO_COLUMN} rounded-xl bg-muted px-3 py-2 sm:p-4`,
};

const VALUE_SIZE: Record<StatCardVariant, string> = {
  cell: "text-lg tracking-tight sm:text-2xl",
  panel: "text-base sm:text-xl",
};

type StatCardProps = {
  label: string;
  /** Preformatted. null when the number is not known: it reads "No data", never 0. */
  value: string | null;
  variant?: StatCardVariant;
};

/**
 * A key number: the label, then the value in Satoshi Bold with tabular figures. Render it in a `<dl>`; each one is a
 * dt/dd pair. Flat, no tint: the numbers are not statuses.
 */
export const StatCard = ({ label, value, variant = "cell" }: StatCardProps) => (
  <div className={cx("flex min-w-0", SURFACE[variant])}>
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd
      className={cx(
        "m-0",
        value === null ? "text-sm text-muted-foreground" : cx("font-bold tabular-nums", VALUE_SIZE[variant]),
      )}
    >
      {value ?? "No data"}
    </dd>
  </div>
);

/**
 * The loading footprint of a StatCard. Render the loading strip as a `<div>`, not a `<dl>`: a skeleton has no dt/dd.
 * The panel placeholder is outlined instead of muted, or the muted skeleton bars would vanish into it.
 */
export const StatCardSkeleton = ({ variant = "cell" }: { variant?: StatCardVariant }) => (
  <div
    aria-hidden="true"
    className={cx(
      "flex",
      variant === "cell" ? SURFACE.cell : `${ROW_TO_COLUMN} rounded-xl border border-border px-3 py-2 sm:p-4`,
    )}
  >
    <Skeleton className="h-5 w-24" />
    <Skeleton className={variant === "cell" ? "h-6 w-20 sm:h-8 sm:w-28" : "h-5 w-16 sm:h-7 sm:w-24"} />
  </div>
);
