import type { ReactNode } from "react";
import { cx } from "~~/components/ui";

type DataListProps = {
  className?: string;
  children: ReactNode;
};

/** Label and value rows separated by hairlines. Add `rounded-xl bg-muted p-4` for a panel inside a card. */
export const DataList = ({ className, children }: DataListProps) => (
  <dl className={cx("m-0 flex flex-col divide-y divide-border text-sm", className)}>{children}</dl>
);

type DataRowProps = {
  label: ReactNode;
  children: ReactNode;
};

/** Stacked on phones; from sm the labels share a 10rem column so the values line up. */
export const DataRow = ({ label, children }: DataRowProps) => (
  <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-4">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="m-0 min-w-0 text-foreground">{children}</dd>
  </div>
);

/** A value that has not loaded or could not be read: words, never a 0 that looks like data. */
export const NoData = () => <span className="text-muted-foreground">No data</span>;
