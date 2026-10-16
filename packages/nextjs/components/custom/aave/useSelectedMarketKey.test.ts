// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ARBITRUM_EMPTY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  ETHEREUM_V4_LIDO_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { useSelectedMarketKey } from "~~/components/custom/aave/useSelectedMarketKey";
import type { NetworkPosition } from "~~/services/aave/positions";

const EMPTY_KEY: NetworkPosition = { ...ARBITRUM_EMPTY_POSITION, key: "" };

const ACCOUNT = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const OTHER_ACCOUNT = "0x71c7656ec7ab88b098defb751b7401b5f6d8976f";

type SelectionProps = { positions: readonly NetworkPosition[]; account?: string | null };

const renderSelection = (positions: readonly NetworkPosition[]) =>
  renderHook<ReturnType<typeof useSelectedMarketKey>, SelectionProps>(
    ({ positions, account = ACCOUNT }) => useSelectedMarketKey(positions, account),
    { initialProps: { positions } },
  );

describe("useSelectedMarketKey", () => {
  it.each([
    ["the first active market", [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION], ETHEREUM_POSITION.key],
    ["the first listed market when none is active", [ARBITRUM_EMPTY_POSITION], ARBITRUM_EMPTY_POSITION.key],
    ["nothing while the list is empty", [], null],
    // The truthiness check on the preferred key never picks an empty one.
    ["nothing when the only market has an empty key", [EMPTY_KEY], null],
  ] as const)("selects %s by default", (_, positions, expected) => {
    const { result } = renderSelection(positions);

    expect(result.current[0]).toBe(expected);
  });

  it("falls back to the first active market when the selection is no longer listed", () => {
    const { result, rerender } = renderSelection([BASE_SUMMARY_ONLY_POSITION]);
    expect(result.current[0]).toBe(BASE_SUMMARY_ONLY_POSITION.key);

    rerender({ positions: [ARBITRUM_EMPTY_POSITION, POLYGON_COLLATERAL_ONLY_POSITION] });

    expect(result.current[0]).toBe(POLYGON_COLLATERAL_ONLY_POSITION.key);
  });

  it("keeps a listed selection even when another market becomes the first active one", () => {
    const { result, rerender } = renderSelection([ARBITRUM_EMPTY_POSITION]);
    expect(result.current[0]).toBe(ARBITRUM_EMPTY_POSITION.key);

    rerender({ positions: [ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION] });

    expect(result.current[0]).toBe(ARBITRUM_EMPTY_POSITION.key);
  });

  it("keeps a stale selection while the list is empty", () => {
    const { result, rerender } = renderSelection([ETHEREUM_POSITION]);

    rerender({ positions: [] });

    expect(result.current[0]).toBe(ETHEREUM_POSITION.key);
  });

  it("lets the user pick another listed market", () => {
    const { result } = renderSelection([ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION]);

    act(() => result.current[1](POLYGON_COLLATERAL_ONLY_POSITION.key));

    expect(result.current[0]).toBe(POLYGON_COLLATERAL_ONLY_POSITION.key);
  });

  it("replaces a picked market that is not listed with the default", () => {
    const { result } = renderSelection([ARBITRUM_EMPTY_POSITION, ETHEREUM_POSITION]);

    act(() => result.current[1](BASE_SUMMARY_ONLY_POSITION.key));

    expect(result.current[0]).toBe(ETHEREUM_POSITION.key);
  });

  it("tells two markets on one chain apart", () => {
    const { result } = renderSelection([ETHEREUM_POSITION, ETHEREUM_V4_LIDO_POSITION]);
    expect(result.current[0]).toBe(ETHEREUM_POSITION.key);

    act(() => result.current[1](ETHEREUM_V4_LIDO_POSITION.key));

    expect(result.current[0]).toBe(ETHEREUM_V4_LIDO_POSITION.key);
  });

  describe("after an account switch", () => {
    const BOTH_ACTIVE = [ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION];

    const selectPolygonThenSwitch = (nextAccount: string | null) => {
      const view = renderSelection(BOTH_ACTIVE);
      act(() => view.result.current[1](POLYGON_COLLATERAL_ONLY_POSITION.key));
      // The next account's positions load under a new query key, so the list is empty first.
      view.rerender({ positions: [], account: nextAccount });
      return view;
    };

    it("selects nothing while the next account's positions load", () => {
      const { result } = selectPolygonThenSwitch(OTHER_ACCOUNT);

      expect(result.current[0]).toBeNull();
    });

    it("selects the next account's default market even when the previous selection is listed", () => {
      // F12: the previous account's pick used to carry over, because every account lists the same markets.
      const { result, rerender } = selectPolygonThenSwitch(OTHER_ACCOUNT);

      rerender({ positions: BOTH_ACTIVE, account: OTHER_ACCOUNT });

      expect(result.current[0]).toBe(ETHEREUM_POSITION.key);
    });

    it("starts afresh when the wallet disconnects", () => {
      const { result, rerender } = selectPolygonThenSwitch(null);

      rerender({ positions: BOTH_ACTIVE, account: null });

      expect(result.current[0]).toBe(ETHEREUM_POSITION.key);
    });

    it("does not bring back the previous pick when the first account returns", () => {
      const { result, rerender } = selectPolygonThenSwitch(OTHER_ACCOUNT);

      rerender({ positions: [], account: ACCOUNT });
      rerender({ positions: BOTH_ACTIVE, account: ACCOUNT });

      expect(result.current[0]).toBe(ETHEREUM_POSITION.key);
    });

    it("keeps the selection the next account picks", () => {
      const { result, rerender } = selectPolygonThenSwitch(OTHER_ACCOUNT);
      rerender({ positions: BOTH_ACTIVE, account: OTHER_ACCOUNT });

      act(() => result.current[1](POLYGON_COLLATERAL_ONLY_POSITION.key));
      rerender({ positions: BOTH_ACTIVE, account: OTHER_ACCOUNT });

      expect(result.current[0]).toBe(POLYGON_COLLATERAL_ONLY_POSITION.key);
    });
  });
});
