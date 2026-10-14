// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ARBITRUM_EMPTY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { useSelectedChainId } from "~~/components/custom/aave/useSelectedChainId";
import type { NetworkPosition } from "~~/services/aave/positions";

const ZERO_CHAIN: NetworkPosition = { ...ARBITRUM_EMPTY_POSITION, chainId: 0 };

const ACCOUNT = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const OTHER_ACCOUNT = "0x71c7656ec7ab88b098defb751b7401b5f6d8976f";

type SelectionProps = { positions: readonly NetworkPosition[]; account?: string | null };

const renderSelection = (positions: readonly NetworkPosition[]) =>
  renderHook<ReturnType<typeof useSelectedChainId>, SelectionProps>(
    ({ positions, account = ACCOUNT }) => useSelectedChainId(positions, account),
    { initialProps: { positions } },
  );

describe("useSelectedChainId", () => {
  it.each([
    ["the first active network", [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION], ETHEREUM_POSITION.chainId],
    ["the first listed network when none is active", [ARBITRUM_EMPTY_POSITION], ARBITRUM_EMPTY_POSITION.chainId],
    ["nothing while the list is empty", [], null],
    // The truthiness check on the preferred id never picks chain 0.
    ["nothing when the only network has chain id 0", [ZERO_CHAIN], null],
  ] as const)("selects %s by default", (_, positions, expected) => {
    const { result } = renderSelection(positions);

    expect(result.current[0]).toBe(expected);
  });

  it("falls back to the first active network when the selection is no longer listed", () => {
    const { result, rerender } = renderSelection([BASE_SUMMARY_ONLY_POSITION]);
    expect(result.current[0]).toBe(BASE_SUMMARY_ONLY_POSITION.chainId);

    rerender({ positions: [ARBITRUM_EMPTY_POSITION, POLYGON_COLLATERAL_ONLY_POSITION] });

    expect(result.current[0]).toBe(POLYGON_COLLATERAL_ONLY_POSITION.chainId);
  });

  it("keeps a listed selection even when another network becomes the first active one", () => {
    const { result, rerender } = renderSelection([ARBITRUM_EMPTY_POSITION]);
    expect(result.current[0]).toBe(ARBITRUM_EMPTY_POSITION.chainId);

    rerender({ positions: [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION] });

    expect(result.current[0]).toBe(ARBITRUM_EMPTY_POSITION.chainId);
  });

  it("keeps a stale selection while the list is empty", () => {
    const { result, rerender } = renderSelection([ETHEREUM_POSITION]);

    rerender({ positions: [] });

    expect(result.current[0]).toBe(ETHEREUM_POSITION.chainId);
  });

  it("lets the user pick another listed network", () => {
    const { result } = renderSelection([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);

    act(() => result.current[1](POLYGON_COLLATERAL_ONLY_POSITION.chainId));

    expect(result.current[0]).toBe(POLYGON_COLLATERAL_ONLY_POSITION.chainId);
  });

  it("replaces a picked network that is not listed with the default", () => {
    const { result } = renderSelection([ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION]);

    act(() => result.current[1](BASE_SUMMARY_ONLY_POSITION.chainId));

    expect(result.current[0]).toBe(ETHEREUM_POSITION.chainId);
  });

  describe("after an account switch", () => {
    const BOTH_ACTIVE = [ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION];

    const selectPolygonThenSwitch = (nextAccount: string | null) => {
      const view = renderSelection(BOTH_ACTIVE);
      act(() => view.result.current[1](POLYGON_COLLATERAL_ONLY_POSITION.chainId));
      // The next account's positions load under a new query key, so the list is empty first.
      view.rerender({ positions: [], account: nextAccount });
      return view;
    };

    it("selects nothing while the next account's positions load", () => {
      const { result } = selectPolygonThenSwitch(OTHER_ACCOUNT);

      expect(result.current[0]).toBeNull();
    });

    it("selects the next account's default network even when the previous selection is listed", () => {
      // F12: the previous account's pick used to carry over, because every account lists the same markets.
      const { result, rerender } = selectPolygonThenSwitch(OTHER_ACCOUNT);

      rerender({ positions: BOTH_ACTIVE, account: OTHER_ACCOUNT });

      expect(result.current[0]).toBe(ETHEREUM_POSITION.chainId);
    });

    it("starts afresh when the wallet disconnects", () => {
      const { result, rerender } = selectPolygonThenSwitch(null);

      rerender({ positions: BOTH_ACTIVE, account: null });

      expect(result.current[0]).toBe(ETHEREUM_POSITION.chainId);
    });

    it("does not bring back the previous pick when the first account returns", () => {
      const { result, rerender } = selectPolygonThenSwitch(OTHER_ACCOUNT);

      rerender({ positions: [], account: ACCOUNT });
      rerender({ positions: BOTH_ACTIVE, account: ACCOUNT });

      expect(result.current[0]).toBe(ETHEREUM_POSITION.chainId);
    });

    it("keeps the selection the next account picks", () => {
      const { result, rerender } = selectPolygonThenSwitch(OTHER_ACCOUNT);
      rerender({ positions: BOTH_ACTIVE, account: OTHER_ACCOUNT });

      act(() => result.current[1](POLYGON_COLLATERAL_ONLY_POSITION.chainId));
      rerender({ positions: BOTH_ACTIVE, account: OTHER_ACCOUNT });

      expect(result.current[0]).toBe(POLYGON_COLLATERAL_ONLY_POSITION.chainId);
    });
  });
});
