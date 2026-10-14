// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { erc20Abi } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The payment flow itself (approve, pay, refetch, errors) is covered end to end in AccessPaywall.test.tsx. This file
// pins the reads useAccess configures, what it returns, and the guard the paywall UI cannot reach.

const USER = "0x1111111111111111111111111111111111111111";

const { FIXTURE, constants, state, renders, actions, resetState } = vi.hoisted(() => {
  // The payment constants are a fixture, so these tests do not depend on scaffold.config or the deployments.
  const FIXTURE = {
    chainId: 8453,
    paywall: "0x5555555555555555555555555555555555555555",
    tokenA: "0x6666666666666666666666666666666666666666",
    tokenB: "0x7777777777777777777777777777777777777777",
    abi: [{ type: "function", name: "paywallAbiFixture" }],
  } as const;
  const initialConstants = () => ({
    PAYMENT_CHAIN_ID: FIXTURE.chainId as number | undefined,
    PAYMENT_CONTRACT_ADDRESS: FIXTURE.paywall as string | undefined,
    PAYMENT_TOKEN_CANDIDATES: [FIXTURE.tokenA, FIXTURE.tokenB] as string[],
    PAYMENT_TOKEN_ADDRESS: FIXTURE.tokenA as string | undefined,
    PAYWALL_ABI: FIXTURE.abi as unknown,
  });
  const initialState = () => ({
    address: undefined as string | undefined,
    walletChainId: undefined as number | undefined,
    isActive: undefined as boolean | undefined,
    plansResults: undefined as unknown[] | undefined,
    expiryTimestamp: undefined as bigint | undefined,
    allowance: undefined as bigint | undefined,
    paused: undefined as boolean | undefined,
    paywallCheck: "deployed" as "deployed" | "loading",
  });
  const constants = initialConstants();
  const state = initialState();
  /** The hook calls of each render, in order: [hook name, config]. */
  const renders: [string, unknown][][] = [];
  /** Refetches and writes, i.e. anything payForAccess does. */
  const actions: unknown[][] = [];
  return {
    FIXTURE,
    constants,
    state,
    renders,
    actions,
    resetState: () => {
      Object.assign(constants, initialConstants());
      Object.assign(state, initialState());
      renders.length = 0;
      actions.length = 0;
    },
  };
});

// Getters, because useAccess reads some constants at module load: each test sets them, then imports a fresh module.
vi.mock("~~/constants/payments", () => ({
  get PAYMENT_CHAIN_ID() {
    return constants.PAYMENT_CHAIN_ID;
  },
  get PAYMENT_CONTRACT_ADDRESS() {
    return constants.PAYMENT_CONTRACT_ADDRESS;
  },
  get PAYMENT_TOKEN_CANDIDATES() {
    return constants.PAYMENT_TOKEN_CANDIDATES;
  },
  get PAYMENT_TOKEN_ADDRESS() {
    return constants.PAYMENT_TOKEN_ADDRESS;
  },
  get PAYWALL_ABI() {
    return constants.PAYWALL_ABI;
  },
}));

/** Names the ABI instead of comparing its entries. */
const describeAbi = (abi: unknown) => {
  if (abi === erc20Abi) return "erc20Abi";
  if (abi === FIXTURE.abi) return "paywallAbi";
  return abi === undefined ? "none" : "unexpected";
};

const withAbiName = ({ abi, ...rest }: Record<string, unknown>) => ({ ...rest, abi: describeAbi(abi) });

const record = (hook: string, config: unknown) => renders[renders.length - 1].push([hook, config]);

const readValues = (): Record<string, unknown> => ({
  isActive: state.isActive,
  plans: state.plansResults,
  expiryTimestampByUser: state.expiryTimestamp,
  allowance: state.allowance,
  paused: state.paused,
});

