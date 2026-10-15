import type { ReactNode } from "react";
import { Kicker } from "~~/components/ui/Kicker";
import { cx } from "~~/components/ui/classNames";

type SectionHeaderProps = {
  title: ReactNode;
  kicker?: string;
  lead?: ReactNode;
  /** The heading id; pass it to the section as aria-labelledby. */
  id?: string;
  /** h1 for a page hero (text-display), h2 for a section (text-section). */
  as?: "h1" | "h2";
  /** Centred by default; "start" for article-like pages. */
  align?: "center" | "start";
  className?: string;
};

/**
 * The one section header formula: kicker 12px above, the heading in text-section (text-display for an h1), the
 * lead in text-lead and muted 16px below, then 40px (48px from md) to the content.
 */
export const SectionHeader = ({
  title,
  kicker,
  lead,
  id,
  as: Heading = "h2",
  align = "center",
  className,
}: SectionHeaderProps) => {
  const centred = align === "center";
  return (
    <header className={cx("mb-10 md:mb-12", centred && "mx-auto max-w-3xl text-center", className)}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <Heading id={id} className={cx(Heading === "h1" ? "text-display" : "text-section", "mb-0 text-balance")}>
        {title}
      </Heading>
      {lead ? (
        <p className={cx("text-lead mt-4 mb-0 max-w-[65ch] text-pretty text-muted-foreground", centred && "mx-auto")}>
          {lead}
        </p>
      ) : null}
    </header>
  );
};
