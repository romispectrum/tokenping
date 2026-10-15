import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

// DaisyUI's input gives the 40px box and the field radius; the utilities keep it filled (bg-background) with the
// --input boundary (3.45:1 light, 3.70:1 dark), the --ring focus outline and the destructive border when invalid.
// 16px text below md stops iOS zooming on focus. Addresses, hashes and amounts add `font-data`.
export const INPUT_CLASSES = [
  "input w-full min-w-0 border border-input bg-background px-3 text-base text-foreground md:text-sm",
  "placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 ease-[ease] pointer-coarse:min-h-11",
  "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted",
].join(" ");

/** Pair it with a Field for the visible label, the description and the error wiring. */
export const Input = ({ className, type = "text", ...props }: ComponentProps<"input">) => (
  <input {...props} type={type} data-slot="input" className={cx(INPUT_CLASSES, className)} />
);
