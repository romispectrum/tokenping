import Link from "next/link";
import type { Crumb } from "~~/utils/seo";

type BreadcrumbsProps = {
  /** The same steps passed to breadcrumbJsonLd, so the visible trail and the JSON-LD cannot drift. */
  crumbs: readonly Crumb[];
};

export const Breadcrumbs = ({ crumbs }: BreadcrumbsProps) => (
  // overflow-hidden + min-w-0: a long current-page name truncates instead of making the trail scroll sideways.
  <nav
    aria-label="Breadcrumb"
    className="breadcrumbs overflow-hidden text-sm text-base-content/70 dark:text-gray-400 py-0 mb-4"
  >
    <ol>
      {crumbs.map(({ name, path }, index) => {
        const isCurrent = index === crumbs.length - 1;
        return (
          <li key={`${index}-${name}`} className={isCurrent ? "min-w-0" : "shrink-0"}>
            {isCurrent || path === undefined ? (
              // daisyUI makes this span a flex box, which cannot show an ellipsis itself; the inner span can.
              <span aria-current={isCurrent ? "page" : undefined} className="min-w-0">
                <span className="min-w-0 truncate">{name}</span>
              </span>
            ) : (
              <Link href={path} className="link link-hover">
                {name}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
