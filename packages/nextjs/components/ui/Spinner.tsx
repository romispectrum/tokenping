import { LoaderCircle } from "lucide-react";
import { cx } from "~~/components/ui/classNames";

type SpinnerProps = {
  /** Visible text naming the wait, without trailing dots ("Loading balances"). It also makes this a status. */
  label?: string;
  className?: string;
};

/**
 * A short wait of unknown length. With a label it is a polite status with visible text; without one it is a
 * decorative icon for composing next to text that already says what is happening. Buttons use `loading` instead.
 * It stops spinning under reduced motion; the text still explains the wait.
 */
export const Spinner = ({ label, className }: SpinnerProps) => {
  const icon = (
    <LoaderCircle
      aria-hidden="true"
      className={cx(
        "size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none",
        !label && className,
      )}
    />
  );
  if (!label) return icon;
  return (
    <span role="status" className={cx("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      {icon}
      {label}
    </span>
  );
};
