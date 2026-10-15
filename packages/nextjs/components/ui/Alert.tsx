import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from "lucide-react";
import { cx } from "~~/components/ui/classNames";

export type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

const VARIANTS: Record<AlertVariant, { surface: string; icon: string; Icon: LucideIcon }> = {
  default: { surface: "border-border bg-card", icon: "text-muted-foreground", Icon: Info },
  info: { surface: "border-info/30 bg-info-subtle", icon: "text-info", Icon: Info },
  success: { surface: "border-success/30 bg-success-subtle", icon: "text-success", Icon: CircleCheck },
  warning: { surface: "border-warning/30 bg-warning-subtle", icon: "text-warning", Icon: TriangleAlert },
  destructive: { surface: "border-destructive/30 bg-destructive-subtle", icon: "text-destructive", Icon: CircleAlert },
};

type AlertProps = Omit<ComponentProps<"div">, "title"> & {
  variant?: AlertVariant;
  /** A few words naming the state ("Wrong network"). The status colour is never the only signal. */
  title?: ReactNode;
  /** Replaces the variant's icon; null hides it. */
  icon?: LucideIcon | null;
  /** One action under the text, usually an outline Button ("Try again"). */
  action?: ReactNode;
};

/**
 * An inline, persistent message: status tint, status-coloured icon, title in the foreground colour. An alert on
 * the page from the start is content (role "note", the default). An alert that appears after an action must be
 * announced: render it inside a LiveRegion that is already in the DOM.
 */
export const Alert = ({ variant = "default", title, icon, action, className, children, ...props }: AlertProps) => {
  const { surface, icon: iconColor, Icon: DefaultIcon } = VARIANTS[variant];
  const Icon = icon === null ? null : (icon ?? DefaultIcon);
  return (
    <div
      role="note"
      {...props}
      data-variant={variant}
      className={cx("flex w-full gap-3 rounded-xl border p-4 text-left text-sm text-foreground", surface, className)}
    >
      {Icon ? <Icon aria-hidden="true" className={cx("mt-0.5 size-5 shrink-0", iconColor)} /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <div className="font-medium text-foreground">{title}</div> : null}
        {children ? (
          <div className="text-sm text-muted-foreground [&_a]:text-link [&_a]:underline [&_a]:underline-offset-4 [&_p]:m-0">
            {children}
          </div>
        ) : null}
        {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
};

type LiveRegionProps = ComponentProps<"div"> & {
  /** "polite" for confirmations, "assertive" for errors that block the task. */
  politeness?: "polite" | "assertive";
};

/**
 * Keeps a live region mounted so a message rendered into it later is announced. A region created together with
 * its message is often not read.
 */
export const LiveRegion = ({ politeness = "polite", ...props }: LiveRegionProps) => (
  <div aria-live={politeness} aria-atomic="true" {...props} />
);
