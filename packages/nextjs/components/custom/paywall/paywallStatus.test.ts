import { describe, expect, it } from "vitest";
import { formatDurationDays, getPaywallStatus } from "~~/components/custom/paywall/paywallStatus";
import type { AccessPlan } from "~~/services/payments/plans";

const USER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TOKEN = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("getPaywallStatus", () => {
  const plan: AccessPlan = { price: 1_500_000n, durationSeconds: 2_592_000n, enabled: true };
  const ready = { address: USER, paymentChainId: 42161, onCorrectChain: true, plan, paymentTokenAddress: TOKEN };

  it("is ready to pay when every check passes", () => {
    expect(getPaywallStatus(ready)).toEqual({ kind: "ready", plan, canPay: true });
  });

  it("checks the wallet first", () => {
    expect(
      getPaywallStatus({
        address: undefined,
        paymentChainId: undefined,
        onCorrectChain: false,
        plan: null,
        paymentTokenAddress: undefined,
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

  it("shows an enabled plan with a zero price, but not as payable", () => {
    const free = { ...plan, price: 0n };
    expect(getPaywallStatus({ ...ready, plan: free })).toEqual({ kind: "ready", plan: free, canPay: false });
  });

  it("shows the plan, but not as payable, without a payment token", () => {
    expect(getPaywallStatus({ ...ready, paymentTokenAddress: undefined })).toEqual({
      kind: "ready",
      plan,
      canPay: false,
    });
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
