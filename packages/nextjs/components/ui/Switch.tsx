import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/**
 * An on/off setting that applies immediately: a native checkbox with role="switch" on DaisyUI's toggle, drawn as a
 * filled track (--input off, --link on, never pink) with a thumb in the page colour (globals.css). Put it in a
 * horizontal Field: the visible label names it and the whole row is the touch target.
 */
export const Switch = ({ className, ...props }: Omit<ComponentProps<"input">, "type" | "role">) => (
  <input
    {...props}
    type="checkbox"
    role="switch"
    data-slot="switch"
    className={cx(
      "toggle shrink-0",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
  />
);
