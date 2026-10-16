import { NetworkIcon } from "~~/components/custom/aave/NetworkIcon";
import { cx } from "~~/components/ui/classNames";
import { AAVE_CHAINS, AAVE_MARKETS, AAVE_V4_SPOKES } from "~~/config/aaveConfig";

// Every network Tokenping reads, as a tile with its logo and what is read there, instead of a sentence of 22 names.

export type CoverageGridLabels = {
  /** "4 V3 markets", "1 V3 market". */
  v3Markets: (count: number) => string;
  /** "13 V4 Spokes", "1 V4 Spoke". */
  v4Spokes: (count: number) => string;
};

type CoverageGridProps = {
  labels: CoverageGridLabels;
  className?: string;
};

/** The networks in AAVE_CHAINS order with their market counts; a network with one V3 market and no Spoke says so too. */
export const getCoverageTiles = (labels: CoverageGridLabels) =>
  AAVE_CHAINS.map(({ chain, name }) => {
    const v3 = AAVE_MARKETS.filter(market => market.chain.id === chain.id).length;
    const v4 = AAVE_V4_SPOKES.filter(spoke => spoke.chain.id === chain.id).length;
    const details = [v3 > 0 ? labels.v3Markets(v3) : null, v4 > 0 ? labels.v4Spokes(v4) : null].filter(
      (detail): detail is string => detail !== null,
    );
    return { chainId: chain.id, name, detail: details.join(" · ") };
  });

/** Two tiles a row on a phone, up to four from lg: logo, network, then the markets read there in muted text. */
export const CoverageGrid = ({ labels, className }: CoverageGridProps) => (
  <ul className={cx("m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4", className)}>
    {getCoverageTiles(labels).map(({ chainId, name, detail }) => (
      <li
        key={chainId}
        className="m-0 flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-card-foreground"
      >
        <NetworkIcon chainId={chainId} name={name} className="size-7" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{name}</span>
          {/* Wraps: "4 V3 markets · 13 V4 Spokes" is longer than a phone's half-width tile. */}
          <span className="text-xs text-muted-foreground">{detail}</span>
        </span>
      </li>
    ))}
  </ul>
);
