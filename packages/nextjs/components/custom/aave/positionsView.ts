import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import type { NetworkPosition, TokenPosition } from "~~/services/aave/positions";
import { formatTokenAmount } from "~~/utils/format";

const NBSP = "\u00A0";

export const getCollateralTokens = (tokens: readonly TokenPosition[]) => tokens.filter(t => t.aTokenBalance > 0n);

export const getDebtTokens = (tokens: readonly TokenPosition[]) =>
  tokens.filter(t => t.stableDebt > 0n || t.variableDebt > 0n);

type DebtLabels = Pick<(typeof DASHBOARD_MESSAGES)["en"]["tokens"], "stable" | "variable">;

/**
 * "Stable X · Variable Y" listing only the non-zero parts, in the language of `labels` (English by default); a
 * non-breaking space keeps the line height when both are zero.
 */
export const formatDebtBreakdown = (
  { stableDebt, variableDebt, decimals }: Pick<TokenPosition, "stableDebt" | "variableDebt" | "decimals">,
  labels: DebtLabels = DASHBOARD_MESSAGES.en.tokens,
) => {
  const parts: string[] = [];
  if (stableDebt > 0n) parts.push(labels.stable(formatTokenAmount(stableDebt, decimals)));
  if (variableDebt > 0n) parts.push(labels.variable(formatTokenAmount(variableDebt, decimals)));
  return parts.join(" · ") || NBSP;
};

/**
 * The market to show, by position.key: the current selection while it is still listed, otherwise the first active
 * market, otherwise the first listed one. A default, once chosen, sticks even if another market becomes the first
 * active one later.
 */
export const resolveSelectedMarketKey = (positions: readonly NetworkPosition[], selectedKey: string | null) => {
  const preferred = positions.find(p => p.hasPosition)?.key ?? positions[0]?.key;
  if (!preferred) return selectedKey;
  if (selectedKey === null) return preferred;
  return positions.some(p => p.key === selectedKey) ? selectedKey : preferred;
};

/**
 * The markets the list shows: every V3 network, and a V4 Spoke only when the wallet has a position in it or an alert
 * saved for it, so twenty empty Spokes don't bury the networks.
 */
export const getListedPositions = (
  positions: readonly NetworkPosition[],
  hasAlert: (position: NetworkPosition) => boolean,
) => positions.filter(p => p.version === 3 || p.hasPosition || hasAlert(p));
