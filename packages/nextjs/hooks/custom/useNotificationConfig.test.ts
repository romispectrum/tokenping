// @vitest-environment jsdom
import { onlineManager } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import type { NotificationConfig } from "~~/types/notifications";
import { deferred } from "~~/utils/testing/helpers";
import { createTestQueryClient, renderHookWithProviders } from "~~/utils/testing/providers";

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  getAllConfigs: vi.fn(),
  upsertConfig: vi.fn(),
  deleteConfig: vi.fn(),
}));

vi.mock("wagmi", () => ({ useAccount: () => ({ address: mocks.address }) }));
vi.mock("~~/services/notifications/notificationConfigClient", () => ({
  notificationConfigClient: {
    getAllConfigs: mocks.getAllConfigs,
    upsertConfig: mocks.upsertConfig,
    deleteConfig: mocks.deleteConfig,
  },
}));

const ADDRESS = "0xAbC0000000000000000000000000000000000001";
const OTHER_ADDRESS = "0xDeF0000000000000000000000000000000000002";

const CONFIG: NotificationConfig = {
  chainId: 1,
  enabled: true,
  services: ["email"],
  healthFactorThreshold: 1.8,
  email: "me@example.com",
};

type Configs = Record<number, NotificationConfig>;

const OTHER_CONFIGS: Configs = { 2: { ...CONFIG, chainId: 2 } };

const render = (queryClient = createTestQueryClient()) =>
  renderHookWithProviders(() => useNotificationConfig(), { queryClient });

const renderLoaded = async () => {
  const view = render();
  await waitFor(() => expect(view.result.current.isLoaded).toBe(true));
  return view;
};

beforeEach(() => {
  mocks.address = ADDRESS;
  mocks.getAllConfigs.mockReset().mockResolvedValue({});
  mocks.upsertConfig.mockReset().mockResolvedValue(undefined);
  mocks.deleteConfig.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  onlineManager.setOnline(true);
  vi.restoreAllMocks();
});

