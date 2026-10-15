import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/**
 * A placeholder shaped like the content it stands for (text line `h-4 w-3/4`, card `h-40 rounded-2xl`). Muted on
 * light, the accent step on dark (dark muted would vanish on a card); it stops pulsing under reduced motion. Wrap
 * the group in `aria-busy="true"` with an sr-only "Loading ..." label; use it only for waits usually over 300ms.
 */
export const Skeleton = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    aria-hidden="true"
    {...props}
    data-slot="skeleton"
    className={cx("animate-pulse rounded-lg bg-muted motion-reduce:animate-none dark:bg-accent", className)}
  />
);
