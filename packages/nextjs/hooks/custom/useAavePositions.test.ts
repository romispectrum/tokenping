// @vitest-environment jsdom
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARBITRUM_EMPTY_POSITION,
  ETHEREUM_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { useAavePositions } from "~~/hooks/custom/useAavePositions";
import { type NetworkPosition, fetchAavePositions } from "~~/services/aave/positions";
import { deferred } from "~~/utils/testing/helpers";
import { renderHookWithProviders } from "~~/utils/testing/providers";

const USER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const OTHER_USER = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const account = vi.hoisted(() => ({ address: undefined as string | undefined, isConnected: false }));
vi.mock("wagmi", () => ({ useAccount: () => ({ ...account }) }));

vi.mock("~~/services/aave/positions", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/aave/positions")>()),
  fetchAavePositions: vi.fn(),
}));

const fetchMock = vi.mocked(fetchAavePositions);

const renderPositions = (options?: { queryClient?: QueryClient }) =>
  renderHookWithProviders(() => useAavePositions(), options);

const switchAccount = (rerender: () => void, address: string) =>
  act(() => {
    account.address = address;
    rerender();
  });

describe("useAavePositions", () => {
  beforeEach(() => {
    account.address = USER;
    account.isConnected = true;
    fetchMock.mockReset();
  });

  it("loads the connected account's positions and sums the totals across networks", async () => {
    const positions = [ETHEREUM_POSITION, POLYGON_COLLATERAL_ONLY_POSITION];
    fetchMock.mockResolvedValue(positions);

    const { result } = renderPositions();

    expect(result.current).toEqual({
      positions: [],
      isLoading: true,
      error: null,
      totalNetWorthUSD: "0.00",
      totalCollateralUSD: "0.00",
      totalDebtUSD: "0.00",
      refetch: expect.any(Function),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchMock.mock.calls).toEqual([[USER]]);
    expect(result.current.positions).toBe(positions);
    expect(result.current).toMatchObject({
      error: null,
      // 12345.67 + 1234.56, 2500.00 + 0.00 and 9845.67 + 1234.56
      totalCollateralUSD: "13580.23",
      totalDebtUSD: "2500.00",
      totalNetWorthUSD: "11080.23",
    });
  });

  it("reports loading from the very first render, so no empty state flashes before the fetch starts", () => {
    fetchMock.mockReturnValue(deferred<NetworkPosition[]>().promise);
    const loadingByRender: boolean[] = [];

    renderHookWithProviders(() => {
      const result = useAavePositions();
      loadingByRender.push(result.isLoading);
      return result;
    });

    expect(loadingByRender[0]).toBe(true);
    expect(loadingByRender.every(Boolean)).toBe(true);
  });

  it("caches the positions under the normalized address", async () => {
    const positions = [ETHEREUM_POSITION];
    fetchMock.mockResolvedValue(positions);

    const { result, queryClient } = renderPositions();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["aavePositions", USER.toLowerCase()])).toBe(positions);
  });

  it.each([
    ["no address", { address: undefined, isConnected: true }],
    ["a disconnected wallet", { address: USER, isConnected: false }],
  ])("stays empty and idle without fetching for %s", (_, nextAccount) => {
    Object.assign(account, nextAccount);

    const { result } = renderPositions();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ positions: [], isLoading: false, error: null, totalNetWorthUSD: "0.00" });
  });

  it("shows the loading state while refreshing, keeps the positions, then shows the new ones", async () => {
    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION]);
    const { result } = renderPositions();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const refresh = deferred<NetworkPosition[]>();
    fetchMock.mockReturnValueOnce(refresh.promise);
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.positions).toEqual([ETHEREUM_POSITION]);

    await act(async () => refresh.resolve([ARBITRUM_EMPTY_POSITION]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.positions).toEqual([ARBITRUM_EMPTY_POSITION]);
    expect(fetchMock.mock.calls).toEqual([[USER], [USER]]);
  });

  it("shows no positions of the previous account while the next account loads", async () => {
    // B1.1
    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION]);
    const { result, rerender } = renderPositions();
    await waitFor(() => expect(result.current.positions).toEqual([ETHEREUM_POSITION]));

    fetchMock.mockReturnValueOnce(deferred<NetworkPosition[]>().promise);
    switchAccount(rerender, OTHER_USER);

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(OTHER_USER));
    expect(result.current).toMatchObject({ positions: [], isLoading: true, totalNetWorthUSD: "0.00" });
  });

  it("ignores a late response for the previous account", async () => {
    // B1.1: the first account's request resolves after the second account's.
    const first = deferred<NetworkPosition[]>();
    const second = deferred<NetworkPosition[]>();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result, rerender } = renderPositions();
    switchAccount(rerender, OTHER_USER);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => second.resolve([POLYGON_COLLATERAL_ONLY_POSITION]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => first.resolve([ETHEREUM_POSITION]));

    expect(result.current.positions).toEqual([POLYGON_COLLATERAL_ONLY_POSITION]);
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    ["an Error's message", new Error("rpc down"), "rpc down"],
    ["the fallback for a non-Error rejection", "rpc down", "Failed to fetch Aave positions"],
    ["the fallback for an object with a message", { message: "rpc down" }, "Failed to fetch Aave positions"],
    ["the fallback for an Error without a message", new Error(""), "Failed to fetch Aave positions"],
  ])("reports %s when the fetch fails", async (_, rejection, message) => {
    fetchMock.mockRejectedValue(rejection);

    const { result } = renderPositions();

    await waitFor(() => expect(result.current.error).toBe(message));
    expect(result.current).toMatchObject({ positions: [], isLoading: false });
  });

  it("keeps the last positions next to the error when a refresh fails", async () => {
    fetchMock.mockResolvedValueOnce([ETHEREUM_POSITION]);
    const { result } = renderPositions();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetchMock.mockRejectedValueOnce(new Error("rpc down"));
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBe("rpc down"));
    expect(result.current).toMatchObject({ positions: [ETHEREUM_POSITION], isLoading: false });
  });

  it("clears the error while trying again", async () => {
    fetchMock.mockRejectedValueOnce(new Error("rpc down"));
    const { result } = renderPositions();
    await waitFor(() => expect(result.current.error).toBe("rpc down"));

    const retry = deferred<NetworkPosition[]>();
    fetchMock.mockReturnValueOnce(retry.promise);
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.error).toBeNull();

    await act(async () => retry.resolve([ETHEREUM_POSITION]));

    await waitFor(() => expect(result.current.positions).toEqual([ETHEREUM_POSITION]));
    expect(result.current.error).toBeNull();
  });

  it("does not retry a failed fetch, whatever the client's default", async () => {
    fetchMock.mockRejectedValue(new Error("rpc down"));

    // A client with react-query's defaults would retry three times with backoff before showing the error.
    const { result } = renderPositions({ queryClient: new QueryClient() });

    await waitFor(() => expect(result.current.error).toBe("rpc down"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still fetches while the browser reports offline, so a total outage shows the error, not 'no positions'", async () => {
    fetchMock.mockRejectedValue(new Error("Could not reach any Aave network."));
    onlineManager.setOnline(false);
    try {
      const { result } = renderPositions();

      await waitFor(() => expect(result.current.error).toBe("Could not reach any Aave network."));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it("does not fetch again when the connection comes back or the window regains focus, whatever the client's defaults", async () => {
    // A background fetch shows the loading state, which unmounts the notification form and loses its unsaved draft.
    fetchMock.mockResolvedValue([ETHEREUM_POSITION]);
    const { result } = renderPositions({ queryClient: new QueryClient() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    try {
      await act(async () => {
        onlineManager.setOnline(false);
        onlineManager.setOnline(true);
        focusManager.setFocused(false);
        focusManager.setFocused(true);
        // react-query refetches after resuming paused mutations, a few microtasks later.
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    } finally {
      focusManager.setFocused(undefined);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });
});
