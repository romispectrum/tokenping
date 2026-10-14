import type { ComponentType } from "react";
import type { TokenPosition } from "~~/services/aave/positions";

type TokenListPanelTone = "collateral" | "debt";

const PANEL_STYLES: Record<TokenListPanelTone, { panel: string; title: string }> = {
  collateral: {
    panel:
      "rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/15 dark:bg-emerald-950/10 p-3",
    title: "text-xs font-semibold text-emerald-600 dark:text-emerald-300",
  },
  debt: {
    panel: "rounded-xl border border-red-500/20 bg-red-500/5 dark:border-red-500/15 dark:bg-red-950/10 p-3",
    title: "text-xs font-semibold text-red-600 dark:text-red-300",
  },
};

type TokenListPanelProps = {
  title: string;
  tone: TokenListPanelTone;
  tokens: readonly TokenPosition[];
  Row: ComponentType<{ token: TokenPosition }>;
  emptyText: string;
};

/** A titled list with one `Row` per token and an asset count, or `emptyText` when there are no tokens. */
export const TokenListPanel = ({ title, tone, tokens, Row, emptyText }: TokenListPanelProps) => (
  <div className={PANEL_STYLES[tone].panel}>
    <div className="flex items-center justify-between mb-2">
      <p className={PANEL_STYLES[tone].title}>{title}</p>
      <p className="text-[10px] text-base-content/60 dark:text-gray-500">{tokens.length} assets</p>
    </div>
    {tokens.length > 0 ? (
      <div className="space-y-2">
        {tokens.map(token => (
          <Row key={token.asset} token={token} />
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-base-content/60 dark:text-gray-500 text-sm">{emptyText}</div>
    )}
  </div>
);
