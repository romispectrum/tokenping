import { cx } from "~~/components/ui/classNames";

// Class strings for Button and for links styled as buttons. No "use client": Server Components call
// buttonClasses() to style a next/link <Link>, which is navigation and must not become a <button>.

export type ButtonVariant = "default" | "inverse" | "secondary" | "outline" | "ghost" | "link" | "destructive";
export type ButtonSize = "sm" | "default" | "lg" | "icon";

/**
 * DaisyUI's btn gives the box: 40px tall from --size-field, the 10px field radius (and join support), flex
 * centring. The utilities add the brand look. Focus is the 2px --ring outline; the press moves 1px down (not on
 * menu triggers); a loading button (aria-busy) keeps full colour while aria-disabled blocks the pointer.
 * Disabled is the variant's own look at half opacity. DaisyUI greys a disabled btn with a three-class selector,
 * so each filled variant restores its fill with an important disabled: utility.
 * Each property is set once per variant and size: utilities that collide resolve by stylesheet order, not by
 * the order of the class names.
 */
const BASE = [
  "btn gap-2 font-medium whitespace-nowrap",
  "transition-[color,background-color,border-color,box-shadow,filter,translate] duration-200 ease-[ease]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "active:not-aria-[haspopup]:translate-y-px",
  "disabled:pointer-events-none disabled:opacity-50",
  "aria-disabled:pointer-events-none not-aria-busy:aria-disabled:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(" ");

/**
 * One default (pink) button per view: the primary action. inverse is the strong second action, secondary the
 * everyday one, outline the neutral alternative, ghost the chrome-less icon or row action, link a text action,
 * destructive only the confirming step of a destructive action. Hover and selected states are never pink.
 */
export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default:
    "btn-primary border-transparent hover:[--btn-bg:var(--color-primary)] hover:brightness-110 motion-safe:hover:-translate-y-0.5 disabled:bg-primary! disabled:text-primary-foreground",
  inverse:
    "btn-neutral border-transparent hover:bg-inverse/90 motion-safe:hover:-translate-y-0.5 disabled:bg-inverse! disabled:text-inverse-foreground",
  secondary:
    "border-transparent bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground disabled:bg-secondary!",
  outline:
    "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground disabled:bg-background!",
  ghost:
    "btn-ghost border-transparent text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground",
  link: "btn-link border-transparent text-link underline decoration-1 underline-offset-4 hover:decoration-2",
  destructive:
    "btn-error border-transparent hover:bg-destructive/90 disabled:bg-destructive! disabled:text-destructive-foreground",
};

/** 32 / 40 / 48px; every size reaches 44px on touch screens. */
export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "btn-sm px-3 text-sm pointer-coarse:min-h-11",
  default: "px-4 text-sm pointer-coarse:min-h-11",
  lg: "btn-lg px-6 text-base [&_svg:not([class*='size-'])]:size-5",
  icon: "btn-square pointer-coarse:min-h-11 pointer-coarse:min-w-11",
};

type ButtonClassesOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export const buttonClasses = ({ variant = "default", size = "default", className }: ButtonClassesOptions = {}) =>
  cx(BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
