import type { Chain, Transport } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Fixture deployment, so these tests do not depend on the generated deployments.
const PAYWALL = "0x7777777777777777777777777777777777777777";
const PAYWALL_ABI = [{ type: "function", name: "plans" }];
const USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const MOCK_USDC = "0x9999999999999999999999999999999999999999";

type Deployments = Record<number, Record<string, { address: string; abi: readonly unknown[] }>>;

const DEPLOYMENTS: Deployments = { 42161: { TokenpingPaywall: { address: PAYWALL, abi: PAYWALL_ABI } } };

const mocks = vi.hoisted(() => ({
  readContract: vi.fn(),
  createPublicClient: vi.fn(),
  unstableCache: vi.fn(),
}));

// Only the client is mocked: the transport is the real one, and building it sends no request.
vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: mocks.createPublicClient,
}));

// unstable_cache needs Next's incremental cache; record its options and call straight through.
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }));

const loadAlertPlan = async ({ deployedContracts = DEPLOYMENTS } = {}) => {
  vi.doMock("~~/contracts/deployedContracts", () => ({ default: deployedContracts }));
  return import("~~/services/marketing/alertPlan");
};

const plan = (price: bigint, durationSeconds: bigint, enabled = true) => [price, durationSeconds, enabled] as const;

type ClientConfig = { chain: Chain; transport: Transport };
const clientConfig = () => mocks.createPublicClient.mock.calls[0]?.[0] as ClientConfig;

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~~/contracts/deployedContracts");
  mocks.readContract.mockReset().mockResolvedValue(plan(3_000_000n, 2_592_000n));
  mocks.createPublicClient.mockReset().mockImplementation(() => ({ readContract: mocks.readContract }));
  mocks.unstableCache.mockReset().mockImplementation((fn: () => unknown) => fn);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readAlertPlan", () => {
  it("reads plans(USDC) from TokenpingPaywall on Arbitrum and formats it for copy", async () => {
    const { readAlertPlan } = await loadAlertPlan();

    await expect(readAlertPlan()).resolves.toEqual({ priceLabel: "3 USDC", days: 30 });
    expect(clientConfig().chain.id).toBe(42161);
    expect(mocks.readContract).toHaveBeenCalledWith({
      address: PAYWALL,
      abi: PAYWALL_ABI,
      functionName: "plans",
      args: [USDC],
    });
  });

  it("tries each RPC endpoint once instead of retrying the whole list", async () => {
    const { readAlertPlan } = await loadAlertPlan();
    await readAlertPlan();

    const { transport, chain } = clientConfig();
    expect(transport({ chain }).config.retryCount).toBe(0);
  });

  it.each([
    ["1.5 USDC / 30 days", plan(1_500_000n, 2_592_000n), { priceLabel: "1.5 USDC", days: 30 }],
    ["10 USDC / 1 day", plan(10_000_000n, 86_400n), { priceLabel: "10 USDC", days: 1 }],
    ["3 USDC / 36 hours", plan(3_000_000n, 129_600n), { priceLabel: "3 USDC", days: 1.5 }],
  ])("formats a %s plan", async (_label, result, expected) => {
    mocks.readContract.mockResolvedValue(result);
    const { readAlertPlan } = await loadAlertPlan();

    await expect(readAlertPlan()).resolves.toEqual(expected);
  });

  it.each([
    ["disabled", plan(3_000_000n, 2_592_000n, false)],
    ["free", plan(0n, 2_592_000n)],
    ["zero-length", plan(3_000_000n, 0n)],
  ])("resolves null for a %s plan, which the paywall would not sell", async (_label, result) => {
    mocks.readContract.mockResolvedValue(result);
    const { readAlertPlan } = await loadAlertPlan();

    await expect(readAlertPlan()).resolves.toBeNull();
  });

  it("reads MockUSDC's plan where the deployment has one (local chains)", async () => {
    const { readAlertPlan } = await loadAlertPlan({
      deployedContracts: { 42161: { ...DEPLOYMENTS[42161], MockUSDC: { address: MOCK_USDC, abi: [] } } },
    });
    await readAlertPlan();

    expect(mocks.readContract.mock.calls[0][0].args).toEqual([MOCK_USDC]);
  });

  it("resolves null without an RPC call when no target network has the paywall", async () => {
    const { readAlertPlan } = await loadAlertPlan({ deployedContracts: {} });

    await expect(readAlertPlan()).resolves.toBeNull();
    expect(mocks.createPublicClient).not.toHaveBeenCalled();
  });

  it("throws when the chain cannot be read, so the failure is not cached", async () => {
    mocks.readContract.mockRejectedValue(new Error("rate limited"));
    const { readAlertPlan } = await loadAlertPlan();

    await expect(readAlertPlan()).rejects.toThrow("plans() read failed");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("42161"), expect.any(Error));
  });
});

describe("getAlertPlan", () => {
  it("caches the read for an hour under a key naming the chain and token", async () => {
    const { getAlertPlan, readAlertPlan, ALERT_PLAN_REVALIDATE_SECONDS } = await loadAlertPlan();

    await expect(getAlertPlan()).resolves.toEqual({ priceLabel: "3 USDC", days: 30 });
    expect(ALERT_PLAN_REVALIDATE_SECONDS).toBe(3600);
    expect(mocks.unstableCache).toHaveBeenCalledWith(readAlertPlan, ["alert-plan", "42161", USDC], {
      revalidate: 3600,
      tags: ["alert-plan"],
    });
  });

  it("falls back to null when the read fails", async () => {
    mocks.readContract.mockRejectedValue(new Error("rate limited"));
    const { getAlertPlan } = await loadAlertPlan();

    await expect(getAlertPlan()).resolves.toBeNull();
  });

  it("falls back to null and logs any other error", async () => {
    const error = new Error("cache unavailable");
    mocks.unstableCache.mockImplementation(() => () => Promise.reject(error));
    const { getAlertPlan } = await loadAlertPlan();

    await expect(getAlertPlan()).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledWith("getAlertPlan: unexpected error", error);
  });
});
