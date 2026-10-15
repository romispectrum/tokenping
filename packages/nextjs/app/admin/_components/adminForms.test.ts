import { describe, expect, it } from "vitest";
import {
  parseMaxDuration,
  parseNativeWithdraw,
  parseNewOwner,
  parsePlanForm,
  parseTokenWithdraw,
} from "~~/app/admin/_components/adminForms";

const TOKEN = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const CHECKSUMMED = "0x79872d7529cfE1c062838fACDA004Ce4BFB16553";
// Mixed case with a wrong EIP-55 checksum: viem's strict isAddress rejects it.
const BAD_CHECKSUM = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const DESTINATION = "0x2222222222222222222222222222222222222222";
const DECIMALS_UNKNOWN = {
  error: "The token decimals have not loaded. Wait for them, or check the token address.",
  field: "tokenAddress",
};
const TOKEN_ADDRESS_ERROR = { error: "Enter the token address as a full 0x address.", field: "tokenAddress" };

describe("parsePlanForm", () => {
  const form = { tokenAddress: TOKEN, price: "1.5", durationSeconds: "2592000", enabled: true };

  it("parses the setPlan args with the token's decimals", () => {
    expect(parsePlanForm(form, 6)).toEqual({ value: [TOKEN, 1_500_000n, 2_592_000n, true] });
    expect(parsePlanForm({ ...form, price: "10", enabled: false }, 18)).toEqual({
      value: [TOKEN, 10_000_000_000_000_000_000n, 2_592_000n, false],
    });
  });

  // Regression (B2.4): unknown decimals used to fall back to 6, so "10" of an 18-decimals token became 1e-11 tokens.
  it("refuses to scale the price while the token decimals are unknown", () => {
    expect(parsePlanForm({ ...form, price: "10" }, undefined)).toEqual(DECIMALS_UNKNOWN);
  });

  it("checks the token address before the decimals", () => {
    expect(parsePlanForm({ ...form, tokenAddress: "0x123" }, undefined)).toEqual(TOKEN_ADDRESS_ERROR);
  });

  it("uses zero decimals as reported", () => {
    expect(parsePlanForm({ ...form, price: "5" }, 0)).toEqual({ value: [TOKEN, 5n, 2_592_000n, true] });
  });

  it.each(["", "0x123", BAD_CHECKSUM])("rejects the token address %j before anything else", tokenAddress => {
    expect(parsePlanForm({ tokenAddress, price: "", durationSeconds: "", enabled: true }, 6)).toEqual(
      TOKEN_ADDRESS_ERROR,
    );
  });

  it.each([
    ["price", { price: "" }, { error: "Enter a price, like 1.5.", field: "price" }],
    [
      "duration",
      { durationSeconds: "" },
      { error: "Enter a duration in seconds, like 2592000.", field: "durationSeconds" },
    ],
    [
      "price before the duration",
      { price: "", durationSeconds: "" },
      { error: "Enter a price, like 1.5.", field: "price" },
    ],
  ])("requires the %s", (_label, patch, expected) => {
    expect(parsePlanForm({ ...form, ...patch }, 6)).toEqual(expected);
  });

  const PRICE_INVALID = { error: "Enter the price as a number, like 1.5.", field: "price" };
  const DURATION_INVALID = { error: "Enter the duration as whole seconds, digits only.", field: "durationSeconds" };

  it.each([
    ["a non-numeric price", { price: "abc" }, PRICE_INVALID],
    ["a fractional duration", { durationSeconds: "1.5" }, DURATION_INVALID],
    ["an exponent duration", { durationSeconds: "1e3" }, DURATION_INVALID],
    ["a thousands-separated duration", { durationSeconds: "2,592,000" }, DURATION_INVALID],
  ])("rejects %s at its field", (_label, patch, expected) => {
    expect(parsePlanForm({ ...form, ...patch }, 6)).toEqual(expected);
  });

  it("accepts what parseUnits and BigInt accept", () => {
    expect(parsePlanForm({ ...form, price: "-1", durationSeconds: " 60 " }, 6)).toEqual({
      value: [TOKEN, -1_000_000n, 60n, true],
    });
    expect(parsePlanForm({ ...form, price: "1.0000005", durationSeconds: "0x10" }, 6)).toEqual({
      value: [TOKEN, 1_000_001n, 16n, true],
    });
  });
});

