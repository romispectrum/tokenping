import type { ComponentProps } from "react";
import { cx } from "~~/components/ui/classNames";

type CardProps = ComponentProps<"div"> & {
  /** "sm" tightens the padding to 16px for dense grids. */
  size?: "default" | "sm";
  /** Marketing pages only: adds the plum-tinted card shadow (none in dark). Product UI cards stay flat. */
  marketing?: boolean;
};

/**
 * The canonical card: 18px radius, hairline border, bg-card, no shadow, 20px padding (24px from sm). Never nest
 * cards: an inner panel is `rounded-xl bg-muted p-4`. Only a card that is itself a link lifts on hover.
 */
export const Card = ({ size = "default", marketing = false, className, ...props }: CardProps) => (
  <div
    {...props}
    data-slot="card"
    data-size={size}
    className={cx(
      "card group/card gap-4 overflow-hidden rounded-2xl border border-border bg-card text-sm text-card-foreground",
      "py-[var(--card-spacing)] has-[>[data-slot=card-footer]]:pb-0",
      size === "sm" ? "[--card-spacing:1rem]" : "[--card-spacing:1.25rem] sm:[--card-spacing:1.5rem]",
      marketing && "shadow-card",
      className,
    )}
  />
);

export const CardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    data-slot="card-header"
    className={cx("grid auto-rows-min items-start gap-1.5 px-[var(--card-spacing)]", className)}
  />
);

type CardTitleProps = ComponentProps<"h3"> & {
  /** The heading level that fits the page outline; a plain div when the title is not a heading. */
  as?: "h2" | "h3" | "h4" | "div";
};

export const CardTitle = ({ as: Tag = "h3", className, ...props }: CardTitleProps) => (
  <Tag
    {...props}
    data-slot="card-title"
    className={cx("m-0 font-heading text-lg leading-snug font-medium group-data-[size=sm]/card:text-base", className)}
  />
);

export const CardDescription = ({ className, ...props }: ComponentProps<"div">) => (
  <div {...props} data-slot="card-description" className={cx("text-sm text-muted-foreground", className)} />
);

export const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div {...props} data-slot="card-content" className={cx("px-[var(--card-spacing)] leading-relaxed", className)} />
);

export const CardFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    data-slot="card-footer"
    className={cx("flex items-center gap-2 border-t border-border px-[var(--card-spacing)] py-4", className)}
  />
);
