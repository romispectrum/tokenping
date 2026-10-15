import type { CSSProperties } from "react";
import { cx } from "~~/components/ui/classNames";

const PLACEMENTS = {
  "bottom-right": "-right-[28rem] -bottom-[10rem] size-[40rem] blur-[90px] opacity-90 dark:opacity-45",
  "top-left": "-left-[28rem] -top-[14rem] size-[40rem] blur-[90px] opacity-90 dark:opacity-45",
  center:
    "top-1/2 left-1/2 h-[59%] aspect-[1035/527] -translate-x-1/2 -translate-y-1/2 blur-[120px] opacity-50 dark:opacity-30",
} as const;

// The edge glows fade out before the bottom of the card instead of ending in a hard line.
const EDGE_FADE: CSSProperties = {
  maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
};

type GlowProps = {
  placement?: keyof typeof PLACEMENTS;
  className?: string;
};

/**
 * Marketing pages only. The blurred pink to violet glow behind a GrainCard: put it first inside a `relative`
 * wrapper around the card, in a section with `relative isolate overflow-hidden`. It is atmosphere, so it does not
 * use up the view's one pink, but there is never more than one per view, never behind muted text, never animated.
 */
export const Glow = ({ placement = "bottom-right", className }: GlowProps) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit] print:hidden"
    style={placement === "center" ? undefined : EDGE_FADE}
  >
    <div
      className={cx(
        "absolute rounded-full bg-linear-to-r from-brand-pink to-brand-violet",
        PLACEMENTS[placement],
        className,
      )}
    />
  </div>
);

/** The glow for a dark band (a closing call to action): two radial washes; it counts as that view's glow. */
export const GlowWash = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cx("pointer-events-none absolute inset-0 -z-10 print:hidden", className)}
    style={{
      backgroundImage: [
        "radial-gradient(60% 80% at 12% 0%, color-mix(in oklab, var(--brand-pink) 30%, transparent) 0%, transparent 60%)",
        "radial-gradient(55% 75% at 88% 100%, color-mix(in oklab, var(--brand-violet) 32%, transparent) 0%, transparent 60%)",
      ].join(", "),
    }}
  />
);
