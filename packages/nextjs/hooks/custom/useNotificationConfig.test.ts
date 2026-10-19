// @vitest-environment jsdom
import { onlineManager } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import type { Locale } from "~~/i18n/locales";
import { SignInRequiredError } from "~~/services/api/apiClient";
import type { NotificationConfig } from "~~/types/notifications";
import { deferred } from "~~/utils/testing/helpers";
import { createTestQueryClient, renderHookWithProviders } from "~~/utils/testing/providers";

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  locale: "en" as Locale,
  getAllConfigs: vi.fn(),
  upsertConfig: vi.fn(),
  deleteConfig: vi.fn(),
  /** Whether the connected wallet is the signed-in one (useWalletSession). */
  signedIn: true,
  markSignedOut: vi.fn(),
}));

vi.mock("wagmi", () => ({ useAccount: () => ({ address: mocks.address }) }));
// The real signOutOn401, so a 401 reaches markSignedOut as in the app.
vi.mock("~~/hooks/custom/useWalletSession", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/hooks/custom/useWalletSession")>()),
  useWalletSession: () => ({
    isSignedIn: !!mocks.address && mocks.signedIn,
    isChecking: false,
    markSignedOut: mocks.markSignedOut,
  }),
}));
// The page's language, which the LocaleProvider of each root layout supplies.
vi.mock("~~/i18n/LocaleProvider", () => ({ useLocale: () => mocks.locale }));
vi.mock("~~/services/notifications/notificationConfigClient", () => ({
  notificationConfigClient: {
    getAllConfigs: mocks.getAllConfigs,
    upsertConfig: mocks.upsertConfig,
    deleteConfig: mocks.deleteConfig,
  },
}));

const ADDRESS = "0xAbC0000000000000000000000000000000000001";
const OTHER_ADDRESS = "0xDeF0000000000000000000000000000000000002";

// A market by its chain and its id within the chain, and the key the API lists its config under.
const ETHEREUM = { chainId: 1, market: "v3" };
const CHAIN_2 = { chainId: 2, market: "v3" };
const OPTIMISM = { chainId: 10, market: "v3" };
// Aave V4's Lido Spoke, on the same chain as ETHEREUM.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const ETHEREUM_LIDO = { chainId: 1, market: LIDO_SPOKE };
const LIDO_KEY = `1:${LIDO_SPOKE}`;

const CONFIG: NotificationConfig = {
  chainId: 1,
  market: "v3",
  enabled: true,
  services: ["email"],
  healthFactorThreshold: 1.8,
  email: "me@example.com",
};

type Configs = Record<string, NotificationConfig>;

const OTHER_CONFIGS: Configs = { "2:v3": { ...CONFIG, chainId: 2 } };

const render = (queryClient = createTestQueryClient()) =>
  renderHookWithProviders(() => useNotificationConfig(), { queryClient });

const renderLoaded = async () => {
  const view = render();
  await waitFor(() => expect(view.result.current.isLoaded).toBe(true));
  return view;
};

