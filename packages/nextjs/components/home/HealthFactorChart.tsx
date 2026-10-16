import type { ReactNode } from "react";
import { cx } from "~~/components/ui/classNames";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD, HEALTH_FACTOR_CRITICAL } from "~~/constants/notifications";

// An illustration of one night: a health factor sliding from safe to critical, the alert going out the first time a
// check finds it below the threshold, hours before the owner looks. The numbers are made up and the caption says
// so; the thresholds and the zones are the app's own (constants/notifications, HealthFactorBadge).

/** Hours after 22:00 on the x axis, health factor on the y axis. The last point is still above 1.0: the alert worked. */
const CURVE: readonly (readonly [hours: number, healthFactor: number])[] = [
  [0, 1.72],
  [1.5, 1.7],
  [3, 1.63],
  [4.2, 1.55],
  [5.08, 1.49],
  [6.5, 1.3],
  [8, 1.16],
  [10, 1.08],
];

const HOURS = 10;
const HF_TOP = 2;
const HF_BOTTOM = 0.9;
const LIQUIDATION = 1;

/** The first check that finds the health factor below the default threshold: 03:05, at 1.49. */
const ALERT_POINT = CURVE[4];
const END_POINT = CURVE[CURVE.length - 1];

// Rounded to a hundredth of a percent: plain numbers in the HTML and the SVG, and no 15-digit floats.
const round = (value: number) => Math.round(value * 100) / 100;
const xPercent = (hours: number) => round((hours / HOURS) * 100);
const yPercent = (healthFactor: number) => round(((HF_TOP - healthFactor) / (HF_TOP - HF_BOTTOM)) * 100);

const CURVE_POINTS = CURVE.map(([hours, hf]) => `${xPercent(hours)},${yPercent(hf)}`).join(" ");

/** 22:00 to 08:00 in two-hour steps. */
const TIME_TICKS = ["22:00", "00:00", "02:00", "04:00", "06:00", "08:00"];

export type HealthFactorChartLabels = {
  /** The y-axis note at the threshold line: "Your threshold". */
  threshold: string;
  /** The y-axis note at 1.0: "Liquidation". */
  liquidation: string;
  /** The chip at the alert point: "Alert sent". */
  alertSent: string;
  /** The chip at the end of the night: "You check your phone". */
  youCheck: string;
  /** Says the numbers are an example; shown under the chart. */
  caption: ReactNode;
};

type HealthFactorChartProps = {
  labels: HealthFactorChartLabels;
  /** Formats a health factor for the page's language ("1.49" or "1,49"). */
  formatNumber: (value: number) => string;
  className?: string;
};

type MarkerProps = {
  hours: number;
  healthFactor: number;
  time: string;
  text: string;
  /** The chip sits to the right of the dot, or to the left at the end of the night. */
  side: "right" | "left";
};

/** A dot on the curve with a small card next to it: the time in data figures, then what happened. */
const Marker = ({ hours, healthFactor, time, text, side }: MarkerProps) => (
  <div
    className="absolute flex items-center gap-2"
    style={{
      left: `${xPercent(hours)}%`,
      top: `${yPercent(healthFactor)}%`,
      transform: side === "right" ? "translate(-7px, -50%)" : "translate(calc(-100% + 7px), -50%)",
      flexDirection: side === "right" ? "row" : "row-reverse",
    }}
  >
    <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full bg-chart-1 ring-2 ring-card" />
    <span className="rounded-lg border border-border bg-card px-2 py-1 text-xs leading-tight whitespace-nowrap text-card-foreground shadow-card">
      <span className="font-data font-bold tabular-nums">{time}</span> {text}
    </span>
  </div>
);

/**
 * The y axis sits in its own column, so its notes never cover the curve; the time axis under the plot. Inside the
 * plot, an SVG stretched to the box draws the zones, the two reference lines and the curve (strokes keep their
 * width through the non-uniform scale), and HTML on top places the two markers at the same percentages. The text is
 * therefore real text at real sizes on every screen.
 */
export const HealthFactorChart = ({ labels, formatNumber, className }: HealthFactorChartProps) => {
  const thresholdY = yPercent(DEFAULT_HEALTH_FACTOR_THRESHOLD);
  const criticalY = yPercent(HEALTH_FACTOR_CRITICAL);
  const liquidationY = yPercent(LIQUIDATION);

  const axisNotes = [
    { hf: HF_TOP, value: formatNumber(HF_TOP), note: undefined },
    {
      hf: DEFAULT_HEALTH_FACTOR_THRESHOLD,
      value: formatNumber(DEFAULT_HEALTH_FACTOR_THRESHOLD),
      note: labels.threshold,
    },
    { hf: LIQUIDATION, value: formatNumber(LIQUIDATION), note: labels.liquidation },
  ];

  return (
    <figure className={cx("m-0", className)}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 pt-3 pr-2">
        {/* y axis */}
        <div className="relative w-14 text-right text-xs text-muted-foreground sm:w-20">
          {axisNotes.map(({ hf, value, note }) => (
            <div
              key={hf}
              className="absolute right-0 flex -translate-y-1/2 flex-col items-end leading-tight"
              style={{ top: `${yPercent(hf)}%` }}
            >
              <span className="font-data tabular-nums">{value}</span>
              {note ? <span className="hidden sm:block">{note}</span> : null}
            </div>
          ))}
        </div>

        {/* plot */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9]">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible rounded-xl"
          >
            {/* the badge's zones: safe at and above the default threshold, risky down to 1.1, critical below */}
            <rect x="0" y="0" width="100" height={thresholdY} className="fill-success-subtle" />
            <rect x="0" y={thresholdY} width="100" height={criticalY - thresholdY} className="fill-warning-subtle" />
            <rect x="0" y={criticalY} width="100" height={100 - criticalY} className="fill-destructive-subtle" />
            <line
              x1="0"
              x2="100"
              y1={thresholdY}
              y2={thresholdY}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="6 5"
              className="stroke-muted-foreground stroke-1"
            />
            <line
              x1="0"
              x2="100"
              y1={liquidationY}
              y2={liquidationY}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="6 5"
              className="stroke-destructive stroke-1"
            />
            <polyline
              points={CURVE_POINTS}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-chart-1 stroke-[2.5]"
            />
          </svg>
          <Marker
            hours={ALERT_POINT[0]}
            healthFactor={ALERT_POINT[1]}
            time="03:05"
            text={`${labels.alertSent} (${formatNumber(ALERT_POINT[1])})`}
            side="right"
          />
          <Marker hours={END_POINT[0]} healthFactor={END_POINT[1]} time="08:00" text={labels.youCheck} side="left" />
        </div>

        {/* time axis */}
        <div aria-hidden="true" />
        <div className="flex justify-between font-data text-xs text-muted-foreground tabular-nums">
          {TIME_TICKS.map(tick => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-muted-foreground">{labels.caption}</figcaption>
    </figure>
  );
};
