import { erc20Abi } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderStaticMarkup } from "~~/utils/testing/render";

const USER = "0x1111111111111111111111111111111111111111";
const SPENDER = "0x4444444444444444444444444444444444444444";

const { FIXTURE, constants, state, calls, resetState } = vi.hoisted(() => {
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
    isActive: undefined as boolean | undefined,
    plansResults: undefined as unknown[] | undefined,
    expiryTimestamp: undefined as bigint | undefined,
    allowance: undefined as bigint | undefined,
  });
  const constants = initialConstants();
  const state = initialState();
  const calls: unknown[][] = [];
  return {
    FIXTURE,
    constants,
    state,
    calls,
    resetState: () => {
      Object.assign(constants, initialConstants());
      Object.assign(state, initialState());
      calls.length = 0;
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

const refetch = (name: string) => () => {
  calls.push(["refetch", name]);
};

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: state.address }),
  useReadContract: (config: Record<string, unknown>) => {
    calls.push(["useReadContract", withAbiName(config)]);
    const isAllowance = config.functionName === "allowance";
    return {
      data: isAllowance ? state.allowance : state.expiryTimestamp,
      refetch: refetch(config.functionName as string),
    };
  },
  useReadContracts: (config: { contracts: Record<string, unknown>[]; query: unknown }) => {
    calls.push(["useReadContracts", { ...config, contracts: config.contracts.map(withAbiName) }]);
    return { data: state.plansResults, refetch: refetch("plans") };
  },
  useWriteContract: () => ({
    writeContractAsync: (variables: unknown) => {
      calls.push(["writeApproveAsync", variables]);
      return Promise.resolve("0xapprove");
    },
    isPending: false,
  }),
}));

vi.mock("~~/hooks/scaffold-eth", () => ({
  useScaffoldReadContract: (config: Record<string, unknown>) => {
    calls.push(["useScaffoldReadContract", config]);
    return { data: state.isActive, refetch: refetch("isActive") };
  },
  useScaffoldWriteContract: (config: Record<string, unknown>) => {
    calls.push(["useScaffoldWriteContract", config]);
    return { writeContractAsync: () => Promise.resolve(undefined), isPending: false };
  },
}));

type UseAccess = typeof import("~~/hooks/custom/useAccess").useAccess;

const runHook = (useAccess: UseAccess) => {
  let result: ReturnType<UseAccess> | undefined;
  const Probe = () => {
    result = useAccess();
    return null;
  };
  renderStaticMarkup(<Probe />);
  return result as ReturnType<UseAccess>;
};

const loadHook = async () => (await import("~~/hooks/custom/useAccess")).useAccess;

const hookCalls = () => calls.filter(([name]) => typeof name === "string" && name.startsWith("use"));

