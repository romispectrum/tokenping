import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "~~/utils/seo";

type BreadcrumbsProps = {
  /** The same steps passed to breadcrumbJsonLd, so the visible trail and the JSON-LD cannot drift. */
  crumbs: readonly Crumb[];
};

/**
 * A quiet 14px trail above the h1: muted links that turn to the foreground colour on hover, aria-hidden chevrons,
 * and the current page as plain text. One line: a long current-page name truncates (min-w-0 down the flex chain)
 * instead of making the trail scroll sideways, and nothing clips the links' focus outline. Links are 44px tall on
 * touch screens.
 */
export const Breadcrumbs = ({ crumbs }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="mb-4 min-w-0 text-sm text-muted-foreground">
    <ol className="m-0 flex min-w-0 list-none items-center gap-1.5 p-0">
      {crumbs.map(({ name, path }, index) => {
        const isCurrent = index === crumbs.length - 1;
        return (
          <li
            key={`${index}-${name}`}
            className={isCurrent ? "flex min-w-0 items-center" : "flex shrink-0 items-center gap-1.5"}
          >
            {isCurrent || path === undefined ? (
              <span aria-current={isCurrent ? "page" : undefined} className="block min-w-0 truncate text-foreground">
                {name}
              </span>
            ) : (
              <>
                <Link
                  href={path}
                  className="inline-flex items-center rounded-sm underline-offset-4 transition-colors duration-150 ease-[ease] hover:text-foreground hover:underline pointer-coarse:min-h-11"
                >
                  {name}
                </Link>
                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
              </>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
