import { readFileSync, readdirSync } from "node:fs";
import { type Abi, isAddress } from "viem";
import { arbitrum, gnosis, hardhat, mainnet } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Fixture deployments and target networks: nothing below depends on scaffold.config or the generated deployments,
// except the last test, which checks the generated ABI itself.
const PAYWALL_ARBITRUM = "0x1111111111111111111111111111111111111111";
const PAYWALL_LOCAL = "0x2222222222222222222222222222222222222222";
const MOCK_USDC_LOCAL = "0x3333333333333333333333333333333333333333";
const OTHER_PAYWALL = "0x5555555555555555555555555555555555555555";
const OTHER_MOCK_USDC = "0x6666666666666666666666666666666666666666";
const ARBITRUM_USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const ARBITRUM_ABI = [{ type: "function", name: "arbitrumAbiFixture" }];
const LOCAL_ABI = [{ type: "function", name: "localAbiFixture" }];

type Deployments = Record<number, Record<string, { address: string; abi: readonly unknown[] }>>;

const DEPLOYMENTS: Deployments = {
  [hardhat.id]: {
    TokenpingPaywall: { address: PAYWALL_LOCAL, abi: LOCAL_ABI },
    MockUSDC: { address: MOCK_USDC_LOCAL, abi: [] },
  },
  [arbitrum.id]: { TokenpingPaywall: { address: PAYWALL_ARBITRUM, abi: ARBITRUM_ABI } },
};

const load = async ({
  targetNetworks = [arbitrum],
  deployedContracts = DEPLOYMENTS,
}: { targetNetworks?: readonly { id: number }[]; deployedContracts?: Deployments } = {}) => {
  vi.doMock("~~/scaffold.config", () => ({ default: { targetNetworks } }));
  vi.doMock("~~/contracts/deployedContracts", () => ({ default: deployedContracts }));
  const constants = await import("~~/constants/payments");
  return {
    constants,
    resolved: {
      chainId: constants.PAYMENT_CHAIN_ID,
      contractAddress: constants.PAYMENT_CONTRACT_ADDRESS,
      tokenCandidates: constants.PAYMENT_TOKEN_CANDIDATES,
      tokenAddress: constants.PAYMENT_TOKEN_ADDRESS,
    },
  };
};

const paywallOnly = (chainId: number, extra: Deployments[number] = {}): Deployments => ({
  [chainId]: { TokenpingPaywall: { address: OTHER_PAYWALL, abi: [] }, ...extra },
});

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~~/scaffold.config");
  vi.doUnmock("~~/contracts/deployedContracts");
});

describe("payment constants", () => {
  it("resolve the canonical USDC on an Arbitrum deployment", async () => {
    expect((await load({ targetNetworks: [arbitrum] })).resolved).toEqual({
      chainId: arbitrum.id,
      contractAddress: PAYWALL_ARBITRUM,
      tokenCandidates: [ARBITRUM_USDC],
      tokenAddress: ARBITRUM_USDC,
    });
  });

  it("prefer a deployed MockUSDC on the local chain", async () => {
    expect((await load({ targetNetworks: [hardhat] })).resolved).toEqual({
      chainId: hardhat.id,
      contractAddress: PAYWALL_LOCAL,
      tokenCandidates: [MOCK_USDC_LOCAL],
      tokenAddress: MOCK_USDC_LOCAL,
    });
  });

  it("pick the first target network that has the paywall", async () => {
    const { resolved } = await load({ targetNetworks: [mainnet, hardhat, arbitrum] });
    expect(resolved.chainId).toBe(hardhat.id);
  });

  it("are empty when no target network has the paywall", async () => {
    expect((await load({ targetNetworks: [mainnet] })).resolved).toEqual({
      chainId: undefined,
      contractAddress: undefined,
      tokenCandidates: [],
      tokenAddress: undefined,
    });
  });

  it("prefer MockUSDC over the canonical USDC on Arbitrum", async () => {
    const { resolved } = await load({
      deployedContracts: paywallOnly(arbitrum.id, { MockUSDC: { address: OTHER_MOCK_USDC, abi: [] } }),
    });
    expect(resolved.tokenCandidates).toEqual([OTHER_MOCK_USDC]);
  });

  it("use the EIP-55 checksummed canonical USDC on mainnet", async () => {
    const { resolved } = await load({ targetNetworks: [mainnet], deployedContracts: paywallOnly(mainnet.id) });
    expect(resolved).toEqual({
      chainId: mainnet.id,
      contractAddress: OTHER_PAYWALL,
      tokenCandidates: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
      tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    });
  });

  it("have no token candidates on other chains", async () => {
    const { resolved } = await load({ targetNetworks: [gnosis], deployedContracts: paywallOnly(gnosis.id) });
    expect(resolved).toEqual({
      chainId: gnosis.id,
      contractAddress: OTHER_PAYWALL,
      tokenCandidates: [],
      tokenAddress: undefined,
    });
  });

  it("expose the payment chain deployment's ABI, or none without a deployment", async () => {
    expect((await load({ targetNetworks: [arbitrum] })).constants.PAYWALL_ABI).toBe(ARBITRUM_ABI);
    vi.resetModules();
    expect((await load({ targetNetworks: [hardhat, arbitrum] })).constants.PAYWALL_ABI).toBe(LOCAL_ABI);
    vi.resetModules();
    expect((await load({ targetNetworks: [mainnet] })).constants.PAYWALL_ABI).toBeUndefined();
  });
});

