import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

/** The Input box for long text: filled, --input boundary, --ring focus outline. It grows with its content. */
export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    {...props}
    data-slot="textarea"
    className={cx(
      "textarea field-sizing-content min-h-24 w-full resize-y border border-input bg-background px-3 py-2.5 text-base text-foreground md:text-sm",
      "placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 ease-[ease]",
      "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      "aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted",
      className,
    )}
  />
);