describe("parseMaxDuration", () => {
  it("parses whole seconds", () => {
    expect(parseMaxDuration("31536000")).toEqual({ value: 31_536_000n });
    expect(parseMaxDuration("-1")).toEqual({ value: -1n });
  });

  it("requires a value", () => {
    expect(parseMaxDuration("")).toEqual({
      error: "Enter a max duration in seconds, like 31536000.",
      field: "maxDurationSeconds",
    });
  });

  it.each(["abc", "1.5"])("rejects %j", raw => {
    expect(parseMaxDuration(raw)).toEqual({
      error: "Enter the max duration as whole seconds, digits only.",
      field: "maxDurationSeconds",
    });
  });
});

describe("parseNativeWithdraw", () => {
  it("parses the destination and the ETH amount", () => {
    expect(parseNativeWithdraw({ to: DESTINATION, amountEth: "1.25" })).toEqual({
      value: [DESTINATION, 1_250_000_000_000_000_000n],
    });
  });

  it.each(["", " " + DESTINATION, BAD_CHECKSUM])("rejects the destination %j first", to => {
    expect(parseNativeWithdraw({ to, amountEth: "" })).toEqual({
      error: "Enter the destination as a full 0x address.",
      field: "to",
    });
  });

  it("requires an amount", () => {
    expect(parseNativeWithdraw({ to: DESTINATION, amountEth: "" })).toEqual({
      error: "Enter an amount in ETH, like 0.5.",
      field: "amountEth",
    });
  });

  it("rejects a non-numeric amount", () => {
    expect(parseNativeWithdraw({ to: DESTINATION, amountEth: "one" })).toEqual({
      error: "Enter the amount as a number, like 0.5.",
      field: "amountEth",
    });
  });
});

describe("parseTokenWithdraw", () => {
  const form = { tokenAddress: TOKEN, to: DESTINATION, amount: "12.5" };

  it("parses the token, destination and amount with the token's decimals", () => {
    expect(parseTokenWithdraw(form, 6)).toEqual({ value: [TOKEN, DESTINATION, 12_500_000n] });
    expect(parseTokenWithdraw(form, 18)).toEqual({ value: [TOKEN, DESTINATION, 12_500_000_000_000_000_000n] });
  });

  // Regression (B2.4): same former 6-decimals fallback as the plan form.
  it("refuses to scale the amount while the token decimals are unknown", () => {
    expect(parseTokenWithdraw(form, undefined)).toEqual(DECIMALS_UNKNOWN);
  });

  it("checks the token address before the decimals", () => {
    expect(parseTokenWithdraw({ ...form, tokenAddress: "" }, undefined)).toEqual(TOKEN_ADDRESS_ERROR);
  });

  it("checks the token, then the destination, then the amount", () => {
    expect(parseTokenWithdraw({ tokenAddress: "", to: "", amount: "" }, 6)).toEqual(TOKEN_ADDRESS_ERROR);
    expect(parseTokenWithdraw({ ...form, to: CHECKSUMMED.toLowerCase().slice(0, 41), amount: "" }, 6)).toEqual({
      error: "Enter the destination as a full 0x address.",
      field: "to",
    });
    expect(parseTokenWithdraw({ ...form, amount: "" }, 6)).toEqual({
      error: "Enter an amount, like 10.",
      field: "amount",
    });
  });

  it("rejects a non-numeric amount", () => {
    expect(parseTokenWithdraw({ ...form, amount: "1,5" }, 6)).toEqual({
      error: "Enter the amount as a number, like 10.",
      field: "amount",
    });
  });
});

describe("parseNewOwner", () => {
  it.each([DESTINATION, CHECKSUMMED, CHECKSUMMED.toLowerCase()])("accepts %s", address => {
    expect(parseNewOwner(address)).toEqual({ value: address });
  });

  it.each(["", "0x123", BAD_CHECKSUM, `${DESTINATION} `])("rejects %j", address => {
    expect(parseNewOwner(address)).toEqual({ error: "Enter the new owner as a full 0x address.", field: "newOwner" });
  });
});
