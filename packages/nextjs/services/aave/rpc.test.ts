import * as chains from "viem/chains";
import { afterEach, describe, expect, it, vi } from "vitest";
import scaffoldConfig from "~~/scaffold.config";
import { getDashboardRpcUrl, getFallbackRpcUrl, getServerRpcUrl } from "~~/services/aave/rpc";

describe("getFallbackRpcUrl", () => {
  it("returns the public RPC of an Aave chain", () => {
    expect(getFallbackRpcUrl(chains.mainnet.id)).toBe("https://eth.llamarpc.com");
  });

  it("returns an empty string for other chains", () => {
    expect(getFallbackRpcUrl(chains.bsc.id)).toBe("");
  });
});

describe("getServerRpcUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the Alchemy key at call time", () => {
    vi.stubEnv("NEXT_PUBLIC_ALCHEMY_API_KEY", "");
    expect(getServerRpcUrl(chains.gnosis.id)).toBe("https://rpc.gnosischain.com");

    vi.stubEnv("NEXT_PUBLIC_ALCHEMY_API_KEY", "key");
    expect(getServerRpcUrl(chains.gnosis.id)).toBe("https://gnosis-mainnet.g.alchemy.com/v2/key");
  });

  it("returns an empty string for a chain with neither an Alchemy network nor a public RPC", () => {
    vi.stubEnv("NEXT_PUBLIC_ALCHEMY_API_KEY", "key");

    expect(getServerRpcUrl(chains.bsc.id)).toBe("");
  });
});

describe("getDashboardRpcUrl", () => {
  it.each([chains.mainnet.id, chains.polygon.id, chains.arbitrum.id, chains.optimism.id, chains.base.id])(
    "uses SE-2's Alchemy URL for chain %i when a key is configured",
    chainId => {
      expect(scaffoldConfig.alchemyApiKey).not.toBe("");
      expect(getDashboardRpcUrl(chainId)).toMatch(
        new RegExp(`^https://[a-z]+-mainnet\\.g\\.alchemy\\.com/v2/${scaffoldConfig.alchemyApiKey}$`),
      );
    },
  );

  it.each([
    [chains.avalanche.id, "https://api.avax.network/ext/bc/C/rpc"],
    [chains.gnosis.id, "https://rpc.gnosischain.com"],
  ])("uses the public RPC for chain %i, which SE-2's Alchemy map lacks", (chainId, url) => {
    // BUG(B1.5): the server uses Alchemy for these chains, so the dashboard and the cron can disagree.
    expect(getDashboardRpcUrl(chainId)).toBe(url);
  });

  it("returns an empty string for an unknown chain", () => {
    expect(getDashboardRpcUrl(chains.bsc.id)).toBe("");
  });
});
