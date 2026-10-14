import { arbitrum } from "viem/chains";
import { afterEach, describe, expect, it, vi } from "vitest";

// The config reads env vars at module load, so every case imports a fresh copy.
const loadConfig = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return import("~~/scaffold.config");
};

describe("scaffold.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("targets Arbitrum with the app's polling and wallet settings", async () => {
    const { default: config } = await loadConfig({});

    expect(config.targetNetworks).toEqual([arbitrum]);
    expect(config.pollingInterval).toBe(3000);
    expect(config.rpcOverrides).toEqual({});
    expect(config.onlyLocalBurnerWallet).toBe(true);
  });

  it.each([
    { state: "unset", value: undefined },
    { state: "empty", value: "" },
  ])("falls back to the shared Scaffold-ETH credentials when the env vars are $state", async ({ value }) => {
    const { default: config, DEFAULT_ALCHEMY_API_KEY } = await loadConfig({
      NEXT_PUBLIC_ALCHEMY_API_KEY: value,
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: value,
    });

    // BUG(B4.5): a missing production key silently falls back to Scaffold-ETH's shared, rate-limited credentials.
    expect(DEFAULT_ALCHEMY_API_KEY).toBe("cR4WnXePioePZ5fFrnSiR");
    expect(config.alchemyApiKey).toBe("cR4WnXePioePZ5fFrnSiR");
    expect(config.walletConnectProjectId).toBe("3a8170812b534d0ff9d794f19a901d64");
  });

  it("uses the env vars when they are set", async () => {
    const { default: config } = await loadConfig({
      NEXT_PUBLIC_ALCHEMY_API_KEY: "alchemy-key",
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: "walletconnect-id",
    });

    expect(config.alchemyApiKey).toBe("alchemy-key");
    expect(config.walletConnectProjectId).toBe("walletconnect-id");
  });
});