const fakeRead = (name: string) => ({
  data: readValues()[name],
  isError: false,
  refetch: async () => {
    actions.push(["refetch", name]);
    return { data: readValues()[name], isError: false };
  },
});

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: state.address,
    chain: state.walletChainId === undefined ? undefined : { id: state.walletChainId },
  }),
  useReadContract: (config: Record<string, unknown>) => {
    record("useReadContract", withAbiName(config));
    return fakeRead(config.functionName as string);
  },
  useReadContracts: (config: { contracts: Record<string, unknown>[]; query: unknown }) => {
    record("useReadContracts", { ...config, contracts: config.contracts.map(withAbiName) });
    return fakeRead("plans");
  },
  useWriteContract: () => ({
    writeContractAsync: async (variables: unknown) => {
      actions.push(["approve", variables]);
      return "0xapprove";
    },
  }),
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useScaffoldReadContract: (config: Record<string, unknown>) => {
    record("useScaffoldReadContract", config);
    return fakeRead("isActive");
  },
  useScaffoldWriteContract: (config: Record<string, unknown>) => {
    record("useScaffoldWriteContract", config);
    return {
      writeContractAsync: async (variables: unknown) => {
        actions.push(["pay", variables]);
        return "0xpay";
      },
    };
  },
  useDeployedContractInfo: (config: Record<string, unknown>) => {
    record("useDeployedContractInfo", config);
    const isLoading = state.paywallCheck === "loading";
    return { data: isLoading ? undefined : { address: FIXTURE.paywall }, isLoading };
  },
  useTransactor: () => async (tx: () => Promise<string>) => tx(),
}));

type UseAccess = typeof import("~~/hooks/custom/useAccess").useAccess;

const runHook = async () => {
  const { useAccess }: { useAccess: UseAccess } = await import("~~/hooks/custom/useAccess");
  return renderHook(() => {
    renders.push([]);
    return useAccess();
  }).result.current;
};

/** The config of the one call to `hook` (for `functionName`, when given) in the latest render. */
const hookConfig = (hook: string, functionName?: string) => {
  const matches = renders[renders.length - 1].filter(
    ([name, config]) =>
      name === hook &&
      (functionName === undefined || (config as Record<string, unknown> | undefined)?.functionName === functionName),
  );
  expect(matches, `${hook} ${functionName ?? ""}`).toHaveLength(1);
  return matches[0][1];
};

const plan = (price: bigint, durationSeconds: bigint, enabled: boolean) => ({
  status: "success",
  result: [price, durationSeconds, enabled],
});

const PRICE = 1_500_000n;

/** Connected on the payment chain with an enabled plan, not paused, and no allowance yet. */
const setReady = () => {
  state.address = USER;
  state.walletChainId = FIXTURE.chainId;
  state.plansResults = [plan(PRICE, 2_592_000n, true)];
  state.paused = false;
  state.allowance = 0n;
};

beforeEach(() => {
  resetState();
  vi.resetModules();
});

