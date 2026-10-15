import type { ComponentProps } from "react";
import { BrandDivider } from "~~/components/ui/BrandDivider";
import { cx } from "~~/components/ui/classNames";

// Layout pieces shared by the marketing pages (home, privacy, not found) and the site chrome (beta strip, header,
// footer). Server Components.

/**
 * The one container: 1200px wide with a 20px gutter that grows to the iOS safe-area insets. The header and the
 * footer use it too, so the logo and the page content share one edge.
 */
export const Container = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    className={cx(
      "mx-auto w-full max-w-[1200px] pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))]",
      className,
    )}
  />
);

/**
 * Section surfaces. "wash" is the lavender breath (the accent tint fading in and out of the page colour): at most
 * two washed areas per page, the hero included, never two in a row.
 */
export const SECTION_SURFACES = {
  plain: "",
  wash: "bg-linear-to-b from-background via-accent/60 to-background dark:via-accent/40",
} as const;

export type SectionSurface = keyof typeof SECTION_SURFACES;

/** The section rhythm, 48px on phones and 80px from md. scroll-mt keeps an in-page target clear of the sticky header. */
export const SECTION_CLASS_NAME = "relative scroll-mt-20 py-12 md:py-20";

/**
 * The brand hairline, inside the container. One at each boundary between two consecutive plain sections; never
 * next to a wash, a dark band or the footer.
 */
export const SectionDivider = () => (
  <Container>
    <BrandDivider />
  </Container>
);
