import { formatPostDate } from "~~/components/blog/formatPostDate";

/** The day the articles' on-chain and API figures were read. Change it only when the figures are re-read. */
export const FIGURES_AS_OF = "2026-10-14";

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

/** The standard scope line every article carries under its short answer (marketing plan §3.0). */
export const ScopeNote = () => (
  <p className="my-4 border-l-2 border-base-300 pl-3 text-sm leading-relaxed text-base-content/70 dark:border-white/20 dark:text-gray-400">
    Applies to Aave V3.7, checked on the Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche and Gnosis markets.
    Other V3 markets and networks may run older versions. Aave V4 differences are noted where rules differ. Figures as
    of{" "}
    <time dateTime={FIGURES_AS_OF} title={formatPostDate(FIGURES_AS_OF)}>
      {formatShortDate(FIGURES_AS_OF)}
    </time>
    .
  </p>
);