describe("configured addresses", () => {
  // viem's isAddress is strict: a mixed-case address with a wrong checksum fails, and so do the plans read and the
  // admin form validation that use it.
  it("every canonical payment token passes viem's strict isAddress", async () => {
    const { CANONICAL_USDC } = (await load()).constants;
    expect(Object.keys(CANONICAL_USDC).map(Number).sort()).toEqual([mainnet.id, arbitrum.id].sort());
    for (const [chainId, address] of Object.entries(CANONICAL_USDC)) {
      expect(isAddress(address ?? ""), `chain ${chainId}: ${address}`).toBe(true);
    }
  });

  it("every generated deployment address passes viem's strict isAddress", async () => {
    vi.doUnmock("~~/contracts/deployedContracts");
    const { default: deployedContracts } = await import("~~/contracts/deployedContracts");
    const addresses = Object.values(deployedContracts as Record<number, Record<string, { address: string }>>).flatMap(
      contracts => Object.values(contracts).map(({ address }) => address),
    );
    expect(addresses.length).toBeGreaterThan(0);
    for (const address of addresses) expect(isAddress(address), address).toBe(true);
  });
});

// The deploy scripts keep their own copy of the canonical USDC addresses, which the paywall's plans are set up with.
describe("hardhat deploy network configs", () => {
  const CONFIG_DIR = new URL("../../hardhat/deploy/network-config/", import.meta.url);
  const addressesIn = (file: string) =>
    readFileSync(new URL(file, CONFIG_DIR), "utf8").match(/0x[0-9a-fA-F]{40}/g) ?? [];

  it("contain only addresses that pass viem's strict isAddress", () => {
    const addresses = readdirSync(CONFIG_DIR)
      .filter(file => file.endsWith(".ts"))
      .flatMap(addressesIn);
    expect(addresses.length).toBeGreaterThan(0);
    for (const address of addresses) expect(isAddress(address), address).toBe(true);
  });

  it.each([
    ["mainnet.ts", mainnet.id],
    ["arbitrum.ts", arbitrum.id],
  ])("%s deploys with the USDC the app pays with", async (file, chainId) => {
    const { CANONICAL_USDC } = (await load()).constants;
    expect(addressesIn(file)).toEqual([CANONICAL_USDC[chainId]]);
  });
});

describe("getPaywallContract", () => {
  it("looks up the deployment on any chain, configured or not", async () => {
    const { constants } = await load({ targetNetworks: [arbitrum] });
    expect(constants.getPaywallContract(hardhat.id)?.address).toBe(PAYWALL_LOCAL);
    expect(constants.getPaywallContract(arbitrum.id)?.address).toBe(PAYWALL_ARBITRUM);
    expect(constants.getPaywallContract(mainnet.id)).toBeUndefined();
  });
});

describe("generated TokenpingPaywall ABI", () => {
  const signature = (abi: Abi, name: string) => {
    const entry = abi.find(item => item.type === "function" && item.name === name);
    if (entry?.type !== "function") return "missing";
    const types = (params: readonly { type: string }[]) => params.map(param => param.type).join(",");
    return `${name}(${types(entry.inputs)}) ${entry.stateMutability} returns (${types(entry.outputs)})`;
  };

  // useAccess used hand-written fragments for these two reads; same signatures mean the same calldata and decoding.
  it("keeps the signatures of the hand-written fragments it replaced, on every deployment", async () => {
    const { default: deployedContracts } = await import("~~/contracts/deployedContracts");
    const abis = Object.values(deployedContracts as Record<number, { TokenpingPaywall?: { abi: Abi } }>).flatMap(
      contracts => (contracts.TokenpingPaywall ? [contracts.TokenpingPaywall.abi] : []),
    );
    expect(abis.length).toBeGreaterThan(0);
    for (const abi of abis) {
      expect(signature(abi, "plans")).toBe("plans(address) view returns (uint256,uint256,bool)");
      expect(signature(abi, "expiryTimestampByUser")).toBe("expiryTimestampByUser(address) view returns (uint256)");
    }
  });
});
