import { beforeEach, describe, expect, it, vi } from "vitest";
import { ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION } from "~~/components/custom/aave/__fixtures__/positions";
import { useAavePositions } from "~~/hooks/custom/useAavePositions";
import { fetchAavePositions } from "~~/services/aave/positions";

const USER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

// There is no DOM renderer, so the hook runs as a plain function: each useState returns its seeded value and a setter
// that logs `[stateName, value]`, useCallback and useMemo run inline, and useEffect hands its callback and deps over.
const react = vi.hoisted(() => ({
  // The hook's useState calls, in order.
  stateNames: ["positions", "isLoading", "error"],
  seeded: {} as Record<string, unknown>,
  initialStates: [] as unknown[],
  setterLog: [] as [string, unknown][],
  callbackDeps: [] as unknown[][],
  effects: [] as { run: () => void; deps: unknown[] }[],
  slot: 0,
}));

vi.mock("react", async importOriginal => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (initial: unknown) => {
    const name = react.stateNames[react.slot++];
    react.initialStates.push(initial);
    return [
      name in react.seeded ? react.seeded[name] : initial,
      (value: unknown) => react.setterLog.push([name, value]),
    ];
  },
  useCallback: (callback: unknown, deps: unknown[]) => {
    react.callbackDeps.push(deps);
    return callback;
  },
  useMemo: (factory: () => unknown) => factory(),
  useEffect: (run: () => void, deps: unknown[]) => {
    react.effects.push({ run, deps });
  },
}));

const account = vi.hoisted(() => ({ address: undefined as string | undefined, isConnected: false }));
vi.mock("wagmi", () => ({ useAccount: () => account }));

vi.mock("~~/services/aave/positions", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/aave/positions")>()),
  fetchAavePositions: vi.fn(),
}));

const fetchMock = vi.mocked(fetchAavePositions);

// Calls the hook outside React, like testing-library's renderHook; the mocked hooks above stand in for the renderer.
const callHook = <T>(hook: () => T) => {
  react.slot = 0;
  return hook();
};

describe("useAavePositions", () => {
  beforeEach(() => {
    react.seeded = {};
    react.initialStates = [];
    react.setterLog = [];
    react.callbackDeps = [];
    react.effects = [];
    account.address = USER;
    account.isConnected = true;
    fetchMock.mockReset();
  });

  it("starts empty, idle and without an error", () => {
    const result = callHook(() => useAavePositions());

    expect(react.initialStates).toEqual([[], false, null]);
    expect(result).toEqual({
      positions: [],
      isLoading: false,
      error: null,
      totalNetWorthUSD: "0.00",
      totalCollateralUSD: "0.00",
      totalDebtUSD: "0.00",
      refetch: expect.any(Function),
    });
  });

  it("returns the current state with totals summed across networks", () => {
    const positions = [ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION];
    react.seeded = { positions, isLoading: true, error: "boom" };

    const result = callHook(() => useAavePositions());

    expect(result).toMatchObject({
      isLoading: true,
      error: "boom",
      // 12345.67 + 1234.56, 2500.00 + 0.00 and 9845.67 + 1234.56
      totalCollateralUSD: "13580.23",
      totalDebtUSD: "2500.00",
      totalNetWorthUSD: "11080.23",
    });
    expect(result.positions).toBe(positions);
  });

  it("fetches on mount and again whenever the account changes", async () => {
    fetchMock.mockResolvedValue([]);

    const { refetch } = callHook(() => useAavePositions());

    expect(react.callbackDeps).toEqual([[USER, true]]);
    expect(react.effects).toHaveLength(1);
    expect(react.effects[0].deps).toEqual([refetch]);
    expect(react.effects[0].deps[0]).toBe(refetch);

    react.effects[0].run();
    await vi.waitFor(() => expect(react.setterLog).toContainEqual(["isLoading", false]), { interval: 1 });

    expect(fetchMock.mock.calls).toEqual([[USER]]);
  });

  it("loads, clears the previous error, stores the positions, then stops loading", async () => {
    const positions = [ETHEREUM_POSITION];
    fetchMock.mockResolvedValue(positions);

    await callHook(() => useAavePositions()).refetch();

    expect(fetchMock.mock.calls).toEqual([[USER]]);
    expect(react.setterLog).toEqual([
      ["isLoading", true],
      ["error", null],
      ["positions", positions],
      ["isLoading", false],
    ]);
    expect(react.setterLog[2][1]).toBe(positions);
  });

  it("sets the loading flag before the fetch starts", async () => {
    let logAtFetch: unknown[] = [];
    fetchMock.mockImplementation(async () => {
      logAtFetch = [...react.setterLog];
      return [];
    });

    await callHook(() => useAavePositions()).refetch();

    expect(logAtFetch).toEqual([
      ["isLoading", true],
      ["error", null],
    ]);
  });

  it.each([
    ["no address", { address: undefined, isConnected: true }],
    ["a disconnected wallet", { address: USER, isConnected: false }],
  ])("clears the positions without fetching or touching the loading flag for %s", async (_, nextAccount) => {
    Object.assign(account, nextAccount);

    await callHook(() => useAavePositions()).refetch();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(react.setterLog).toEqual([["positions", []]]);
  });

  it.each([
    ["an Error's message", new Error("rpc down"), "rpc down"],
    ["the fallback for a non-Error rejection", "rpc down", "Failed to fetch Aave positions"],
    ["the fallback for an object with a message", { message: "rpc down" }, "Failed to fetch Aave positions"],
    // The original used err.message for any Error and would store "" here (getErrorMessage, accepted in the spec).
    ["the fallback for an Error without a message", new Error(""), "Failed to fetch Aave positions"],
  ])("keeps the old positions and reports %s when the fetch rejects", async (_, rejection, message) => {
    fetchMock.mockRejectedValue(rejection);

    await callHook(() => useAavePositions()).refetch();

    expect(react.setterLog).toEqual([
      ["isLoading", true],
      ["error", null],
      ["error", message],
      ["isLoading", false],
    ]);
  });
});
