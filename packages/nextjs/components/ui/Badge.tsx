import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

export type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "info" | "destructive" | "pink";

/**
 * Sentence case, Medium 500. Only `brand` (a 1 or 2 word category) is Bold uppercase. Status variants are for
 * status only and always carry a word (and usually an icon). `pink` is the view's one pink moment, never a status.
 * Text on fill, light / dark: neutral 5.31 / 10.49, brand 10.62 / 15.03, success 4.94 / 8.25, warning 4.59 / 8.55,
 * info 5.21 / 6.48, destructive 5.40 / 6.82, pink 7.03 / 7.03.
 */
export const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  neutral: "border-border bg-muted text-muted-foreground font-medium",
  brand: "border-transparent bg-accent text-accent-foreground font-bold uppercase tracking-wide",
  success: "border-transparent bg-success-subtle text-success font-medium",
  warning: "border-transparent bg-warning-subtle text-warning font-medium",
  info: "border-transparent bg-info-subtle text-info font-medium",
  destructive: "border-transparent bg-destructive-subtle text-destructive font-medium",
  pink: "border-transparent bg-primary text-primary-foreground font-medium",
};

const BASE = [
  "badge h-6 w-fit shrink-0 gap-1 overflow-hidden rounded-full border px-2.5 text-xs whitespace-nowrap",
  "transition-colors duration-200 ease-[ease]",
  // when badgeClasses() styles a link
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "[&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0",
].join(" ");

/** For a <Link> that looks like a badge: a badge itself is never a button. */
export const badgeClasses = ({ variant = "neutral", className }: { variant?: BadgeVariant; className?: string } = {}) =>
  cx(BASE, BADGE_VARIANTS[variant], className);

type BadgeProps = ComponentProps<"span"> & {
  variant?: BadgeVariant;
  /** A 6px leading dot in the text colour, for status lists and table cells. */
  dot?: boolean;
};

export const Badge = ({ variant = "neutral", dot = false, className, children, ...props }: BadgeProps) => (
  <span {...props} data-variant={variant} className={badgeClasses({ variant, className })}>
    {dot ? <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
    {children}
  </span>
);
