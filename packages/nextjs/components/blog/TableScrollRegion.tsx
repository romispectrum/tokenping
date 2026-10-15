"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cx } from "~~/components/ui/classNames";

/** The region's name before hydration and without JavaScript, or when no heading precedes the table. */
export const FALLBACK_TABLE_LABEL = "Table, scrolls horizontally";

const HEADING_TAGS = new Set(["H2", "H3", "H4"]);
// The search for a heading never leaves the post.
const BOUNDARY_TAGS = new Set(["ARTICLE", "MAIN", "BODY"]);
const TABLE_SLOT = "article-table";

/** The nearest h2 to h4 before the element: among its earlier siblings, then its ancestors' (a table in a list). */
const headingBefore = (element: Element) => {
  let node: Element | null = element;
  while (node && !BOUNDARY_TAGS.has(node.tagName)) {
    const previous: Element | null = node.previousElementSibling;
    if (!previous) node = node.parentElement;
    else if (HEADING_TAGS.has(previous.tagName)) return previous;
    else node = previous;
  }
  return null;
};

/**
 * Markdown tables have no caption, so the nearest heading above the table names it ("Table: What is the formula
 * for an Aave liquidation price?"). Tables that share a heading are numbered, so no two regions share a name.
 */
const sectionLabel = (wrapper: HTMLElement) => {
  const heading = headingBefore(wrapper);
  const text = heading?.textContent?.trim();
  if (!heading || !text) return null;
  const tables = [...wrapper.ownerDocument.querySelectorAll(`[data-slot="${TABLE_SLOT}"]`)].filter(
    table => headingBefore(table) === heading,
  );
  return tables.length > 1 ? `Table ${tables.indexOf(wrapper) + 1}: ${text}` : `Table: ${text}`;
};

type TableScrollRegionProps = {
  className: string;
  children: ReactNode;
};

/**
 * The focusable horizontal scroll region around an article table, named after its section. A line under it says
 * the table scrolls while it is wider than the region (most tables on phones, the widest on any screen). Until the
 * width is measured the line shows below md only, where nearly every table scrolls, so hydration rarely moves it.
 */
export const TableScrollRegion = ({ className, children }: TableScrollRegionProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [label, setLabel] = useState(FALLBACK_TABLE_LABEL);
  const [overflowing, setOverflowing] = useState<boolean | null>(null);

  useEffect(() => {
    if (wrapperRef.current) setLabel(sectionLabel(wrapperRef.current) ?? FALLBACK_TABLE_LABEL);
  }, []);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const measure = () => setOverflowing(region.scrollWidth > region.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} data-slot={TABLE_SLOT} className="my-8 lg:-mx-20">
      <div
        ref={regionRef}
        role="region"
        aria-label={label}
        aria-describedby={overflowing ? hintId : undefined}
        tabIndex={0}
        className={className}
      >
        {children}
      </div>
      {overflowing !== false && (
        <p id={hintId} className={cx("mt-2 mb-0 text-sm text-muted-foreground", overflowing === null && "md:hidden")}>
          Scroll sideways to see every column.
        </p>
      )}
    </div>
  );
};
