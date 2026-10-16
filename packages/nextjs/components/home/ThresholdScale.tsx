import { ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { cx } from "~~/components/ui/classNames";
import {
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_CRITICAL,
  HEALTH_FACTOR_RISKY,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
} from "~~/constants/notifications";

// The line a user picks, drawn on the scale the dashboard's badge uses: critical below 1.1, risky below 1.5, safe
// from 1.5. The bar shows 1.0 to 2.0; the caption says how far the typed value may go.

const SCALE_MIN = 1;
const SCALE_MAX = 2;

/** Rounded to a hundredth of a percent: plain numbers in the HTML, and no 15-digit floats. */
const percent = (value: number) => Math.round(((value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 10_000) / 100;

export type ThresholdScaleLabels = {
  liquidation: string;
  critical: string;
  risky: string;
  safe: string;
  /** "Default: 1.5", over the pin. */
  defaultThreshold: (value: string) => string;
  /** "Below 1.1" / "1.1 to 1.5" / "1.5 and above". */
  below: (value: string) => string;
  between: (from: string, to: string) => string;
  andAbove: (value: string) => string;
  /** "You can set any value from 1.1 to 10." */
  range: (min: string, max: string) => string;
};

type ThresholdScaleProps = {
  labels: ThresholdScaleLabels;
  formatNumber: (value: number) => string;
  className?: string;
};

/**
 * A bar in the three status colours, each zone with its icon and its word under it (status never rests on colour
 * alone), the liquidation point at the left end and a pin at the default threshold. Plain HTML: the widths are the
 * zones' shares of 1.0 to 2.0.
 */
export const ThresholdScale = ({ labels, formatNumber, className }: ThresholdScaleProps) => {
  const zones = [
    {
      key: "critical",
      width: percent(HEALTH_FACTOR_CRITICAL),
      fill: "bg-destructive",
      text: "text-destructive",
      Icon: ShieldAlert,
      name: labels.critical,
      range: labels.below(formatNumber(HEALTH_FACTOR_CRITICAL)),
    },
    {
      key: "risky",
      width: percent(HEALTH_FACTOR_RISKY) - percent(HEALTH_FACTOR_CRITICAL),
      fill: "bg-warning",
      text: "text-warning",
      Icon: TriangleAlert,
      name: labels.risky,
      range: labels.between(formatNumber(HEALTH_FACTOR_CRITICAL), formatNumber(HEALTH_FACTOR_RISKY)),
    },
    {
      key: "safe",
      width: 100 - percent(HEALTH_FACTOR_RISKY),
      fill: "bg-success",
      text: "text-success",
      Icon: ShieldCheck,
      name: labels.safe,
      range: labels.andAbove(formatNumber(HEALTH_FACTOR_RISKY)),
    },
  ] as const;

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      {/* the pin's label needs room above the bar */}
      <div className="relative pt-9">
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${percent(DEFAULT_HEALTH_FACTOR_THRESHOLD)}%` }}
        >
          <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium whitespace-nowrap text-card-foreground shadow-card">
            {labels.defaultThreshold(formatNumber(DEFAULT_HEALTH_FACTOR_THRESHOLD))}
          </span>
          <span aria-hidden="true" className="h-3 w-0.5 bg-foreground" />
        </div>
        <div className="flex h-3 overflow-hidden rounded-full">
          {zones.map(({ key, width, fill }) => (
            <div key={key} aria-hidden="true" className={fill} style={{ width: `${width}%` }} />
          ))}
        </div>
        {/* the ends of the scale */}
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            <span className="font-data tabular-nums">{formatNumber(SCALE_MIN)}</span> {labels.liquidation}
          </span>
          <span className="font-data tabular-nums">{formatNumber(SCALE_MAX)}</span>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-2 text-sm">
        {zones.map(({ key, text, Icon, name, range }) => (
          <div key={key} className="flex min-w-0 flex-col gap-0.5">
            <dt className={cx("flex items-center gap-1.5 font-medium", text)}>
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {name}
            </dt>
            <dd className="m-0 text-xs text-muted-foreground tabular-nums">{range}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 text-sm text-muted-foreground">
        {labels.range(formatNumber(HEALTH_FACTOR_THRESHOLD_MIN), formatNumber(HEALTH_FACTOR_THRESHOLD_MAX))}
      </p>
    </div>
  );
};