/** The config of the one call to `hook` (for `functionName`, when given); call order is not part of the contract. */
const hookConfig = (hook: string, functionName?: string) => {
  const matches = hookCalls().filter(
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

beforeEach(() => {
  resetState();
  vi.resetModules();
});

describe("useAccess reads", () => {
  it("pins every read to the payment chain with the same args", async () => {
    state.address = USER;
    runHook(await loadHook());
    expect(
      hookCalls()
        .map(([name]) => name)
        .sort(),
    ).toEqual([
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
    expect(hookConfig("useScaffoldWriteContract")).toEqual({
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

  it("disables the wallet-specific reads without a wallet", async () => {
    runHook(await loadHook());
    expect(hookConfig("useScaffoldReadContract")).toMatchObject({ args: [undefined] });
    expect(hookConfig("useReadContract", "expiryTimestampByUser")).toMatchObject({
      args: undefined,
      query: { enabled: false },
    });
    expect(hookConfig("useReadContract", "allowance")).toMatchObject({ args: undefined, query: { enabled: false } });
  });

  it("reads the allowance of the selected plan's token", async () => {
    state.address = USER;
    state.plansResults = [plan(1_500_000n, 2_592_000n, false), plan(2_000_000n, 86_400n, true)];
    const result = runHook(await loadHook());
    expect(result.paymentTokenAddress).toBe(FIXTURE.tokenB);
    expect(hookConfig("useReadContract", "allowance")).toMatchObject({
      address: FIXTURE.tokenB,
      args: [USER, FIXTURE.paywall],
    });
  });

  it("disables the plans and expiry reads without a paywall deployment", async () => {
    Object.assign(constants, {
      PAYMENT_CHAIN_ID: undefined,
      PAYMENT_CONTRACT_ADDRESS: undefined,
      PAYMENT_TOKEN_CANDIDATES: [],
      PAYMENT_TOKEN_ADDRESS: undefined,
      PAYWALL_ABI: undefined,
    });
    state.address = USER;
    runHook(await loadHook());
    expect(hookConfig("useReadContracts")).toEqual({ contracts: [], query: { enabled: false } });
    expect(hookConfig("useReadContract", "expiryTimestampByUser")).toMatchObject({
      address: undefined,
      chainId: undefined,
      query: { enabled: false },
    });
    expect(hookConfig("useReadContract", "allowance")).toMatchObject({ query: { enabled: false } });
  });
});

describe("useAccess state", () => {
  it("defaults while reads are loading", async () => {
    const result = runHook(await loadHook());
    expect(result.isActive).toBe(false);
    expect(result.plan).toBeNull();
    expect(result.paymentTokenAddress).toBe(FIXTURE.tokenA);
    expect(result.currentAllowance).toBe(0n);
    expect(result.expiryTimestamp).toBe(0n);
  });

  it("exposes the loaded reads", async () => {
    state.address = USER;
    state.isActive = true;
    state.plansResults = [plan(1_500_000n, 2_592_000n, true), plan(9n, 9n, true)];
    state.expiryTimestamp = 1_800_000_000n;
    state.allowance = 7n;
    const result = runHook(await loadHook());
    expect(result.isActive).toBe(true);
    expect(result.plan).toEqual({ price: 1_500_000n, durationSeconds: 2_592_000n, enabled: true });
    expect(result.paymentTokenAddress).toBe(FIXTURE.tokenA);
    expect(result.currentAllowance).toBe(7n);
    expect(result.expiryTimestamp).toBe(1_800_000_000n);
  });

  it("keeps a disabled plan as the fallback selection", async () => {
    state.plansResults = [plan(0n, 0n, false), { status: "failure" }];
    expect(runHook(await loadHook()).plan).toEqual({ price: 0n, durationSeconds: 0n, enabled: false });
  });

  it("refetches access, plans and expiry but not the allowance", async () => {
    const result = runHook(await loadHook());
    calls.length = 0;
    result.refetch();
    expect(calls.map(([, name]) => name).sort()).toEqual(["expiryTimestampByUser", "isActive", "plans"]);
  });
});

describe("useAccess approveAsync", () => {
  it("approves exactly the requested amount of the payment token on the payment chain", async () => {
    const result = runHook(await loadHook());
    calls.length = 0;
    await expect(result.approveAsync(SPENDER, 1_500_000n)).resolves.toBe("0xapprove");
    expect(calls).toEqual([
      [
        "writeApproveAsync",
        {
          abi: erc20Abi,
          address: FIXTURE.tokenA,
          functionName: "approve",
          args: [SPENDER, 1_500_000n],
          chainId: FIXTURE.chainId,
        },
      ],
    ]);
  });

  it.each([0n, -1n])("rejects a non-positive amount (%s)", async amount => {
    const result = runHook(await loadHook());
    await expect(result.approveAsync(SPENDER, amount)).rejects.toThrow("Approval amount must be positive");
  });

  it("rejects before the amount check when no payment token is configured", async () => {
    Object.assign(constants, { PAYMENT_TOKEN_CANDIDATES: [], PAYMENT_TOKEN_ADDRESS: undefined });
    const result = runHook(await loadHook());
    expect(result.paymentTokenAddress).toBeUndefined();
    await expect(result.approveAsync(SPENDER, 0n)).rejects.toThrow("Payment token is not configured");
    expect(hookConfig("useReadContracts")).toEqual({ contracts: [], query: { enabled: false } });
  });
});
