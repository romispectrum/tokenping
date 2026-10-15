import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/**
 * Marketing pages only. The frosted grain glass card: a translucent surface with the analog grain, a 4px backdrop
 * blur and a 22px radius; the frame shadow on light, a hairline and no shadow on dark. At most one per view and two
 * per page (the hero and one closing frame). Text over it is text-foreground, never muted (a glow can sit behind
 * it), and form fields inside it stay opaque. The caller sets the padding.
 */
export const GrainCard = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    className={cx(
      "grain relative rounded-3xl border border-border/70 bg-background/40 shadow-frame backdrop-blur-xs",
      "dark:border-border dark:bg-card/70",
      "print:border-border print:bg-background print:bg-none print:shadow-none print:backdrop-blur-none",
      className,
    )}
  />
);
