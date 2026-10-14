import { describe, expect, it } from "vitest";
import {
  ARBITRUM_EMPTY_POSITION,
  AVALANCHE_DEBT_ONLY_POSITION,
  ETHEREUM_POSITION,
  MIXED_DEBT_GHO,
  POLYGON_COLLATERAL_ONLY_POSITION,
  STABLE_DEBT_USDT,
  SUPPLIED_AND_BORROWED_LINK,
  SUPPLIED_USDC,
  SUPPLIED_WETH_NOT_COLLATERAL,
  VARIABLE_DEBT_DAI,
} from "~~/components/custom/aave/__fixtures__/positions";
import {
  formatDebtBreakdown,
  getCollateralTokens,
  getDebtTokens,
  resolveSelectedChainId,
} from "~~/components/custom/aave/positionsView";
import type { NetworkPosition, TokenPosition } from "~~/services/aave/positions";
import { formatTokenAmount } from "~~/utils/format";

// Verbatim copy of the subtitle ternary in the original DebtRow.
const legacyDebtSubtitle = (token: TokenPosition) => {
  const hasStableDebt = token.stableDebt > 0n;
  const hasVariableDebt = token.variableDebt > 0n;
  return hasStableDebt && hasVariableDebt
    ? `Stable ${formatTokenAmount(token.stableDebt, token.decimals)} · Variable ${formatTokenAmount(token.variableDebt, token.decimals)}`
    : hasVariableDebt
      ? `Variable ${formatTokenAmount(token.variableDebt, token.decimals)}`
      : hasStableDebt
        ? `Stable ${formatTokenAmount(token.stableDebt, token.decimals)}`
        : "\u00A0";
};

// The original default-selection effect, returning the id it would set (or the current one).
const legacySelection = (positions: NetworkPosition[], selectedChainId: number | null) => {
  let next = selectedChainId;
  const positionsWithData = positions.filter(p => p.hasPosition);
  const preferred = positionsWithData[0]?.chainId ?? positions[0]?.chainId;
  if (preferred && selectedChainId === null) next = preferred;
  if (selectedChainId !== null && !positions.some(p => p.chainId === selectedChainId) && preferred) {
    next = preferred;
  }
  return next;
};

const ZERO_CHAIN: NetworkPosition = { ...ARBITRUM_EMPTY_POSITION, chainId: 0 };

describe("formatDebtBreakdown", () => {
  it.each([
    [MIXED_DEBT_GHO, "Stable 1.5 · Variable 2,000"],
    [VARIABLE_DEBT_DAI, "Variable 250.5"],
    [STABLE_DEBT_USDT, "Stable 10"],
    [SUPPLIED_USDC, "\u00A0"],
  ])("formats %s's debt like the original row", (token, expected) => {
    expect(formatDebtBreakdown(token)).toBe(expected);
    expect(formatDebtBreakdown(token)).toBe(legacyDebtSubtitle(token));
  });
});

describe("getCollateralTokens / getDebtTokens", () => {
  it("split tokens by supply balance and by any debt, keeping their order", () => {
    expect(getCollateralTokens(ETHEREUM_POSITION.tokens)).toEqual([
      SUPPLIED_USDC,
      SUPPLIED_WETH_NOT_COLLATERAL,
      SUPPLIED_AND_BORROWED_LINK,
    ]);
    expect(getDebtTokens(ETHEREUM_POSITION.tokens)).toEqual([
      VARIABLE_DEBT_DAI,
      STABLE_DEBT_USDT,
      MIXED_DEBT_GHO,
      SUPPLIED_AND_BORROWED_LINK,
    ]);
  });
});

describe("resolveSelectedChainId", () => {
  const scenarios: [string, NetworkPosition[], number | null, number | null][] = [
    ["no networks, nothing selected", [], null, null],
    ["no networks keeps a stale selection", [], 1, 1],
    ["defaults to the first active network", [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION], null, 1],
    ["defaults to the first network when none is active", [ARBITRUM_EMPTY_POSITION], null, 42161],
    ["keeps a listed selection", [ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION], 137, 137],
    [
      "keeps a listed empty selection over an active network",
      [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION],
      42161,
      42161,
    ],
    ["replaces a selection that disappeared", [ARBITRUM_EMPTY_POSITION, AVALANCHE_DEBT_ONLY_POSITION], 1, 43114],
    // Chain id 0 never occurs, but the truthiness check treats it as "no preferred network".
    ["ignores a falsy preferred chain id", [ZERO_CHAIN], null, null],
  ];

  it.each(scenarios)("%s", (_, positions, selected, expected) => {
    expect(resolveSelectedChainId(positions, selected)).toBe(expected);
    expect(resolveSelectedChainId(positions, selected)).toBe(legacySelection(positions, selected));
  });

  it("does not move a chosen default when another network becomes active", () => {
    const first = resolveSelectedChainId([ARBITRUM_EMPTY_POSITION], null);
    const refreshed = [{ ...ARBITRUM_EMPTY_POSITION }, ETHEREUM_POSITION];

    expect(first).toBe(42161);
    expect(resolveSelectedChainId(refreshed, first)).toBe(42161);
  });
});
