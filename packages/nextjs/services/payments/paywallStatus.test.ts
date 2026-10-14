import { describe, expect, it } from "vitest";
import { formatDurationDays, getPaywallStatus } from "~~/services/payments/paywallStatus";
import type { AccessPlan } from "~~/services/payments/plans";

const USER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TOKEN = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("getPaywallStatus", () => {
  const plan: AccessPlan = { price: 1_500_000n, durationSeconds: 2_592_000n, enabled: true };
  const ready = {
    address: USER,
    paymentChainId: 42161,
    onCorrectChain: true,
    plan,
    paymentTokenAddress: TOKEN,
    isPaywallDeployed: true,
    isPaused: false,
    allowance: 0n,
    hasReadError: false,
  };
  const unknown = { isPaywallDeployed: undefined, isPaused: undefined, allowance: undefined, hasReadError: false };

  it("is ready to pay when every check passes", () => {
    expect(getPaywallStatus(ready)).toEqual({ kind: "ready", plan, canPay: true, notice: null });
  });

  it("checks the wallet first", () => {
    expect(
      getPaywallStatus({
        address: undefined,
        paymentChainId: undefined,
        onCorrectChain: false,
        plan: null,
        paymentTokenAddress: undefined,
        ...unknown,
      }),
    ).toEqual({ kind: "connectWallet" });
  });

  it("checks the payment chain before the wallet chain", () => {
    expect(getPaywallStatus({ ...ready, paymentChainId: undefined, onCorrectChain: false, plan: null })).toEqual({
      kind: "unconfigured",
    });
  });

  it("checks the wallet chain before the plan", () => {
    expect(getPaywallStatus({ ...ready, onCorrectChain: false, plan: null })).toEqual({
      kind: "wrongChain",
      paymentChainId: 42161,
    });
  });

  it.each([
    ["missing", null],
    ["disabled", { ...plan, enabled: false }],
  ])("reports no plan when it is %s", (_label, candidate) => {
    expect(getPaywallStatus({ ...ready, plan: candidate })).toEqual({ kind: "noPlan" });
  });

  it("checks the plan before paused() and the allowance", () => {
    expect(getPaywallStatus({ ...ready, plan: null, isPaused: true, hasReadError: true })).toEqual({ kind: "noPlan" });
  });

  it("shows an enabled plan with a zero price, but not as payable", () => {
    const free = { ...plan, price: 0n };
    expect(getPaywallStatus({ ...ready, plan: free })).toEqual({
      kind: "ready",
      plan: free,
      canPay: false,
      notice: null,
    });
  });

  it("shows the plan, but not as payable, without a payment token", () => {
    expect(getPaywallStatus({ ...ready, paymentTokenAddress: undefined })).toEqual({
      kind: "ready",
      plan,
      canPay: false,
      notice: null,
    });
  });

  it("is payable with any known allowance, the approve decision is made when paying", () => {
    expect(getPaywallStatus({ ...ready, allowance: plan.price * 2n })).toMatchObject({ canPay: true, notice: null });
  });

  // Regression (B2.1): paused() was never read, so the paywall offered Pay and the approve was sent.
  it("shows the plan as not payable, with a notice, while paused", () => {
    expect(getPaywallStatus({ ...ready, isPaused: true })).toEqual({
      kind: "ready",
      plan,
      canPay: false,
      notice: "paused",
    });
    expect(
      getPaywallStatus({
        ...ready,
        isPaused: true,
        isPaywallDeployed: undefined,
        allowance: undefined,
        hasReadError: true,
      }),
    ).toMatchObject({ canPay: false, notice: "paused" });
  });

  // Regression (B2.0): an unknown allowance used to count as 0, so Pay decided to approve.
  it.each([
    ["the allowance", { allowance: undefined }],
    ["paused()", { isPaused: undefined }],
    ["the paywall deployment check", { isPaywallDeployed: undefined }],
  ])("is not payable, without a notice, while %s is loading", (_label, patch) => {
    expect(getPaywallStatus({ ...ready, ...patch })).toEqual({ kind: "ready", plan, canPay: false, notice: null });
  });

  it.each([
    ["the allowance", { allowance: undefined }],
    ["paused()", { isPaused: undefined }],
  ])("explains that the payment status is unavailable when reading %s failed", (_label, patch) => {
    expect(getPaywallStatus({ ...ready, ...patch, hasReadError: true })).toEqual({
      kind: "ready",
      plan,
      canPay: false,
      notice: "statusUnavailable",
    });
  });

  // Paying approves the paywall, so Pay waits for its code to be confirmed instead of refusing after the click.
  it("explains that the payment status is unavailable when the paywall's code was not found", () => {
    expect(getPaywallStatus({ ...ready, isPaywallDeployed: false })).toEqual({
      kind: "ready",
      plan,
      canPay: false,
      notice: "statusUnavailable",
    });
  });

  it("stays payable when a refetch failed but the last values are known", () => {
    expect(getPaywallStatus({ ...ready, hasReadError: true })).toMatchObject({ canPay: true, notice: null });
  });
});

describe("formatDurationDays", () => {
  it.each([
    [2_592_000n, "30"],
    [86_400n, "1"],
    [0n, "0"],
    [43_199n, "0"],
    // toFixed rounds half away from zero here, it does not floor.
    [43_200n, "1"],
    [129_600n, "2"],
    [216_000n, "3"],
    [31_536_000n, "365"],
  ])("formats %s seconds as %s days", (seconds, expected) => {
    expect(formatDurationDays(seconds)).toBe(expected);
  });
});