describe("useAccess reads", () => {
  it("pins every read to the payment chain with the same args", async () => {
    state.address = USER;
    await runHook();
    expect(renders[renders.length - 1].map(([name]) => name).sort()).toEqual([
      "useDeployedContractInfo",
      "useReadContract",
      "useReadContract",
      "useReadContract",
      "useReadContracts",
      "useScaffoldReadContract",
      "useScaffoldWriteContract",
    ]);
    expect(hookConfig("useScaffoldReadContract")).toEqual({
      contractName: "TokenpingPaywall",
      functionName: "isActive",
      args: [USER],
      chainId: FIXTURE.chainId,
    });
    expect(hookConfig("useReadContracts")).toEqual({
      contracts: [FIXTURE.tokenA, FIXTURE.tokenB].map(token => ({
        address: FIXTURE.paywall,
        abi: "paywallAbi",
        functionName: "plans",
        args: [token],
        chainId: FIXTURE.chainId,
      })),
      query: { enabled: true },
    });
    expect(hookConfig("useReadContract", "expiryTimestampByUser")).toEqual({
      abi: "paywallAbi",
      address: FIXTURE.paywall,
      functionName: "expiryTimestampByUser",
      args: [USER],
      chainId: FIXTURE.chainId,
      query: { enabled: true },
    });
    expect(hookConfig("useReadContract", "paused")).toEqual({
      abi: "paywallAbi",
      address: FIXTURE.paywall,
      functionName: "paused",
      chainId: FIXTURE.chainId,
      query: { enabled: true, refetchInterval: expect.any(Function) },
    });
    expect(hookConfig("useScaffoldWriteContract")).toEqual({
      contractName: "TokenpingPaywall",
      chainId: FIXTURE.chainId,
    });
    expect(hookConfig("useDeployedContractInfo")).toEqual({
      contractName: "TokenpingPaywall",
      chainId: FIXTURE.chainId,
    });
    expect(hookConfig("useReadContract", "allowance")).toEqual({
      address: FIXTURE.tokenA,
      abi: "erc20Abi",
      functionName: "allowance",
      args: [USER, FIXTURE.paywall],
      chainId: FIXTURE.chainId,
      query: { enabled: true },
    });
  });

  // paused() is not watched and window-focus refetches are off, so without polling Pay never came back after an unpause.
  it("re-reads paused() every 30 seconds while the paywall is paused", async () => {
    await runHook();
    const { query } = hookConfig("useReadContract", "paused") as {
      query: { refetchInterval?: (query: { state: { data?: boolean } }) => number | false | undefined };
    };
    expect(query.refetchInterval?.({ state: { data: true } })).toBe(30_000);
    expect(query.refetchInterval?.({ state: { data: false } })).toBe(false);
    expect(query.refetchInterval?.({ state: {} })).toBe(false);
  });

  it("disables the wallet-specific reads without a wallet", async () => {
    await runHook();
    expect(hookConfig("useScaffoldReadContract")).toMatchObject({ args: [undefined] });
    expect(hookConfig("useReadContract", "expiryTimestampByUser")).toMatchObject({
      args: undefined,
      query: { enabled: false },
    });
    expect(hookConfig("useReadContract", "allowance")).toMatchObject({ args: undefined, query: { enabled: false } });
    expect(hookConfig("useReadContract", "paused")).toMatchObject({ query: { enabled: true } });
  });

  it("reads the allowance of the selected plan's token", async () => {
    state.address = USER;
    state.plansResults = [plan(1_500_000n, 2_592_000n, false), plan(2_000_000n, 86_400n, true)];
    await runHook();
    expect(hookConfig("useReadContract", "allowance")).toMatchObject({
      address: FIXTURE.tokenB,
      args: [USER, FIXTURE.paywall],
    });
  });

  it("disables the plans, expiry and paused reads without a paywall deployment", async () => {
    Object.assign(constants, {
      PAYMENT_CHAIN_ID: undefined,
      PAYMENT_CONTRACT_ADDRESS: undefined,
      PAYMENT_TOKEN_CANDIDATES: [],
      PAYMENT_TOKEN_ADDRESS: undefined,
      PAYWALL_ABI: undefined,
    });
    state.address = USER;
    await runHook();
    expect(hookConfig("useReadContracts")).toEqual({ contracts: [], query: { enabled: false } });
    expect(hookConfig("useReadContract", "expiryTimestampByUser")).toMatchObject({
      address: undefined,
      chainId: undefined,
      query: { enabled: false },
    });
    expect(hookConfig("useReadContract", "paused")).toMatchObject({ address: undefined, query: { enabled: false } });
    expect(hookConfig("useReadContract", "allowance")).toMatchObject({ query: { enabled: false } });
  });
});

describe("useAccess state", () => {
  it("defaults while reads are loading", async () => {
    const result = await runHook();
    expect(result.isActive).toBe(false);
    expect(result.expiryTimestamp).toBe(0n);
    expect(result.status).toEqual({ kind: "connectWallet" });
  });

  it("exposes access, expiry and the paywall status of the selected plan", async () => {
    setReady();
    state.isActive = true;
    state.expiryTimestamp = 1_800_000_000n;
    state.plansResults = [plan(PRICE, 2_592_000n, true), plan(9n, 9n, true)];
    const result = await runHook();
    expect(result.isActive).toBe(true);
    expect(result.expiryTimestamp).toBe(1_800_000_000n);
    expect(result.status).toEqual({
      kind: "ready",
      plan: { price: PRICE, durationSeconds: 2_592_000n, enabled: true },
      canPay: true,
      notice: null,
    });
  });
});

describe("useAccess payForAccess", () => {
  // The paywall disables or hides Pay in all of these states; the hook still refuses on its own.
  it.each([
    ["without a wallet", () => (state.address = undefined)],
    ["on the wrong chain", () => (state.walletChainId = 1)],
    ["without a plan", () => (state.plansResults = [{ status: "failure" }])],
    ["while the allowance is unknown", () => (state.allowance = undefined)],
    ["while the paywall deployment is being confirmed", () => (state.paywallCheck = "loading")],
    [
      "without a payment token",
      () => Object.assign(constants, { PAYMENT_TOKEN_CANDIDATES: [], PAYMENT_TOKEN_ADDRESS: undefined }),
    ],
  ])("refuses with a message and sends nothing %s", async (_label, arrange) => {
    setReady();
    arrange();
    const result = await runHook();
    await expect(result.payForAccess()).resolves.toEqual({
      paid: false,
      error: "Paid access is not available right now.",
    });
    expect(actions).toEqual([]);
  });
});
