import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import type { NotificationConfig } from "~~/types/notifications";
import { deferred } from "~~/utils/testing/helpers";
import { renderHook } from "~~/utils/testing/hookHarness";

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  getAllConfigs: vi.fn(),
  upsertConfig: vi.fn(),
  deleteConfig: vi.fn(),
}));

vi.mock("react", async importOriginal =>
  (await import("~~/utils/testing/hookHarness")).withFakeHooks(await importOriginal()),
);
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
  telegramChatId: "555",
};

type Configs = Record<number, NotificationConfig>;

const OTHER_CONFIGS: Configs = { 2: { ...CONFIG, chainId: 2 } };

const mount = async () => {
  const view = renderHook(() => useNotificationConfig());
  await view.act();
  return view;
};

beforeEach(() => {
  mocks.address = ADDRESS;
  mocks.getAllConfigs.mockReset().mockResolvedValue({});
  mocks.upsertConfig.mockReset().mockResolvedValue(undefined);
  mocks.deleteConfig.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useNotificationConfig", () => {
  it("returns only the public API", async () => {
    const view = await mount();
    expect(Object.keys(view.current)).toEqual(["isLoaded", "getConfig", "updateConfig", "deleteConfig", "hasConfig"]);
  });

  it("is loaded with no configs and makes no request without a wallet", async () => {
    mocks.address = undefined;
    const view = await mount();
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.getConfig(1)).toBeNull();
    expect(mocks.getAllConfigs).not.toHaveBeenCalled();
  });

  it("loads the wallet's configs with the raw address", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const view = renderHook(() => useNotificationConfig());
    expect(view.current.isLoaded).toBe(false);
    await view.act();
    expect(mocks.getAllConfigs).toHaveBeenCalledWith(ADDRESS);
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.getConfig(1)).toEqual(CONFIG);
    expect(view.current.hasConfig(1)).toBe(true);
    expect(view.current.hasConfig(2)).toBe(false);
  });

  it("getConfig fills in missing services and returns a new object each call", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: { ...CONFIG, services: null, signalRecipient: null } });
    const view = await mount();
    const config = view.current.getConfig(1);
    expect(config).toMatchObject({ services: [], signalRecipient: undefined });
    expect(view.current.getConfig(1)).not.toBe(config);
  });

  it("ignores a response for a wallet that is no longer connected", async () => {
    const first = deferred<Configs>();
    mocks.getAllConfigs.mockReturnValueOnce(first.promise).mockResolvedValueOnce(OTHER_CONFIGS);
    const view = renderHook(() => useNotificationConfig());
    mocks.address = OTHER_ADDRESS;
    view.flush();
    await view.act();
    expect(mocks.getAllConfigs.mock.calls).toEqual([[ADDRESS], [OTHER_ADDRESS]]);
    expect(view.current.hasConfig(2)).toBe(true);
    await view.act(() => first.resolve({ 1: CONFIG }));
    expect(view.current.hasConfig(1)).toBe(false);
    expect(view.current.hasConfig(2)).toBe(true);
  });

  it("keeps the new wallet's configs when the old wallet's request fails late", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const first = deferred<Configs>();
    mocks.getAllConfigs.mockReturnValueOnce(first.promise).mockResolvedValueOnce(OTHER_CONFIGS);
    const view = renderHook(() => useNotificationConfig());
    mocks.address = OTHER_ADDRESS;
    view.flush();
    await view.act();
    expect(view.current.hasConfig(2)).toBe(true);
    await view.act(() => first.reject(new TypeError("Failed to fetch")));
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.hasConfig(2)).toBe(true);
    expect(consoleError).toHaveBeenCalledWith("Failed to load notification configs:", expect.any(TypeError));
  });

  it.each(["resolves", "rejects"])(
    "stays unloaded when the old wallet's first request %s before the new wallet's",
    async outcome => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const first = deferred<Configs>();
      const second = deferred<Configs>();
      mocks.getAllConfigs.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      const view = renderHook(() => useNotificationConfig());
      mocks.address = OTHER_ADDRESS;
      view.flush();
      await view.act(() => (outcome === "resolves" ? first.resolve({ 1: CONFIG }) : first.reject(new Error("down"))));
      expect(view.current.isLoaded).toBe(false);
      expect(view.current.hasConfig(1)).toBe(false);
      await view.act(() => second.resolve(OTHER_CONFIGS));
      expect(view.current.isLoaded).toBe(true);
      expect(view.current.hasConfig(2)).toBe(true);
    },
  );

  it("resets to no configs when the new wallet's load fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const second = deferred<Configs>();
    mocks.getAllConfigs.mockResolvedValueOnce({ 1: CONFIG }).mockReturnValueOnce(second.promise);
    const view = await mount();
    mocks.address = OTHER_ADDRESS;
    await view.act();
    // BUG(B0.4): the previous wallet's configs stay loaded until the new wallet's request settles.
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.hasConfig(1)).toBe(true);
    await view.act(() => second.reject(new TypeError("Failed to fetch")));
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.hasConfig(1)).toBe(false);
  });

  it("clears the configs when the wallet disconnects", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const view = await mount();
    mocks.address = undefined;
    await view.act();
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.hasConfig(1)).toBe(false);
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  it("ignores a response that arrives after the wallet disconnected", async () => {
    const first = deferred<Configs>();
    mocks.getAllConfigs.mockReturnValueOnce(first.promise);
    const view = renderHook(() => useNotificationConfig());
    mocks.address = undefined;
    view.flush();
    await view.act(() => first.resolve({ 1: CONFIG }));
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.hasConfig(1)).toBe(false);
  });

  it("treats a failed load as no configs", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getAllConfigs.mockRejectedValue(new TypeError("Failed to fetch"));
    const view = await mount();
    expect(view.current.isLoaded).toBe(true);
    expect(view.current.hasConfig(1)).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("Failed to load notification configs:", expect.any(TypeError));
  });

  it("updateConfig merges over the saved config and pins the position chain id", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const view = await mount();
    await view.act(() =>
      view.current.updateConfig(1, {
        chainId: 999,
        services: ["signal"],
        email: undefined,
        signalRecipient: "alice.42",
      }),
    );
    const expected = { ...CONFIG, chainId: 1, services: ["signal"], email: undefined, signalRecipient: "alice.42" };
    expect(mocks.upsertConfig).toHaveBeenCalledWith(ADDRESS, expected);
    expect(view.current.getConfig(1)).toEqual(expected);
  });

  it("updateConfig starts from a disabled default for a new chain", async () => {
    const view = await mount();
    await view.act(() => view.current.updateConfig(10, { enabled: true }));
    expect(mocks.upsertConfig).toHaveBeenCalledWith(ADDRESS, {
      chainId: 10,
      enabled: true,
      services: [],
      healthFactorThreshold: 1.5,
    });
    expect(view.current.hasConfig(10)).toBe(true);
  });

  it("deleteConfig removes the chain's config", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG, 2: { ...CONFIG, chainId: 2 } });
    const view = await mount();
    await view.act(() => view.current.deleteConfig(1));
    expect(mocks.deleteConfig).toHaveBeenCalledWith(ADDRESS, 1);
    expect([view.current.hasConfig(1), view.current.hasConfig(2)]).toEqual([false, true]);
  });

  it("rejects writes without a wallet", async () => {
    mocks.address = undefined;
    const view = await mount();
    await expect(view.current.updateConfig(1, {})).rejects.toThrow(new Error("Wallet not connected"));
    await expect(view.current.deleteConfig(1)).rejects.toThrow(new Error("Wallet not connected"));
    expect(mocks.upsertConfig).not.toHaveBeenCalled();
    expect(mocks.deleteConfig).not.toHaveBeenCalled();
  });

  it("passes client errors through and keeps the saved state", async () => {
    mocks.getAllConfigs.mockResolvedValue({ 1: CONFIG });
    const saveError = new Error("Active paid access required");
    mocks.upsertConfig.mockRejectedValue(saveError);
    mocks.deleteConfig.mockRejectedValue(saveError);
    const view = await mount();
    await expect(view.current.updateConfig(1, { enabled: false })).rejects.toBe(saveError);
    await expect(view.current.deleteConfig(1)).rejects.toBe(saveError);
    view.flush();
    expect(view.current.getConfig(1)).toEqual(CONFIG);
  });
});
