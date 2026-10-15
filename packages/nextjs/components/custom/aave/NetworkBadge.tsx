import { cx } from "~~/components/ui";

type NetworkBadgeProps = {
  /** The network's display name ("Arbitrum One"). */
  name: string;
  testnet?: boolean;
  className?: string;
};

/**
 * Which network something runs on: a neutral pill with a dot and the name. A testnet gets a dashed outline and a
 * "Testnet" tag, so test funds never look real. The dot is decoration; the visible text is what assistive tech reads
 * (and what translation and reading modes keep), so the pill has no role or label of its own.
 */
export const NetworkBadge = ({ name, testnet = false, className }: NetworkBadgeProps) => (
  <span
    className={cx(
      "inline-flex h-7 max-w-full items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap",
      testnet
        ? "border border-dashed border-input bg-background text-foreground"
        : "bg-secondary text-secondary-foreground",
      className,
    )}
  >
    <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", testnet ? "bg-warning" : "bg-success")} />
    <span className="truncate">{name}</span>
    {testnet ? (
      <span className="rounded-full bg-warning-subtle px-1.5 text-xs font-bold tracking-wide text-foreground uppercase">
        Testnet
      </span>
    ) : null}
  </span>
);
