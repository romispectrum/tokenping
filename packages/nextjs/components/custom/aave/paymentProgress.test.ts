import { describe, expect, it } from "vitest";
import { type PaymentWrite, getPaymentProgress } from "~~/components/custom/aave/paymentProgress";

const STARTED_AT = 1_000;

const write = (
  functionName: string,
  status: PaymentWrite["status"],
  submittedAt: number,
  hash?: string,
): PaymentWrite => ({
  functionName,
  status,
  submittedAt,
  hash,
});

describe("getPaymentProgress", () => {
  it("is preparing until the flow asks the wallet for anything", () => {
    expect(getPaymentProgress([], STARTED_AT)).toEqual({ step: "preparing", approveSkipped: false });
  });

  it("ignores writes from before the flow started, and other contract calls", () => {
    const writes = [write("pay", "success", STARTED_AT - 1, "0xold"), write("setGreeting", "pending", STARTED_AT + 5)];

    expect(getPaymentProgress(writes, STARTED_AT)).toEqual({ step: "preparing", approveSkipped: false });
  });

  it.each([
    ["pending", "approve-sign", undefined],
    ["success", "approve-pending", "0xa"],
  ] as const)("reads an approval that is %s as %s", (status, step, hash) => {
    expect(getPaymentProgress([write("approve", status, STARTED_AT + 1, hash)], STARTED_AT)).toEqual({
      step,
      approveHash: hash,
      approveSkipped: false,
    });
  });

  it.each([
    ["pending", "pay-sign", undefined],
    ["success", "pay-pending", "0xp"],
  ] as const)("reads a payment that is %s as %s, with the approval done", (status, step, hash) => {
    const writes = [write("approve", "success", STARTED_AT + 1, "0xa"), write("pay", status, STARTED_AT + 2, hash)];

    expect(getPaymentProgress(writes, STARTED_AT)).toEqual({
      step,
      approveHash: "0xa",
      payHash: hash,
      approveSkipped: false,
    });
  });

  it("marks the approval skipped when the payment came without one", () => {
    expect(getPaymentProgress([write("pay", "pending", STARTED_AT + 1)], STARTED_AT)).toMatchObject({
      step: "pay-sign",
      approveSkipped: true,
    });
  });

  // A rejected or failed request used to read as "approval submitted" or "payment submitted".
  it.each([
    ["approval", [write("approve", "error", STARTED_AT + 1)], undefined],
    ["payment", [write("approve", "success", STARTED_AT + 1, "0xa"), write("pay", "error", STARTED_AT + 2)], "0xa"],
  ] as const)("never reads a rejected or failed %s as submitted", (_label, writes, approveHash) => {
    const progress = getPaymentProgress(writes, STARTED_AT);

    expect(progress.step).toBe("failed");
    expect(progress.approveHash).toBe(approveHash);
  });

  it("follows the latest attempt when a step was retried within the flow", () => {
    const writes = [write("approve", "error", STARTED_AT + 1), write("approve", "pending", STARTED_AT + 2)];

    expect(getPaymentProgress(writes, STARTED_AT).step).toBe("approve-sign");
  });
});
