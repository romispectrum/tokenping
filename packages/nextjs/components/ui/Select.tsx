import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/**
 * A native select (the OS picker on phones) in the Input box: 40px, 44px on touch, filled, --input boundary,
 * --ring focus outline. Two to five options read better as radios; long lists need a search.
 */
export const Select = ({ className, ...props }: ComponentProps<"select">) => (
  <select
    {...props}
    data-slot="select"
    className={cx(
      "select w-full border border-input bg-background text-base text-foreground md:text-sm pointer-coarse:min-h-11",
      "transition-[border-color,box-shadow] duration-200 ease-[ease]",
      "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
  />
);
