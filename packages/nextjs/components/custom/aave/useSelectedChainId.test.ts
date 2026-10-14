import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARBITRUM_EMPTY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { useSelectedChainId } from "~~/components/custom/aave/useSelectedChainId";
import type { NetworkPosition } from "~~/services/aave/positions";

// There is no DOM renderer, so the hook runs as a plain function: useState returns the seeded selection and a recording
// setter, and useEffect hands its callback and deps to the test.
const react = vi.hoisted(() => ({
  selectedChainId: null as number | null,
  initialStates: [] as unknown[],
  setCalls: [] as unknown[],
  setSelectedChainId: (value: unknown) => {
    react.setCalls.push(value);
  },
  effects: [] as { run: () => void; deps: unknown[] | undefined }[],
}));

vi.mock("react", async importOriginal => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (initial: unknown) => {
    react.initialStates.push(initial);
    return [react.selectedChainId, react.setSelectedChainId];
  },
  useEffect: (run: () => void, deps?: unknown[]) => {
    react.effects.push({ run, deps });
  },
}));

// Verbatim copy of the original default-selection effect body in AavePositions (after its `if (!mounted) return;`).
const legacyEffectSetCalls = (positions: NetworkPosition[], selectedChainId: number | null) => {
  const calls: number[] = [];
  const setSelectedChainId = (id: number) => calls.push(id);
  const positionsWithData = positions.filter(p => p.hasPosition);
  const preferred = positionsWithData[0]?.chainId ?? positions[0]?.chainId;
  if (preferred && selectedChainId === null) setSelectedChainId(preferred);
  if (selectedChainId !== null && !positions.some(p => p.chainId === selectedChainId) && preferred) {
    setSelectedChainId(preferred);
  }
  return calls;
};

const ZERO_CHAIN: NetworkPosition = { ...ARBITRUM_EMPTY_POSITION, chainId: 0 };

// Calls the hook outside React, like testing-library's renderHook; the mocked hooks above stand in for the renderer.
const callHook = <T>(hook: () => T) => hook();

const runHook = (positions: NetworkPosition[], selectedChainId: number | null) => {
  react.selectedChainId = selectedChainId;
  const result = callHook(() => useSelectedChainId(positions));
  return { result, effect: react.effects[0] };
};

describe("useSelectedChainId", () => {
  beforeEach(() => {
    react.selectedChainId = null;
    react.initialStates = [];
    react.setCalls = [];
    react.effects = [];
  });

  it("starts with no selection and returns the state and its setter", () => {
    const { result } = runHook([ETHEREUM_POSITION], 137);

    expect(react.initialStates).toEqual([null]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(137);
    expect(result[1]).toBe(react.setSelectedChainId);
  });

  it("re-runs the default selection when the positions or the selection change", () => {
    const positions = [ETHEREUM_POSITION];

    const { effect } = runHook(positions, 1);

    expect(react.effects).toHaveLength(1);
    expect(effect.deps).toHaveLength(2);
    expect(effect.deps?.[0]).toBe(positions);
    expect(effect.deps?.[1]).toBe(1);
  });

  it.each([
    ["the first active network when nothing is selected", [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION], null, [1]],
    ["the first listed network when none is active", [ARBITRUM_EMPTY_POSITION], null, [42161]],
    [
      "the first active network when the selection is no longer listed",
      [ARBITRUM_EMPTY_POSITION, POLYGON_COLLATERAL_ONLY_POSITION],
      BASE_SUMMARY_ONLY_POSITION.chainId,
      [137],
    ],
    [
      "nothing when the selection is still listed, even if it is not the first active one",
      [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION],
      42161,
      [],
    ],
    // The original effect skipped its first run (before mount), when positions is always the hook's initial [].
    ["nothing while the list is empty", [], null, []],
    ["nothing while the list is empty, keeping a stale selection", [], 1, []],
    // The truthiness check on the preferred id never picks chain 0.
    ["nothing when the only network has chain id 0", [ZERO_CHAIN], null, []],
  ] as const)("sets %s", (_, positions, selectedChainId, expected) => {
    const { effect } = runHook([...positions], selectedChainId);

    effect.run();

    expect(react.setCalls).toEqual(expected);
    expect(react.setCalls).toEqual(legacyEffectSetCalls([...positions], selectedChainId));
  });

  it("does not set anything while rendering", () => {
    runHook([ETHEREUM_POSITION], null);

    expect(react.setCalls).toEqual([]);
  });
});
