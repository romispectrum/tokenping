import { describe, expect, it } from "vitest";
import { findTokenPlan, selectPaymentPlan } from "~~/services/payments/plans";

const TOKEN_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TOKEN_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TOKEN_C = "0xcccccccccccccccccccccccccccccccccccccccc";

const success = (price: bigint, durationSeconds: bigint, enabled: boolean) =>
  ({ status: "success", result: [price, durationSeconds, enabled] }) as const;
const failure = { status: "failure" } as const;

describe("selectPaymentPlan", () => {
  it("returns null while the reads are loading", () => {
    expect(selectPaymentPlan(undefined, [TOKEN_A])).toBeNull();
  });

  it("returns null without candidates, even with results", () => {
    expect(selectPaymentPlan([success(1n, 1n, true)], [])).toBeNull();
  });

  it("returns null when every read failed", () => {
    expect(selectPaymentPlan([failure, failure], [TOKEN_A, TOKEN_B])).toBeNull();
  });

  it("picks the first purchasable plan over earlier unpurchasable ones", () => {
    expect(
      selectPaymentPlan(
        [success(5n, 10n, false), success(0n, 10n, true), success(5n, 0n, true), success(7n, 30n, true)],
        [TOKEN_A, TOKEN_B, TOKEN_C, TOKEN_A],
      ),
    ).toEqual({ token: TOKEN_A, plan: { price: 7n, durationSeconds: 30n, enabled: true } });
  });

  it("falls back to the first successfully read plan when none is purchasable", () => {
    expect(
      selectPaymentPlan([failure, success(0n, 0n, false), success(9n, 0n, true)], [TOKEN_A, TOKEN_B, TOKEN_C]),
    ).toEqual({ token: TOKEN_B, plan: { price: 0n, durationSeconds: 0n, enabled: false } });
  });

  it("keeps the candidate index of each result when earlier reads failed", () => {
    expect(selectPaymentPlan([failure, success(1n, 2n, true)], [TOKEN_A, TOKEN_B])).toEqual({
      token: TOKEN_B,
      plan: { price: 1n, durationSeconds: 2n, enabled: true },
    });
  });
});

describe("findTokenPlan", () => {
  it("returns the plan read for the token, whatever its state", () => {
    expect(findTokenPlan([success(1n, 2n, true), success(0n, 0n, false)], [TOKEN_A, TOKEN_B], TOKEN_B)).toEqual({
      price: 0n,
      durationSeconds: 0n,
      enabled: false,
    });
  });

  it("matches the token address case-insensitively", () => {
    expect(findTokenPlan([success(1n, 2n, true)], [TOKEN_A], TOKEN_A.toUpperCase().replace("0X", "0x"))).toEqual({
      price: 1n,
      durationSeconds: 2n,
      enabled: true,
    });
  });

  it.each([
    ["the reads are loading", undefined, TOKEN_A],
    ["the token's read failed", [success(1n, 2n, true), failure], TOKEN_B],
    ["the token is not a candidate", [success(1n, 2n, true)], TOKEN_C],
    ["the token has no result", [success(1n, 2n, true)], TOKEN_B],
  ] as const)("returns null when %s", (_label, results, token) => {
    expect(findTokenPlan(results, [TOKEN_A, TOKEN_B], token)).toBeNull();
  });
});
