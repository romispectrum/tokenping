import { cx } from "~~/components/ui/classNames";

/**
 * Marketing pages only. The 1px brand hairline (cyan to pink and violet and back), centred, at most 864px wide.
 * One at each boundary between two consecutive plain sections; never next to a wash, a dark band or the footer,
 * never inside a card. Product UI separates with border-border instead.
 */
export const BrandDivider = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cx("divider-brand print:hidden", className)} />
);
