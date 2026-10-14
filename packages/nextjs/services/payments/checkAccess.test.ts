import type { Chain, Transport } from "viem";
import { arbitrum, bsc, hardhat, mainnet } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Fixture deployments, so these tests do not depend on the generated deployments.
const PAYWALL_ARBITRUM = "0x7777777777777777777777777777777777777777";
const PAYWALL_HARDHAT = "0x8888888888888888888888888888888888888888";
const PAYWALL_ABI = [{ type: "function", name: "isActive" }];
const USER = "0x1111111111111111111111111111111111111111";

type Deployments = Record<number, Record<string, { address: string; abi: readonly unknown[] }>>;

const DEPLOYMENTS: Deployments = {
  42161: { TokenpingPaywall: { address: PAYWALL_ARBITRUM, abi: PAYWALL_ABI } },
  31337: { TokenpingPaywall: { address: PAYWALL_HARDHAT, abi: PAYWALL_ABI } },
};

const mocks = vi.hoisted(() => ({
  readContract: vi.fn(),
  createPublicClient: vi.fn(),
  getFallbackTransport: vi.fn(),
}));

// Only the client is mocked: the transport is the real one, and building it sends no request.
vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: mocks.createPublicClient,
}));

// A spy around the real implementation; utils/rpc.test.ts covers the URL policy itself.
vi.mock("~~/utils/rpc", async importOriginal => {
  const rpc = await importOriginal<typeof import("~~/utils/rpc")>();
  mocks.getFallbackTransport.mockImplementation(rpc.getFallbackTransport);
  return { ...rpc, getFallbackTransport: mocks.getFallbackTransport };
});

type ConfigOverrides = {
  targetNetworks?: readonly Chain[];
  deployedContracts?: Deployments;
};

const loadIsAccessActive = async (overrides: ConfigOverrides = {}) => {
  const chains = await import("viem/chains");
  vi.doMock("~~/scaffold.config", async importOriginal => {
    const config = await importOriginal<typeof import("~~/scaffold.config")>();
    return { ...config, default: { ...config.default, targetNetworks: overrides.targetNetworks ?? [chains.arbitrum] } };
  });
  vi.doMock("~~/contracts/deployedContracts", () => ({ default: overrides.deployedContracts ?? DEPLOYMENTS }));
  return (await import("~~/services/payments/checkAccess")).isAccessActive;
};

const readContractCall = () => mocks.readContract.mock.calls[0]?.[0] as Record<string, unknown> | undefined;

type ClientConfig = { chain: Chain; transport: Transport };
const clientConfig = () => mocks.createPublicClient.mock.calls[0]?.[0] as ClientConfig;

/** The RPC URLs the public client would try, in order. */
const rpcUrls = () => {
  const { chain, transport } = clientConfig();
  const { config, value } = transport({ chain });
  if (config.type !== "fallback") return [value?.url];
  return (value?.transports as ReturnType<Transport>[]).map(inner => inner.value?.url);
};

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~~/scaffold.config");
  vi.doUnmock("~~/contracts/deployedContracts");
  mocks.readContract.mockReset().mockResolvedValue(true);
  mocks.createPublicClient.mockReset().mockImplementation(() => ({ readContract: mocks.readContract }));
  mocks.getFallbackTransport.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isAccessActive", () => {
  it("reads TokenpingPaywall.isActive(user) on the first target network with the paywall", async () => {
    const isAccessActive = await loadIsAccessActive();
    await expect(isAccessActive(USER)).resolves.toBe(true);

    expect(clientConfig().chain).toBe(arbitrum);
    expect(mocks.getFallbackTransport.mock.calls).toEqual([[arbitrum]]);
    expect(clientConfig().transport).toBe(mocks.getFallbackTransport.mock.results[0].value);

    expect(readContractCall()).toEqual({
      address: PAYWALL_ARBITRUM,
      abi: PAYWALL_ABI,
      functionName: "isActive",
      args: [USER],
    });
  });

  it("passes the user address through unchanged", async () => {
    const isAccessActive = await loadIsAccessActive();
    await isAccessActive("  0xAbC  ");
    expect(readContractCall()?.args).toEqual(["  0xAbC  "]);
  });

  it.each([
    ["false", false],
    ["a truthy non-boolean", 1],
    ["the string 'true'", "true"],
  ])("returns false when the contract returns %s", async (_label, value) => {
    mocks.readContract.mockResolvedValue(value);
    const isAccessActive = await loadIsAccessActive();
    await expect(isAccessActive(USER)).resolves.toBe(false);
  });

  it("fails closed and logs the chain when the RPC call throws", async () => {
    const error = new Error("rate limited");
    mocks.readContract.mockRejectedValue(error);
    const isAccessActive = await loadIsAccessActive();
    await expect(isAccessActive(USER)).resolves.toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("42161"), error);
  });

  it("uses the first target network that has the paywall", async () => {
    const isAccessActive = await loadIsAccessActive({ targetNetworks: [mainnet, hardhat, arbitrum] });
    await isAccessActive(USER);
    expect(clientConfig().chain).toBe(hardhat);
    expect(mocks.getFallbackTransport.mock.calls).toEqual([[hardhat]]);
    expect(readContractCall()?.address).toBe(PAYWALL_HARDHAT);
  });

  // Regression (B2.5): a chain without an Alchemy mapping used http://127.0.0.1:8545, which always fails in production.
  it("reaches a chain without an Alchemy mapping through its public RPC, not the local node", async () => {
    const isAccessActive = await loadIsAccessActive({
      targetNetworks: [bsc],
      deployedContracts: { [bsc.id]: { TokenpingPaywall: { address: PAYWALL_ARBITRUM, abi: [] } } },
    });
    await isAccessActive(USER);
    expect(rpcUrls()).toContain(bsc.rpcUrls.default.http[0]);
    expect(rpcUrls()).not.toContain("http://127.0.0.1:8545");
  });

  it("returns false without an RPC call when no target network has the paywall", async () => {
    const isAccessActive = await loadIsAccessActive({ targetNetworks: [mainnet] });
    await expect(isAccessActive(USER)).resolves.toBe(false);
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });
});
