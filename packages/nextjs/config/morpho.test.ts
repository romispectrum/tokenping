import { getAddress } from "viem";
import * as viemChains from "viem/chains";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import { hyperEvm, robinhood, stable, tempo } from "~~/config/chains";
import { MORPHO_CHAINS, MORPHO_MIDNIGHT_CHAINS, getMorphoChain, isMorphoEnabled } from "~~/config/morpho";
import { getFallbackTransport } from "~~/utils/rpc";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMorphoEnabled", () => {
  it("is on only for exactly 'true'", () => {
    for (const value of [undefined, "", "1", "TRUE", "yes"]) {
      vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", value);
      expect(isMorphoEnabled(), String(value)).toBe(false);
    }
    vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "true");
    expect(isMorphoEnabled()).toBe(true);
  });
});

describe("MORPHO_CHAINS", () => {
  it("lists the 14 chains Morpho's app covers, each once", () => {
    expect(MORPHO_CHAINS.map(({ name }) => name)).toEqual([
      "Ethereum",
      "Base",
      "Arbitrum",
      "OP Mainnet",
      "Polygon",
      "Unichain",
      "World Chain",
      "HyperEVM",
      "Katana",
      "Monad",
      "Arc",
      "Robinhood Chain",
      "Stable",
      "Tempo",
    ]);
    expect(new Set(MORPHO_CHAINS.map(({ chain }) => chain.id)).size).toBe(14);
  });

  it("writes every contract address checksummed", () => {
    for (const { name, blue, midnight, preLiquidationFactory } of MORPHO_CHAINS) {
      for (const address of [blue, midnight, preLiquidationFactory].filter(Boolean) as string[]) {
        expect(getAddress(address), name).toBe(address);
      }
    }
  });

  it("has Midnight on five chains and offers it where Morpho's API lists markets, so not on Tempo", () => {
    expect(MORPHO_CHAINS.filter(({ midnight }) => midnight).map(({ name }) => name)).toEqual([
      "Ethereum",
      "Base",
      "Arc",
      "Robinhood Chain",
      "Tempo",
    ]);
    expect(MORPHO_MIDNIGHT_CHAINS.map(({ name }) => name)).toEqual(["Ethereum", "Base", "Arc", "Robinhood Chain"]);
  });

  // viem's multicall needs the chain's Multicall3; Katana's viem definition lacks one.
  it("gives every chain a Multicall3 and an https RPC route", () => {
    for (const { name, chain } of MORPHO_CHAINS) {
      expect(chain.contracts?.multicall3?.address.toLowerCase(), name).toBe(
        "0xca11bde05977b3631167028862be2a173976ca11",
      );
      const urls = getFallbackTransport(chain)({ chain }).value!.transports.map(
        (transport: { value?: { url?: string } }) => transport.value!.url,
      );
      expect(urls.length, name).toBeGreaterThan(0);
      for (const url of urls) expect(url, name).toMatch(/^https:\/\//);
    }
  });

  // The chains defined here (config/chains.ts) must not shadow a viem mainnet. HyperEVM's 999 is also two viem
  // testnets' id, so only mainnets are compared.
  it("defines its own chains under ids no viem mainnet uses", () => {
    const mainnetIds = new Set<number>(
      Object.values(viemChains)
        .filter(chain => !chain.testnet)
        .map(chain => chain.id),
    );
    for (const chain of [hyperEvm, robinhood, stable, tempo]) expect(mainnetIds.has(chain.id), chain.name).toBe(false);
  });

  it("finds a chain by id and stays apart from the Aave chain list", () => {
    expect(getMorphoChain(8453)?.name).toBe("Base");
    expect(getMorphoChain(56)).toBeUndefined();
    // The Aave lists feed llms.txt, the agent skill and the home page counts, which stay Aave-only.
    expect(AAVE_CHAINS.some(({ chain }) => chain.id === 999)).toBe(false);
  });
});
