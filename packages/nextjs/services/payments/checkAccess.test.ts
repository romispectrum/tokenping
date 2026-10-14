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

const viemMocks = vi.hoisted(() => ({
  readContract: vi.fn(),
  createPublicClient: vi.fn(),
  http: vi.fn(),
}));

vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: viemMocks.createPublicClient,
  http: viemMocks.http,
}));

type ConfigOverrides = {
  targetNetworks?: readonly { id: number; name: string }[];
  rpcOverrides?: Record<number, string>;
  deployedContracts?: Deployments;
};

const loadIsAccessActive = async (overrides: ConfigOverrides = {}) => {
  const chains = await import("viem/chains");
  vi.doMock("~~/scaffold.config", () => ({
    DEFAULT_ALCHEMY_API_KEY: "default-key",
    default: {
      targetNetworks: overrides.targetNetworks ?? [chains.arbitrum],
      pollingInterval: 3000,
      alchemyApiKey: "test-key",
      rpcOverrides: overrides.rpcOverrides ?? {},
      walletConnectProjectId: "test",
      onlyLocalBurnerWallet: true,
    },
  }));
  vi.doMock("~~/contracts/deployedContracts", () => ({ default: overrides.deployedContracts ?? DEPLOYMENTS }));
  return (await import("~~/services/payments/checkAccess")).isAccessActive;
};

const readContractCall = () => viemMocks.readContract.mock.calls[0]?.[0] as Record<string, unknown> | undefined;

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~~/scaffold.config");
  vi.doUnmock("~~/contracts/deployedContracts");
  viemMocks.readContract.mockReset().mockResolvedValue(true);
  viemMocks.http.mockReset().mockImplementation((url: string) => ({ url }));
  viemMocks.createPublicClient.mockReset().mockImplementation(() => ({ readContract: viemMocks.readContract }));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isAccessActive", () => {
  it("reads TokenpingPaywall.isActive(user) on the first target network with the paywall", async () => {
    const isAccessActive = await loadIsAccessActive();
    await expect(isAccessActive(USER)).resolves.toBe(true);

    expect(viemMocks.http).toHaveBeenCalledWith("https://arb-mainnet.g.alchemy.com/v2/test-key");
    const [clientConfig] = viemMocks.createPublicClient.mock.calls[0];
    expect(clientConfig.chain.id).toBe(42161);
    expect(clientConfig.transport).toEqual({ url: "https://arb-mainnet.g.alchemy.com/v2/test-key" });

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
    viemMocks.readContract.mockResolvedValue(value);
    const isAccessActive = await loadIsAccessActive();
    await expect(isAccessActive(USER)).resolves.toBe(false);
  });

  it("fails closed and logs the chain when the RPC call throws", async () => {
    const error = new Error("rate limited");
    viemMocks.readContract.mockRejectedValue(error);
    const isAccessActive = await loadIsAccessActive();
    await expect(isAccessActive(USER)).resolves.toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("42161"), error);
  });

  it("prefers an rpcOverride for the payment chain", async () => {
    const isAccessActive = await loadIsAccessActive({ rpcOverrides: { 42161: "https://override.example" } });
    await isAccessActive(USER);
    expect(viemMocks.http).toHaveBeenCalledWith("https://override.example");
  });

  it("uses NEXT_PUBLIC_HARDHAT_RPC_URL for a hardhat payment chain", async () => {
    vi.stubEnv("NEXT_PUBLIC_HARDHAT_RPC_URL", "http://hardhat.example:8545");
    const { hardhat } = await import("viem/chains");
    const isAccessActive = await loadIsAccessActive({ targetNetworks: [hardhat] });
    await isAccessActive(USER);
    expect(viemMocks.http).toHaveBeenCalledWith("http://hardhat.example:8545");
    expect(viemMocks.createPublicClient.mock.calls[0][0].chain).toBe(hardhat);
    expect(readContractCall()?.address).toBe(PAYWALL_HARDHAT);
  });

  it("falls back to the local node for a hardhat payment chain without the env var", async () => {
    vi.stubEnv("NEXT_PUBLIC_HARDHAT_RPC_URL", undefined);
    const { hardhat } = await import("viem/chains");
    const isAccessActive = await loadIsAccessActive({ targetNetworks: [hardhat] });
    await isAccessActive(USER);
    expect(viemMocks.http).toHaveBeenCalledWith("http://127.0.0.1:8545");
  });

  it("uses the first target network that has the paywall", async () => {
    const { mainnet, hardhat, arbitrum } = await import("viem/chains");
    const isAccessActive = await loadIsAccessActive({ targetNetworks: [mainnet, hardhat, arbitrum] });
    await isAccessActive(USER);
    expect(viemMocks.createPublicClient.mock.calls[0][0].chain.id).toBe(31337);
  });

  // BUG(B2.5): a chain without an Alchemy mapping falls back to a local node, which always fails in production.
  it("falls back to the local node for a chain without an Alchemy mapping", async () => {
    const { gnosis } = await import("viem/chains");
    const isAccessActive = await loadIsAccessActive({
      targetNetworks: [gnosis],
      deployedContracts: { [gnosis.id]: { TokenpingPaywall: { address: PAYWALL_ARBITRUM, abi: [] } } },
    });
    await isAccessActive(USER);
    expect(viemMocks.http).toHaveBeenCalledWith("http://127.0.0.1:8545");
  });

  it("returns false without an RPC call when no target network has the paywall", async () => {
    const { mainnet } = await import("viem/chains");
    const isAccessActive = await loadIsAccessActive({ targetNetworks: [mainnet] });
    await expect(isAccessActive(USER)).resolves.toBe(false);
    expect(viemMocks.createPublicClient).not.toHaveBeenCalled();
  });
});
