import { Skeleton, cx } from "~~/components/ui";

type StatCardVariant = "card" | "panel";

const SURFACE: Record<StatCardVariant, string> = {
  // a flat card of its own (the totals row)
  card: "gap-2 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6",
  // an inner panel inside a card: cards are never nested
  panel: "gap-1 rounded-xl bg-muted p-4",
};

const VALUE_SIZE: Record<StatCardVariant, string> = {
  card: "text-3xl tracking-tight",
  panel: "text-xl",
};

type StatCardProps = {
  label: string;
  /** Preformatted. null when the number is not known: it reads "No data", never 0. */
  value: string | null;
  variant?: StatCardVariant;
};

/**
 * A key number: the label, then the value in Satoshi Bold with tabular figures. Render it in a `<dl>`; each card is a
 * dt/dd pair. Flat, no tint: the numbers are not statuses.
 */
export const StatCard = ({ label, value, variant = "card" }: StatCardProps) => (
  <div className={cx("flex min-w-0 flex-col", SURFACE[variant])}>
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
 * The loading footprint of a StatCard. Render the loading row as a `<div>`, not a `<dl>`: a skeleton has no dt/dd.
 * The panel placeholder is outlined instead of muted, or the muted skeleton bars would vanish into it.
 */
export const StatCardSkeleton = ({ variant = "card" }: { variant?: StatCardVariant }) => (
  <div
    aria-hidden="true"
    className={cx("flex flex-col", variant === "card" ? SURFACE.card : "gap-1 rounded-xl border border-border p-4")}
  >
    <Skeleton className="h-5 w-24" />
    <Skeleton className={variant === "card" ? "h-9 w-32" : "h-7 w-24"} />
  </div>
);
