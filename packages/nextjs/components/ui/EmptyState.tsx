import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "~~/components/ui/classNames";

type EmptyStateProps = {
  icon?: LucideIcon;
  /** What will be here ("No alerts yet"), or what was searched ("No positions on Base"). */
  title: string;
  description?: ReactNode;
  /** First use: the view's primary Button. No results: an outline "Clear filters". */
  action?: ReactNode;
  secondaryAction?: ReactNode;
  /** "page": a dashed card filling the content area. "inline": inside a table or a card. */
  size?: "page" | "inline";
  /** The heading level under the page's h1. */
  headingLevel?: 2 | 3;
  className?: string;
};

/** The designed "nothing here" view. Calm by rule: a muted icon tile, no illustration, no pink. */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "page",
  headingLevel = 2,
  className,
}: EmptyStateProps) => {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-4 text-center",
        size === "page" ? "min-h-80 rounded-2xl border border-dashed border-border px-6 py-12" : "px-4 py-8",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <Heading className="m-0 text-base font-medium text-foreground">{title}</Heading>
        {description ? <p className="m-0 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {secondaryAction}
          {action}
        </div>
      ) : null}
    </div>
  );
};