describe("useNotificationConfig", () => {
  it("returns the config API plus the load state", async () => {
    const { result } = await renderLoaded();
    expect(Object.keys(result.current).sort()).toEqual([
      "deleteConfig",
      "getConfig",
      "hasConfig",
      "isDeleting",
      "isError",
      "isFetching",
      "isLoaded",
      "isSaving",
      "refetch",
      "updateConfig",
    ]);
  });

  it("is loaded with no configs and makes no request without a wallet", () => {
    mocks.address = undefined;
    const { result } = render();
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.getConfig(1)).toBeNull();
    expect(mocks.getAllConfigs).not.toHaveBeenCalled();
  });

  it("loads the wallet's configs with the raw address and caches them under the normalized address", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const { result, queryClient } = render();
    expect(result.current.isLoaded).toBe(false);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(mocks.getAllConfigs.mock.calls).toEqual([[ADDRESS]]);
    expect(result.current.getConfig(1)).toEqual(CONFIG);
    expect([result.current.hasConfig(1), result.current.hasConfig(2)]).toEqual([true, false]);
    expect(queryClient.getQueryData(["notificationConfigs", ADDRESS.toLowerCase()])).toEqual({ 1: CONFIG });
  });

  it("getConfig fills in fields older rows lack and keeps the same object while the data is unchanged", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: { ...CONFIG, services: null, signalRecipient: null } });
    const { result, rerender } = await renderLoaded();
    const config = result.current.getConfig(1);
    expect(config).toMatchObject({ services: [], signalRecipient: undefined });
    rerender();
    expect(result.current.getConfig(1)).toBe(config);
  });

  it("forgets the previous wallet's configs as soon as the wallet switches", async () => {
    const otherConfigs = deferred<Configs>();
    mocks.getAllConfigs.mockResolvedValueOnce({ 1: CONFIG }).mockReturnValueOnce(otherConfigs.promise);
    const { result, rerender } = await renderLoaded();
    expect(result.current.hasConfig(1)).toBe(true);

    mocks.address = OTHER_ADDRESS;
    rerender();
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.getConfig(1)).toBeNull();

    otherConfigs.resolve(OTHER_CONFIGS);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect([result.current.hasConfig(1), result.current.hasConfig(2)]).toEqual([false, true]);
    expect(mocks.getAllConfigs.mock.calls).toEqual([[ADDRESS], [OTHER_ADDRESS]]);
  });

  it("never shows a late response for the previous wallet", async () => {
    const first = deferred<Configs>();
    mocks.getAllConfigs.mockReturnValueOnce(first.promise).mockResolvedValueOnce(OTHER_CONFIGS);
    const { result, rerender } = render();
    mocks.address = OTHER_ADDRESS;
    rerender();
    await waitFor(() => expect(result.current.hasConfig(2)).toBe(true));
    await act(async () => first.resolve({ 1: CONFIG }));
    expect([result.current.hasConfig(1), result.current.hasConfig(2)]).toEqual([false, true]);
  });

  it("shows a wallet's cached configs at once when switching back to it", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ 1: CONFIG }).mockResolvedValueOnce(OTHER_CONFIGS);
    const { result, rerender } = await renderLoaded();
    mocks.address = OTHER_ADDRESS;
    rerender();
    await waitFor(() => expect(result.current.hasConfig(2)).toBe(true));

    mocks.getAllConfigs.mockReturnValueOnce(new Promise(() => undefined));
    mocks.address = ADDRESS;
    rerender();
    expect(result.current.isLoaded).toBe(true);
    expect([result.current.hasConfig(1), result.current.hasConfig(2)]).toEqual([true, false]);
  });

  it("clears the configs when the wallet disconnects", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const { result, rerender } = await renderLoaded();
    mocks.address = undefined;
    rerender();
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.hasConfig(1)).toBe(false);
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  it("reports a failed load instead of treating it as no configs, and recovers on refetch", async () => {
    const retry = deferred<Configs>();
    mocks.getAllConfigs.mockRejectedValueOnce(new Error("Database error")).mockReturnValueOnce(retry.promise);
    const { result } = render();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.hasConfig(1)).toBe(false);

    act(() => void result.current.refetch());
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    // Still reported as failed (and loaded) while the retry is in flight, so the Retry UI stays on screen.
    expect([result.current.isError, result.current.isLoaded]).toEqual([true, true]);
    retry.resolve({ 1: CONFIG });
    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.getConfig(1)).toEqual(CONFIG);
  });

  it("keeps showing the loaded configs when a background refetch fails", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ 1: CONFIG }).mockRejectedValueOnce(new Error("down"));
    const { result } = await renderLoaded();
    await act(async () => void (await result.current.refetch()));
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(2);
    expect(result.current.isError).toBe(false);
    expect(result.current.getConfig(1)).toEqual(CONFIG);
  });

  it("shares one cache between every component that uses it", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const queryClient = createTestQueryClient();
    const editor = render(queryClient);
    const indicator = render(queryClient);
    await waitFor(() => expect(indicator.result.current.hasConfig(1)).toBe(true));
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);

    mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));
    await act(() => editor.result.current.updateConfig(10, { enabled: true }));
    await waitFor(() => expect(indicator.result.current.hasConfig(10)).toBe(true));

    await act(() => editor.result.current.deleteConfig(1));
    await waitFor(() => expect(indicator.result.current.hasConfig(1)).toBe(false));
  });

  it("updateConfig merges over the saved config, pins the position chain id and caches what it sent", async () => {
    const saved = { ...CONFIG, signalRecipient: "alice.42", services: ["email", "signal"] as const };
    mocks.getAllConfigs.mockResolvedValue({ 1: saved });
    const { result } = await renderLoaded();
    const expected = { ...saved, chainId: 1, services: ["signal"], email: undefined, healthFactorThreshold: 2 };

    await act(() =>
      result.current.updateConfig(1, {
        chainId: 999,
        services: ["signal"],
        email: undefined,
        healthFactorThreshold: 2,
      }),
    );
    expect(mocks.upsertConfig.mock.calls).toEqual([[ADDRESS, expected]]);
    await waitFor(() => expect(result.current.getConfig(1)).toEqual(expected));
  });

  it("does not reload the configs after a write", async () => {
    const { result } = await renderLoaded();
    await act(() => result.current.updateConfig(10, { enabled: true }));
    await waitFor(() => expect(result.current.hasConfig(10)).toBe(true));
    await act(() => result.current.deleteConfig(10));
    await waitFor(() => expect(result.current.hasConfig(10)).toBe(false));
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  /** Starts a reload of the configs that is answered only when the returned function is called. */
  const holdReload = async (result: { current: ReturnType<typeof useNotificationConfig> }) => {
    const reload = deferred<Configs>();
    mocks.getAllConfigs.mockReturnValueOnce(reload.promise);
    act(() => void result.current.refetch());
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    return reload.resolve;
  };

  it("keeps a save when a reload that started before it answers after it", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ 1: CONFIG });
    const { result, queryClient } = await renderLoaded();
    const answerReload = await holdReload(result);

    await act(() => result.current.updateConfig(10, { enabled: true }));
    await waitFor(() => expect(result.current.hasConfig(10)).toBe(true));
    // The reload read the configs before the save reached the server.
    await act(async () => answerReload({ 1: CONFIG }));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect([result.current.hasConfig(1), result.current.hasConfig(10)]).toEqual([true, true]);
    expect(
      Object.keys(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()]) ?? {}),
    ).toEqual(["1", "10"]);
    expect(result.current.isError).toBe(false);
  });

  it("keeps a delete when a reload that started before it answers after it", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ 1: CONFIG, ...OTHER_CONFIGS });
    const { result, queryClient } = await renderLoaded();
    const answerReload = await holdReload(result);

    await act(() => result.current.deleteConfig(1));
    await waitFor(() => expect(result.current.hasConfig(1)).toBe(false));
    await act(async () => answerReload({ 1: CONFIG, ...OTHER_CONFIGS }));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect([result.current.hasConfig(1), result.current.hasConfig(2)]).toEqual([false, true]);
    expect(
      Object.keys(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()]) ?? {}),
    ).toEqual(["2"]);
  });

  it("reports a save or a delete while it is in flight", async () => {
    const request = deferred<void>();
    mocks.upsertConfig.mockReturnValue(request.promise);
    mocks.deleteConfig.mockReturnValue(request.promise);
    const { result } = await renderLoaded();
    expect([result.current.isSaving, result.current.isDeleting]).toEqual([false, false]);

    let saving: Promise<void> | undefined;
    act(() => {
      saving = result.current.updateConfig(1, { enabled: true });
    });
    await waitFor(() => expect([result.current.isSaving, result.current.isDeleting]).toEqual([true, false]));
    let deleting: Promise<void> | undefined;
    act(() => {
      deleting = result.current.deleteConfig(1);
    });
    await waitFor(() => expect([result.current.isSaving, result.current.isDeleting]).toEqual([true, true]));

    await act(async () => {
      request.resolve();
      await Promise.all([saving, deleting]);
    });
    await waitFor(() => expect([result.current.isSaving, result.current.isDeleting]).toEqual([false, false]));
  });

  it("updateConfig starts from a disabled default for a new chain", async () => {
    const { result } = await renderLoaded();
    mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));
    await act(() => result.current.updateConfig(10, { enabled: true }));
    expect(mocks.upsertConfig.mock.calls).toEqual([
      [ADDRESS, { chainId: 10, enabled: true, services: [], healthFactorThreshold: 1.5 }],
    ]);
    await waitFor(() => expect(result.current.hasConfig(10)).toBe(true));
  });

  it("deleteConfig removes only that chain's config", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG, 2: { ...CONFIG, chainId: 2 } });
    const { result } = await renderLoaded();
    mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));
    await act(() => result.current.deleteConfig(1));
    expect(mocks.deleteConfig.mock.calls).toEqual([[ADDRESS, 1]]);
    await waitFor(() => expect([result.current.hasConfig(1), result.current.hasConfig(2)]).toEqual([false, true]));
  });

  it("writes the result into the cache of the wallet that made the change", async () => {
    const save = deferred<void>();
    mocks.getAllConfigs.mockResolvedValueOnce({}).mockResolvedValueOnce(OTHER_CONFIGS);
    mocks.upsertConfig.mockReturnValue(save.promise);
    const { result, rerender, queryClient } = await renderLoaded();
    let saving: Promise<void> | undefined;
    act(() => {
      saving = result.current.updateConfig(10, { enabled: true });
    });

    mocks.address = OTHER_ADDRESS;
    rerender();
    await waitFor(() => expect(result.current.hasConfig(2)).toBe(true));
    await act(async () => {
      save.resolve();
      await saving;
    });

    expect(result.current.hasConfig(10)).toBe(false);
    expect(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()])?.[10]).toMatchObject({
      chainId: 10,
      enabled: true,
    });
  });

  it("rejects writes without a wallet", async () => {
    mocks.address = undefined;
    const { result } = render();
    await expect(result.current.updateConfig(1, {})).rejects.toThrow(new Error("Wallet not connected"));
    await expect(result.current.deleteConfig(1)).rejects.toThrow(new Error("Wallet not connected"));
    expect(mocks.upsertConfig).not.toHaveBeenCalled();
    expect(mocks.deleteConfig).not.toHaveBeenCalled();
  });

  it("passes client errors through and keeps the saved state", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const saveError = new Error("Active paid access required");
    mocks.upsertConfig.mockRejectedValue(saveError);
    mocks.deleteConfig.mockRejectedValue(saveError);
    const { result } = await renderLoaded();
    await act(async () => {
      await expect(result.current.updateConfig(1, { enabled: false })).rejects.toBe(saveError);
      await expect(result.current.deleteConfig(1)).rejects.toBe(saveError);
    });
    expect(result.current.getConfig(1)).toEqual(CONFIG);
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  it("loads and writes while the browser reports offline instead of pausing until it is back online", async () => {
    onlineManager.setOnline(false);
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const { result } = await renderLoaded();
    expect(result.current.getConfig(1)).toEqual(CONFIG);

    mocks.upsertConfig.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(act(() => result.current.updateConfig(1, { email: "new@example.com" }))).rejects.toThrow(
      "Failed to fetch",
    );
    expect(mocks.upsertConfig).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });
});
