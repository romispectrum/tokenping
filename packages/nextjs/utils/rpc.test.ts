import { type Chain, defineChain } from "viem";
import { arbitrum, avalanche, base, gnosis, hardhat, mainnet, optimism, polygon, sepolia } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFallbackTransport, getRpcUrls } from "~~/utils/rpc";

const { config, SHARED_KEY } = vi.hoisted(() => ({
  config: { alchemyApiKey: "", rpcOverrides: {} as Record<number, string> },
  SHARED_KEY: "shared-default-key",
}));
vi.mock("~~/scaffold.config", () => ({ default: config, DEFAULT_ALCHEMY_API_KEY: SHARED_KEY }));

const KEY = "test-key";
const alchemy = (network: string, key = KEY) => `https://${network}.g.alchemy.com/v2/${key}`;

// Keyless endpoints for every Aave chain; Ethereum's and Polygon's viem defaults refuse or rate-limit keyless calls.
const PUBLICNODE = {
  [mainnet.id]: "https://ethereum-rpc.publicnode.com",
  [polygon.id]: "https://polygon-bor-rpc.publicnode.com",
  [arbitrum.id]: "https://arbitrum-one-rpc.publicnode.com",
  [optimism.id]: "https://optimism-rpc.publicnode.com",
  [base.id]: "https://base-rpc.publicnode.com",
  [avalanche.id]: "https://avalanche-c-chain-rpc.publicnode.com",
  [gnosis.id]: "https://gnosis-rpc.publicnode.com",
};

// Building the transport only creates the HTTP clients; nothing is fetched until a request is made.
const transportUrls = (chain: Chain) =>
  getFallbackTransport(chain)({ chain }).value!.transports.map(transport => transport.value!.url);

beforeEach(() => {
  config.alchemyApiKey = KEY;
  config.rpcOverrides = {};
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getRpcUrls", () => {
  it.each([
    { chain: mainnet, network: "eth-mainnet" },
    { chain: polygon, network: "polygon-mainnet" },
    { chain: arbitrum, network: "arb-mainnet" },
    { chain: optimism, network: "opt-mainnet" },
    { chain: base, network: "base-mainnet" },
    { chain: avalanche, network: "avax-mainnet" },
    { chain: gnosis, network: "gnosis-mainnet" },
  ])("builds the Alchemy URL for $chain.name ($network)", ({ chain, network }) => {
    expect(getRpcUrls(chain.id)).toEqual([alchemy(network)]);
  });

  it("keeps SE-2's other Alchemy networks, e.g. Sepolia", () => {
    expect(getRpcUrls(sepolia.id)).toEqual([alchemy("eth-sepolia")]);
  });

  it("puts the rpcOverrides entry before Alchemy", () => {
    config.rpcOverrides = { [arbitrum.id]: "https://arb.example/rpc" };

    expect(getRpcUrls(arbitrum.id)).toEqual(["https://arb.example/rpc", alchemy("arb-mainnet")]);
    expect(getRpcUrls(mainnet.id)).toEqual([alchemy("eth-mainnet")]);
  });

  it("skips Alchemy when no API key is configured", () => {
    config.alchemyApiKey = "";
    config.rpcOverrides = { [base.id]: "https://base.example/rpc" };

    expect(getRpcUrls(base.id)).toEqual(["https://base.example/rpc"]);
    expect(getRpcUrls(mainnet.id)).toEqual([]);
  });

  it("returns only the override, or nothing, for chains Alchemy does not serve", () => {
    expect(getRpcUrls(hardhat.id)).toEqual([]);
    expect(getRpcUrls(999_999)).toEqual([]);

    config.rpcOverrides = { [hardhat.id]: "http://node.local:8545" };
    expect(getRpcUrls(hardhat.id)).toEqual(["http://node.local:8545"]);
  });

  it("drops an empty override", () => {
    config.rpcOverrides = { [arbitrum.id]: "" };

    expect(getRpcUrls(arbitrum.id)).toEqual([alchemy("arb-mainnet")]);
  });

  it("leaves out Alchemy with Scaffold-ETH's shared default key", () => {
    config.alchemyApiKey = SHARED_KEY;
    config.rpcOverrides = { [base.id]: "https://base.example/rpc" };

    expect(getRpcUrls(base.id)).toEqual(["https://base.example/rpc"]);
    expect(getRpcUrls(mainnet.id)).toEqual([]);
  });

  it("reads the config on every call", () => {
    expect(getRpcUrls(arbitrum.id)).toEqual([alchemy("arb-mainnet")]);
    config.alchemyApiKey = "rotated";
    expect(getRpcUrls(arbitrum.id)).toEqual(["https://arb-mainnet.g.alchemy.com/v2/rotated"]);
  });
});

