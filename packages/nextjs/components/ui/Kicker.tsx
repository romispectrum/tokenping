import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/**
 * The small uppercase label above a heading: 0.8rem Bold, violet on light, cyan on dark, 12px above the heading.
 * Write the text in sentence case; CSS uppercases it (screen readers spell typed capitals letter by letter).
 */
export const Kicker = ({ className, ...props }: ComponentProps<"p">) => (
  <p {...props} className={cx("kicker mt-0 mb-3", className)} />
);
