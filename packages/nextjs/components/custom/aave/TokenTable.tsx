import type { ComponentType } from "react";
import type { TokenRowProps } from "~~/components/custom/aave/TokenRow";
import { cx } from "~~/components/ui";
import type { TokenPosition } from "~~/services/aave/positions";

type Column = { label: string; align: "left" | "right" };

type TokenTableProps = {
  /** Heading id; it also names the table and its scroll region. */
  id: string;
  title: string;
  columns: readonly Column[];
  tokens: readonly TokenPosition[];
  chainId: number;
  Row: ComponentType<TokenRowProps>;
  emptyText: string;
};

/**
 * A titled token table with an asset count, or `emptyText` when there are no tokens. The frame scrolls sideways on a
 * phone instead of cutting columns off; it is focusable and named, so keyboard users can scroll it too. The heading
 * structures the block, so the wrapper is a plain div: only the scroll region is a landmark, named once.
 */
export const TokenTable = ({ id, title, columns, tokens, chainId, Row, emptyText }: TokenTableProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-baseline justify-between gap-3">
      <h4 id={id} className="m-0 text-sm font-medium text-foreground">
        {title}
      </h4>
      <p className="m-0 text-sm text-muted-foreground tabular-nums">
        {tokens.length} {tokens.length === 1 ? "asset" : "assets"}
      </p>
    </div>
    {tokens.length > 0 ? (
      <div
        role="region"
        aria-labelledby={id}
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <table aria-labelledby={id} className="w-full min-w-md border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              {columns.map(({ label, align }) => (
                <th
                  key={label}
                  scope="col"
                  className={cx(
                    "h-10 px-3 text-xs font-bold tracking-wide text-muted-foreground uppercase",
                    align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map(token => (
              <Row key={token.asset} token={token} chainId={chainId} />
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="m-0 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    )}
  </div>
);
