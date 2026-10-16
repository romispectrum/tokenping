"use client";

import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { type ButtonSize, type ButtonVariant, buttonClasses } from "~~/components/ui/buttonClasses";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pending work: shows a spinner, sets aria-busy and blocks clicks while the button keeps focus and colour. */
  loading?: boolean;
  /** Label while loading, without trailing dots ("Saving"). Keep it no longer than the label. */
  loadingText?: ReactNode;
};

/**
 * A button for actions. Navigation is a <Link> styled with buttonClasses(). Pending work is `loading`, never
 * `disabled` plus a swapped label: disabled drops focus and fades the button to half opacity. The type defaults to
 * "button", so a submit button says type="submit".
 */
export const Button = ({
  variant,
  size,
  loading = false,
  loadingText,
  className,
  type = "button",
  onClick,
  children,
  ...props
}: ButtonProps) => {
  const ariaDisabled = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // aria-disabled keeps the button focusable, so a keyboard press or a form's implicit submit still clicks it:
    // a loading or aria-disabled button swallows the click instead of relying on each caller to drop its onClick.
    if (loading || ariaDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...props}
      type={type}
      className={buttonClasses({ variant, size, className })}
      aria-busy={loading || undefined}
      aria-disabled={loading || props["aria-disabled"] || undefined}
      onClick={handleClick}
    >
      {loading && loadingText ? (
        // The label stays laid out, invisible, under the spinner and loading label, so the width never shrinks.
        <span className="inline-grid">
          <span
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-2"
          >
            {children}
          </span>
          <span className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2">
            <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            {loadingText}
          </span>
        </span>
      ) : loading ? (
        // No loading label: the spinner sits over the label, which is transparent but keeps the width and the name.
        <span className="inline-grid place-items-center">
          <span className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2 opacity-0">
            {children}
          </span>
          <LoaderCircle
            aria-hidden="true"
            className="col-start-1 row-start-1 animate-spin motion-reduce:animate-none"
          />
        </span>
      ) : (
        children
      )}
    </button>
  );
};
