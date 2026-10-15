import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/**
 * A native checkbox on DaisyUI's checkbox: 20px, 6px radius, --input boundary. Checked is --link (violet with a
 * white mark on light, cyan with a dark mark on dark), never pink. Put it in a horizontal Field: the whole row,
 * label included, is the touch target. Inside a form that needs "Save", use a checkbox; a switch applies immediately.
 */
export const Checkbox = ({ className, ...props }: Omit<ComponentProps<"input">, "type">) => (
  <input
    {...props}
    type="checkbox"
    data-slot="checkbox"
    className={cx(
      "checkbox size-5 shrink-0 bg-background",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
  />
);