describe("getFallbackTransport", () => {
  it("is a viem fallback transport", () => {
    expect(getFallbackTransport(arbitrum)({ chain: arbitrum }).config.type).toBe("fallback");
  });

  it("tries the override, then Alchemy, then PublicNode, then the chain's public RPC", () => {
    config.rpcOverrides = { [arbitrum.id]: "https://arb.example/rpc" };

    expect(transportUrls(arbitrum)).toEqual([
      "https://arb.example/rpc",
      alchemy("arb-mainnet"),
      PUBLICNODE[arbitrum.id],
      arbitrum.rpcUrls.default.http[0],
    ]);
  });

  it.each([mainnet, polygon, arbitrum, optimism, base, avalanche, gnosis])(
    "reaches $name through PublicNode before its default RPC when nothing is configured",
    chain => {
      config.alchemyApiKey = "";

      expect(transportUrls(chain)).toEqual([PUBLICNODE[chain.id], chain.rpcUrls.default.http[0]]);
    },
  );

  it("lists an override that is the PublicNode URL only once", () => {
    config.alchemyApiKey = "";
    config.rpcOverrides = { [polygon.id]: PUBLICNODE[polygon.id] };

    expect(transportUrls(polygon)).toEqual([PUBLICNODE[polygon.id], polygon.rpcUrls.default.http[0]]);
  });

  it("uses the RPC of the chain it was given", () => {
    const custom = defineChain({
      id: 777_777,
      name: "Custom",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: ["https://rpc.custom.example"] } },
    });

    expect(transportUrls(custom)).toEqual(["https://rpc.custom.example"]);
  });

  it("tries Alchemy with the shared default key last, after PublicNode and the public RPC", () => {
    config.alchemyApiKey = SHARED_KEY;

    expect(transportUrls(mainnet)).toEqual([
      PUBLICNODE[mainnet.id],
      mainnet.rpcUrls.default.http[0],
      alchemy("eth-mainnet", SHARED_KEY),
    ]);
    expect(transportUrls(polygon)).toEqual([
      PUBLICNODE[polygon.id],
      polygon.rpcUrls.default.http[0],
      alchemy("polygon-mainnet", SHARED_KEY),
    ]);

    config.rpcOverrides = { [avalanche.id]: "https://avax.example/rpc" };
    expect(transportUrls(avalanche)).toEqual([
      "https://avax.example/rpc",
      PUBLICNODE[avalanche.id],
      avalanche.rpcUrls.default.http[0],
      alchemy("avax-mainnet", SHARED_KEY),
    ]);
    expect(transportUrls(hardhat)).toEqual(["http://127.0.0.1:8545"]);
  });

  it("adds no PublicNode endpoint for chains outside the Aave list, e.g. Sepolia", () => {
    config.alchemyApiKey = "";

    expect(transportUrls(sepolia)).toEqual([sepolia.rpcUrls.default.http[0]]);
  });

  it("keeps viem's default of 3 retries over the whole list", () => {
    expect(getFallbackTransport(arbitrum)({ chain: arbitrum }).config.retryCount).toBe(3);
  });

  it("passes the fallback config through, e.g. a lower retryCount for latency-bound callers", async () => {
    config.rpcOverrides = { [arbitrum.id]: "https://arb.example/rpc" };
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const transport = getFallbackTransport(arbitrum, { retryCount: 0 })({ chain: arbitrum });

    await expect(transport.request({ method: "eth_chainId" })).rejects.toThrow();
    // One request per endpoint and no second pass over the list.
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "https://arb.example/rpc",
      alchemy("arb-mainnet"),
      PUBLICNODE[arbitrum.id],
      arbitrum.rpcUrls.default.http[0],
    ]);
  });

  describe("on hardhat", () => {
    it("falls back to the local node at 127.0.0.1:8545", () => {
      vi.stubEnv("NEXT_PUBLIC_HARDHAT_RPC_URL", undefined);

      expect(transportUrls(hardhat)).toEqual(["http://127.0.0.1:8545"]);
    });

    it("uses NEXT_PUBLIC_HARDHAT_RPC_URL for the local node", () => {
      vi.stubEnv("NEXT_PUBLIC_HARDHAT_RPC_URL", "http://hardhat.internal:8545");
      config.rpcOverrides = { [hardhat.id]: "http://override.local:8545" };

      expect(transportUrls(hardhat)).toEqual(["http://override.local:8545", "http://hardhat.internal:8545"]);
    });
  });
});
