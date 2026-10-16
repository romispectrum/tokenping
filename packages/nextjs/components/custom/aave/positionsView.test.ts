import { describe, expect, it } from "vitest";
import {
  ARBITRUM_EMPTY_POSITION,
  AVALANCHE_DEBT_ONLY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  ETHEREUM_V4_LIDO_POSITION,
  ETHEREUM_V4_MAIN_EMPTY_POSITION,
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
  getListedPositions,
  resolveSelectedMarketKey,
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

// The original default-selection effect, ported from chain ids to market keys, returning the key it would set (or
// the current one).
const legacySelection = (positions: NetworkPosition[], selectedKey: string | null) => {
  let next = selectedKey;
  const positionsWithData = positions.filter(p => p.hasPosition);
  const preferred = positionsWithData[0]?.key ?? positions[0]?.key;
  if (preferred && selectedKey === null) next = preferred;
  if (selectedKey !== null && !positions.some(p => p.key === selectedKey) && preferred) {
    next = preferred;
  }
  return next;
};

const EMPTY_KEY: NetworkPosition = { ...ARBITRUM_EMPTY_POSITION, key: "" };

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

describe("resolveSelectedMarketKey", () => {
  const scenarios: [string, NetworkPosition[], string | null, string | null][] = [
    ["no markets, nothing selected", [], null, null],
    ["no markets keeps a stale selection", [], "1:v3", "1:v3"],
    ["defaults to the first active market", [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION], null, "1:v3"],
    ["defaults to the first market when none is active", [ARBITRUM_EMPTY_POSITION], null, "42161:v3"],
    ["keeps a listed selection", [ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION], "137:v3", "137:v3"],
    [
      "keeps a listed empty selection over an active market",
      [ETHEREUM_POSITION, ARBITRUM_EMPTY_POSITION],
      "42161:v3",
      "42161:v3",
    ],
    [
      "replaces a selection that disappeared",
      [ARBITRUM_EMPTY_POSITION, AVALANCHE_DEBT_ONLY_POSITION],
      "1:v3",
      "43114:v3",
    ],
    // An empty key never occurs, but the truthiness check treats it as "no preferred market".
    ["ignores an empty preferred key", [EMPTY_KEY], null, null],
    // Two markets on one chain are told apart by their key, not their chain id.
    [
      "keeps a V4 selection on a chain that also lists V3",
      [ETHEREUM_POSITION, ETHEREUM_V4_LIDO_POSITION],
      ETHEREUM_V4_LIDO_POSITION.key,
      ETHEREUM_V4_LIDO_POSITION.key,
    ],
    [
      "defaults to an active V4 market listed before an active V3 one",
      [ETHEREUM_V4_MAIN_EMPTY_POSITION, ETHEREUM_V4_LIDO_POSITION, ETHEREUM_POSITION],
      null,
      ETHEREUM_V4_LIDO_POSITION.key,
    ],
    [
      "replaces a V4 selection that disappeared, though its chain is still listed",
      [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION],
      ETHEREUM_V4_LIDO_POSITION.key,
      "1:v3",
    ],
  ];

  it.each(scenarios)("%s", (_, positions, selected, expected) => {
    expect(resolveSelectedMarketKey(positions, selected)).toBe(expected);
    expect(resolveSelectedMarketKey(positions, selected)).toBe(legacySelection(positions, selected));
  });

  it("does not move a chosen default when another market becomes active", () => {
    const first = resolveSelectedMarketKey([ARBITRUM_EMPTY_POSITION], null);
    const refreshed = [{ ...ARBITRUM_EMPTY_POSITION }, ETHEREUM_POSITION];

    expect(first).toBe("42161:v3");
    expect(resolveSelectedMarketKey(refreshed, first)).toBe("42161:v3");
  });
});

describe("getListedPositions", () => {
  const ALL = [
    ETHEREUM_POSITION,
    ARBITRUM_EMPTY_POSITION,
    BASE_SUMMARY_ONLY_POSITION,
    ETHEREUM_V4_MAIN_EMPTY_POSITION,
    ETHEREUM_V4_LIDO_POSITION,
  ];
  const noAlert = () => false;

  it("keeps every V3 market, active or not, and a V4 Spoke only with a position", () => {
    expect(getListedPositions(ALL, noAlert)).toEqual([
      ETHEREUM_POSITION,
      ARBITRUM_EMPTY_POSITION,
      BASE_SUMMARY_ONLY_POSITION,
      ETHEREUM_V4_LIDO_POSITION,
    ]);
  });

  it("keeps an empty V4 Spoke that has an alert, in its place in the list", () => {
    const hasAlert = (position: NetworkPosition) => position.key === ETHEREUM_V4_MAIN_EMPTY_POSITION.key;

    expect(getListedPositions(ALL, hasAlert)).toEqual(ALL);
  });

  it("asks about alerts only for empty V4 Spokes, and an alert never hides a market", () => {
    const asked: string[] = [];
    const hasAlert = (position: NetworkPosition) => {
      asked.push(position.key);
      return false;
    };

    getListedPositions(ALL, hasAlert);

    expect(asked).toEqual([ETHEREUM_V4_MAIN_EMPTY_POSITION.key]);
    expect(getListedPositions([ETHEREUM_POSITION, ETHEREUM_V4_LIDO_POSITION], () => true)).toEqual([
      ETHEREUM_POSITION,
      ETHEREUM_V4_LIDO_POSITION,
    ]);
  });

  it("lists nothing when only empty V4 Spokes without alerts were read", () => {
    expect(getListedPositions([ETHEREUM_V4_MAIN_EMPTY_POSITION], noAlert)).toEqual([]);
    expect(getListedPositions([], noAlert)).toEqual([]);
  });
});