beforeEach(() => {
  mocks.address = ADDRESS;
  mocks.locale = "en";
  mocks.signedIn = true;
  mocks.markSignedOut.mockReset();
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

  it("is loaded with no configs and makes no request before the wallet signs in", () => {
    mocks.signedIn = false;
    const { result } = render();
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.hasConfig(ETHEREUM)).toBe(false);
    expect(mocks.getAllConfigs).not.toHaveBeenCalled();
  });

  it("hides the configs it loaded once the session ends, and shows them again after signing in", async () => {
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
    const { result, rerender } = await renderLoaded();
    expect(result.current.hasConfig(ETHEREUM)).toBe(true);

    mocks.signedIn = false;
    rerender();
    expect(result.current.getConfig(ETHEREUM)).toBeNull();

    mocks.signedIn = true;
    rerender();
    await waitFor(() => expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG));
  });

  it("marks the wallet signed out when the load answers 401", async () => {
    mocks.getAllConfigs.mockRejectedValue(new SignInRequiredError("Sign in with your wallet first"));
    render();
    await waitFor(() => expect(mocks.markSignedOut).toHaveBeenCalled());
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a save", (hook: ReturnType<typeof useNotificationConfig>) => hook.updateConfig(ETHEREUM, { enabled: true })],
    ["a delete", (hook: ReturnType<typeof useNotificationConfig>) => hook.deleteConfig(ETHEREUM)],
  ])("marks the wallet signed out when %s answers 401, and still rejects", async (_label, write) => {
    const signedOut = new SignInRequiredError("Sign in with your wallet first");
    mocks.upsertConfig.mockRejectedValue(signedOut);
    mocks.deleteConfig.mockRejectedValue(signedOut);
    const { result } = await renderLoaded();
    await act(() => expect(write(result.current)).rejects.toBe(signedOut));
    expect(mocks.markSignedOut).toHaveBeenCalledTimes(1);
  });

  it("does not mark the wallet signed out for other failures", async () => {
    mocks.upsertConfig.mockRejectedValue(new Error("Active paid access required"));
    const { result } = await renderLoaded();
    await act(() => expect(result.current.updateConfig(ETHEREUM, { enabled: true })).rejects.toThrow());
    expect(mocks.markSignedOut).not.toHaveBeenCalled();
  });

  it("is loaded with no configs and makes no request without a wallet", () => {
    mocks.address = undefined;
    const { result } = render();
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.getConfig(ETHEREUM)).toBeNull();
    expect(mocks.getAllConfigs).not.toHaveBeenCalled();
  });

  it("loads the signed-in wallet's configs and caches them under the normalized address", async () => {
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
    const { result, queryClient } = render();
    expect(result.current.isLoaded).toBe(false);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(mocks.getAllConfigs.mock.calls).toEqual([[]]);
    expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
    expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(CHAIN_2)]).toEqual([true, false]);
    expect(queryClient.getQueryData(["notificationConfigs", ADDRESS.toLowerCase()])).toEqual({ "1:v3": CONFIG });
  });

  it("getConfig fills in fields older rows lack and keeps the same object while the data is unchanged", async () => {
    mocks.getAllConfigs.mockResolvedValue({
      "1:v3": { ...CONFIG, market: undefined, services: null, signalRecipient: null, telegramUsername: null },
    });
    const { result, rerender } = await renderLoaded();
    const config = result.current.getConfig(ETHEREUM);
    expect(config).toMatchObject({
      market: "v3",
      services: [],
      signalRecipient: undefined,
      telegramUsername: undefined,
    });
    rerender();
    expect(result.current.getConfig(ETHEREUM)).toBe(config);
  });

  it("forgets the previous wallet's configs as soon as the wallet switches", async () => {
    const otherConfigs = deferred<Configs>();
    mocks.getAllConfigs.mockResolvedValueOnce({ "1:v3": CONFIG }).mockReturnValueOnce(otherConfigs.promise);
    const { result, rerender } = await renderLoaded();
    expect(result.current.hasConfig(ETHEREUM)).toBe(true);

    mocks.address = OTHER_ADDRESS;
    rerender();
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.getConfig(ETHEREUM)).toBeNull();

    otherConfigs.resolve(OTHER_CONFIGS);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(CHAIN_2)]).toEqual([false, true]);
    expect(mocks.getAllConfigs.mock.calls).toEqual([[], []]);
  });

  it("never shows a late response for the previous wallet", async () => {
    const first = deferred<Configs>();
    mocks.getAllConfigs.mockReturnValueOnce(first.promise).mockResolvedValueOnce(OTHER_CONFIGS);
    const { result, rerender } = render();
    mocks.address = OTHER_ADDRESS;
    rerender();
    await waitFor(() => expect(result.current.hasConfig(CHAIN_2)).toBe(true));
    await act(async () => first.resolve({ "1:v3": CONFIG }));
    expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(CHAIN_2)]).toEqual([false, true]);
  });

  it("shows a wallet's cached configs at once when switching back to it", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ "1:v3": CONFIG }).mockResolvedValueOnce(OTHER_CONFIGS);
    const { result, rerender } = await renderLoaded();
    mocks.address = OTHER_ADDRESS;
    rerender();
    await waitFor(() => expect(result.current.hasConfig(CHAIN_2)).toBe(true));

    mocks.getAllConfigs.mockReturnValueOnce(new Promise(() => undefined));
    mocks.address = ADDRESS;
    rerender();
    expect(result.current.isLoaded).toBe(true);
    expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(CHAIN_2)]).toEqual([true, false]);
  });

  it("clears the configs when the wallet disconnects", async () => {
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
    const { result, rerender } = await renderLoaded();
    mocks.address = undefined;
    rerender();
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.hasConfig(ETHEREUM)).toBe(false);
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  it("reports a failed load instead of treating it as no configs, and recovers on refetch", async () => {
    const retry = deferred<Configs>();
    mocks.getAllConfigs.mockRejectedValueOnce(new Error("Database error")).mockReturnValueOnce(retry.promise);
    const { result } = render();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.hasConfig(ETHEREUM)).toBe(false);

    act(() => void result.current.refetch());
    await waitFor(() => expect(result.current.isFetching).toBe(true));
    // Still reported as failed (and loaded) while the retry is in flight, so the Retry UI stays on screen.
    expect([result.current.isError, result.current.isLoaded]).toEqual([true, true]);
    retry.resolve({ "1:v3": CONFIG });
    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
  });

  it("keeps showing the loaded configs when a background refetch fails", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ "1:v3": CONFIG }).mockRejectedValueOnce(new Error("down"));
    const { result } = await renderLoaded();
    await act(async () => void (await result.current.refetch()));
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(2);
    expect(result.current.isError).toBe(false);
    expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
  });

  it("shares one cache between every component that uses it", async () => {
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
    const queryClient = createTestQueryClient();
    const editor = render(queryClient);
    const indicator = render(queryClient);
    await waitFor(() => expect(indicator.result.current.hasConfig(ETHEREUM)).toBe(true));
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);

    mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));
    await act(() => editor.result.current.updateConfig(OPTIMISM, { enabled: true }));
    await waitFor(() => expect(indicator.result.current.hasConfig(OPTIMISM)).toBe(true));

    await act(() => editor.result.current.deleteConfig(ETHEREUM));
    await waitFor(() => expect(indicator.result.current.hasConfig(ETHEREUM)).toBe(false));
  });

  it("updateConfig merges over the saved config, pins the position's market and caches what it sent", async () => {
    const saved = {
      ...CONFIG,
      signalRecipient: "alice.42",
      telegramUsername: "alice_eth",
      services: ["email", "signal", "telegram"] as const,
    };
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": saved });
    const { result } = await renderLoaded();
    // An explicit undefined clears a deselected service's recipient: the Telegram username too.
    const expected = {
      ...saved,
      chainId: 1,
      market: "v3",
      services: ["signal"],
      email: undefined,
      telegramUsername: undefined,
      healthFactorThreshold: 2,
      locale: "en",
    };

    await act(() =>
      result.current.updateConfig(ETHEREUM, {
        chainId: 999,
        market: LIDO_SPOKE,
        services: ["signal"],
        email: undefined,
        telegramUsername: undefined,
        healthFactorThreshold: 2,
      }),
    );
    expect(mocks.upsertConfig.mock.calls).toEqual([[expected]]);
    await waitFor(() => expect(result.current.getConfig(ETHEREUM)).toEqual(expected));
  });

  it("does not reload the configs after a write", async () => {
    const { result } = await renderLoaded();
    await act(() => result.current.updateConfig(OPTIMISM, { enabled: true }));
    await waitFor(() => expect(result.current.hasConfig(OPTIMISM)).toBe(true));
    await act(() => result.current.deleteConfig(OPTIMISM));
    await waitFor(() => expect(result.current.hasConfig(OPTIMISM)).toBe(false));
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
    mocks.getAllConfigs.mockResolvedValueOnce({ "1:v3": CONFIG });
    const { result, queryClient } = await renderLoaded();
    const answerReload = await holdReload(result);

    await act(() => result.current.updateConfig(OPTIMISM, { enabled: true }));
    await waitFor(() => expect(result.current.hasConfig(OPTIMISM)).toBe(true));
    // The reload read the configs before the save reached the server.
    await act(async () => answerReload({ "1:v3": CONFIG }));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(OPTIMISM)]).toEqual([true, true]);
    expect(
      Object.keys(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()]) ?? {}),
    ).toEqual(["1:v3", "10:v3"]);
    expect(result.current.isError).toBe(false);
  });

  it("keeps a delete when a reload that started before it answers after it", async () => {
    mocks.getAllConfigs.mockResolvedValueOnce({ "1:v3": CONFIG, ...OTHER_CONFIGS });
    const { result, queryClient } = await renderLoaded();
    const answerReload = await holdReload(result);

    await act(() => result.current.deleteConfig(ETHEREUM));
    await waitFor(() => expect(result.current.hasConfig(ETHEREUM)).toBe(false));
    await act(async () => answerReload({ "1:v3": CONFIG, ...OTHER_CONFIGS }));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(CHAIN_2)]).toEqual([false, true]);
    expect(
      Object.keys(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()]) ?? {}),
    ).toEqual(["2:v3"]);
  });

  it("reports a save or a delete while it is in flight", async () => {
    const request = deferred<void>();
    mocks.upsertConfig.mockReturnValue(request.promise);
    mocks.deleteConfig.mockReturnValue(request.promise);
    const { result } = await renderLoaded();
    expect([result.current.isSaving, result.current.isDeleting]).toEqual([false, false]);

    let saving: Promise<void> | undefined;
    act(() => {
      saving = result.current.updateConfig(ETHEREUM, { enabled: true });
    });
    await waitFor(() => expect([result.current.isSaving, result.current.isDeleting]).toEqual([true, false]));
    let deleting: Promise<void> | undefined;
    act(() => {
      deleting = result.current.deleteConfig(ETHEREUM);
    });
    await waitFor(() => expect([result.current.isSaving, result.current.isDeleting]).toEqual([true, true]));

    await act(async () => {
      request.resolve();
      await Promise.all([saving, deleting]);
    });
    await waitFor(() => expect([result.current.isSaving, result.current.isDeleting]).toEqual([false, false]));
  });

  it("updateConfig starts from a disabled default for a new market", async () => {
    const { result } = await renderLoaded();
    mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));
    await act(() => result.current.updateConfig(OPTIMISM, { enabled: true }));
    expect(mocks.upsertConfig.mock.calls).toEqual([
      [{ chainId: 10, market: "v3", enabled: true, services: [], healthFactorThreshold: 1.5, locale: "en" }],
    ]);
    await waitFor(() => expect(result.current.hasConfig(OPTIMISM)).toBe(true));
  });

  it("saves the page's language with the config, replacing the language it was saved in before", async () => {
    mocks.locale = "cs";
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": { ...CONFIG, locale: "en" } });
    const { result } = await renderLoaded();
    await act(() => result.current.updateConfig(ETHEREUM, { healthFactorThreshold: 1.6 }));
    await act(() => result.current.updateConfig(OPTIMISM, { enabled: true }));
    expect(mocks.upsertConfig.mock.calls.map(([config]) => [config.chainId, config.locale])).toEqual([
      [1, "cs"],
      [10, "cs"],
    ]);
    await waitFor(() => expect(result.current.getConfig(ETHEREUM)?.locale).toBe("cs"));
  });

  it("deleteConfig removes only that market's config", async () => {
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG, "2:v3": { ...CONFIG, chainId: 2 } });
    const { result } = await renderLoaded();
    mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));
    await act(() => result.current.deleteConfig(ETHEREUM));
    expect(mocks.deleteConfig.mock.calls).toEqual([[ETHEREUM]]);
    await waitFor(() =>
      expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(CHAIN_2)]).toEqual([false, true]),
    );
  });

  describe("two markets on one chain (Aave V3 and V4's Lido Spoke on Ethereum)", () => {
    const LIDO_CONFIG: NotificationConfig = { ...CONFIG, market: LIDO_SPOKE, healthFactorThreshold: 1.3 };

    it("reads each market's config under its own key", async () => {
      mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG, [LIDO_KEY]: LIDO_CONFIG });
      const { result } = await renderLoaded();

      expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
      expect(result.current.getConfig(ETHEREUM_LIDO)).toEqual(LIDO_CONFIG);
      expect(result.current.getConfig({ chainId: 1, market: "0x94e7a5dcbe816e498b89ab752661904e2f56c485" })).toBeNull();
    });

    it("saves an alert for the Spoke without touching the V3 alert, and sends and caches its market", async () => {
      mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
      const { result, queryClient } = await renderLoaded();
      expect([result.current.hasConfig(ETHEREUM), result.current.hasConfig(ETHEREUM_LIDO)]).toEqual([true, false]);
      mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));

      await act(() => result.current.updateConfig(ETHEREUM_LIDO, { enabled: true, healthFactorThreshold: 1.3 }));

      const sent = {
        chainId: 1,
        market: LIDO_SPOKE,
        enabled: true,
        services: [],
        healthFactorThreshold: 1.3,
        locale: "en",
      };
      // A new market starts from the default, not from the V3 alert on the same chain.
      expect(mocks.upsertConfig.mock.calls).toEqual([[sent]]);
      await waitFor(() => expect(result.current.hasConfig(ETHEREUM_LIDO)).toBe(true));
      expect(result.current.getConfig(ETHEREUM_LIDO)).toEqual(sent);
      expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
      expect(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()])).toEqual({
        "1:v3": CONFIG,
        [LIDO_KEY]: sent,
      });
    });

    it("merges an edit over the Spoke's own saved alert", async () => {
      mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG, [LIDO_KEY]: LIDO_CONFIG });
      const { result } = await renderLoaded();

      await act(() => result.current.updateConfig(ETHEREUM_LIDO, { healthFactorThreshold: 1.25 }));

      expect(mocks.upsertConfig.mock.calls).toEqual([[{ ...LIDO_CONFIG, healthFactorThreshold: 1.25, locale: "en" }]]);
      await waitFor(() => expect(result.current.getConfig(ETHEREUM_LIDO)?.healthFactorThreshold).toBe(1.25));
      expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
    });

    it("deletes one market's alert and keeps the other's", async () => {
      mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG, [LIDO_KEY]: LIDO_CONFIG });
      const { result } = await renderLoaded();
      mocks.getAllConfigs.mockReturnValue(new Promise(() => undefined));

      await act(() => result.current.deleteConfig(ETHEREUM_LIDO));

      expect(mocks.deleteConfig.mock.calls).toEqual([[ETHEREUM_LIDO]]);
      await waitFor(() => expect(result.current.hasConfig(ETHEREUM_LIDO)).toBe(false));
      expect(result.current.hasConfig(ETHEREUM)).toBe(true);

      await act(() => result.current.deleteConfig(ETHEREUM));

      expect(mocks.deleteConfig.mock.calls).toEqual([[ETHEREUM_LIDO], [ETHEREUM]]);
      await waitFor(() => expect(result.current.hasConfig(ETHEREUM)).toBe(false));
      expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
    });
  });

  it("writes the result into the cache of the wallet that made the change", async () => {
    const save = deferred<void>();
    mocks.getAllConfigs.mockResolvedValueOnce({}).mockResolvedValueOnce(OTHER_CONFIGS);
    mocks.upsertConfig.mockReturnValue(save.promise);
    const { result, rerender, queryClient } = await renderLoaded();
    let saving: Promise<void> | undefined;
    act(() => {
      saving = result.current.updateConfig(OPTIMISM, { enabled: true });
    });

    mocks.address = OTHER_ADDRESS;
    rerender();
    await waitFor(() => expect(result.current.hasConfig(CHAIN_2)).toBe(true));
    await act(async () => {
      save.resolve();
      await saving;
    });

    expect(result.current.hasConfig(OPTIMISM)).toBe(false);
    expect(queryClient.getQueryData<Configs>(["notificationConfigs", ADDRESS.toLowerCase()])?.["10:v3"]).toMatchObject({
      chainId: 10,
      market: "v3",
      enabled: true,
    });
  });

  it("rejects writes without a wallet", async () => {
    mocks.address = undefined;
    const { result } = render();
    await expect(result.current.updateConfig(ETHEREUM, {})).rejects.toThrow(new Error("Wallet not connected"));
    await expect(result.current.deleteConfig(ETHEREUM)).rejects.toThrow(new Error("Wallet not connected"));
    expect(mocks.upsertConfig).not.toHaveBeenCalled();
    expect(mocks.deleteConfig).not.toHaveBeenCalled();
  });

  it("passes client errors through and keeps the saved state", async () => {
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
    const saveError = new Error("Active paid access required");
    mocks.upsertConfig.mockRejectedValue(saveError);
    mocks.deleteConfig.mockRejectedValue(saveError);
    const { result } = await renderLoaded();
    await act(async () => {
      await expect(result.current.updateConfig(ETHEREUM, { enabled: false })).rejects.toBe(saveError);
      await expect(result.current.deleteConfig(ETHEREUM)).rejects.toBe(saveError);
    });
    expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);
    expect(mocks.getAllConfigs).toHaveBeenCalledTimes(1);
  });

  it("loads and writes while the browser reports offline instead of pausing until it is back online", async () => {
    onlineManager.setOnline(false);
    mocks.getAllConfigs.mockResolvedValue({ "1:v3": CONFIG });
    const { result } = await renderLoaded();
    expect(result.current.getConfig(ETHEREUM)).toEqual(CONFIG);

    mocks.upsertConfig.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(act(() => result.current.updateConfig(ETHEREUM, { email: "new@example.com" }))).rejects.toThrow(
      "Failed to fetch",
    );
    expect(mocks.upsertConfig).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });
});
