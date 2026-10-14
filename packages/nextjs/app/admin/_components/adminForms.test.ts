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

describe("parsePlanForm", () => {
  const form = { tokenAddress: TOKEN, price: "1.5", durationSeconds: "2592000", enabled: true };

  it("parses the setPlan args with the token's decimals", () => {
    expect(parsePlanForm(form, 6)).toEqual({ value: [TOKEN, 1_500_000n, 2_592_000n, true] });
    expect(parsePlanForm({ ...form, price: "10", enabled: false }, 18)).toEqual({
      value: [TOKEN, 10_000_000_000_000_000_000n, 2_592_000n, false],
    });
  });

  // BUG(B2.4): while decimals are unknown the price is scaled with 6 decimals, whatever the token really uses.
  it("falls back to 6 decimals when the decimals read has no data", () => {
    expect(parsePlanForm({ ...form, price: "10" })).toEqual({ value: [TOKEN, 10_000_000n, 2_592_000n, true] });
  });

  it("uses zero decimals as reported", () => {
    expect(parsePlanForm({ ...form, price: "5" }, 0)).toEqual({ value: [TOKEN, 5n, 2_592_000n, true] });
  });

  it.each(["", "0x123", BAD_CHECKSUM])("rejects the token address %j before anything else", tokenAddress => {
    expect(parsePlanForm({ tokenAddress, price: "", durationSeconds: "", enabled: true }, 6)).toEqual({
      error: "Enter a valid token address for plan update",
    });
  });

  it.each([
    ["price", { price: "" }],
    ["duration", { durationSeconds: "" }],
  ])("requires the %s", (_label, patch) => {
    expect(parsePlanForm({ ...form, ...patch }, 6)).toEqual({ error: "Enter plan price and duration" });
  });

  it.each([
    ["a non-numeric price", { price: "abc" }],
    ["a fractional duration", { durationSeconds: "1.5" }],
    ["an exponent duration", { durationSeconds: "1e3" }],
  ])("rejects %s", (_label, patch) => {
    expect(parsePlanForm({ ...form, ...patch }, 6)).toEqual({ error: "Invalid plan values" });
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
    expect(parseMaxDuration("")).toEqual({ error: "Enter max duration in seconds" });
  });

  it.each(["abc", "1.5"])("rejects %j", raw => {
    expect(parseMaxDuration(raw)).toEqual({ error: "Invalid max duration" });
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
      error: "Enter a valid destination address for native withdraw",
    });
  });

  it("requires an amount", () => {
    expect(parseNativeWithdraw({ to: DESTINATION, amountEth: "" })).toEqual({ error: "Enter native amount in ETH" });
  });

  it("rejects a non-numeric amount", () => {
    expect(parseNativeWithdraw({ to: DESTINATION, amountEth: "one" })).toEqual({ error: "Invalid ETH amount" });
  });
});

describe("parseTokenWithdraw", () => {
  const form = { tokenAddress: TOKEN, to: DESTINATION, amount: "12.5" };

  it("parses the token, destination and amount with the token's decimals", () => {
    expect(parseTokenWithdraw(form, 6)).toEqual({ value: [TOKEN, DESTINATION, 12_500_000n] });
    expect(parseTokenWithdraw(form, 18)).toEqual({ value: [TOKEN, DESTINATION, 12_500_000_000_000_000_000n] });
  });

  // BUG(B2.4): same 6-decimals fallback as the plan form.
  it("falls back to 6 decimals when the decimals read has no data", () => {
    expect(parseTokenWithdraw(form)).toEqual({ value: [TOKEN, DESTINATION, 12_500_000n] });
  });

  it("checks the token, then the destination, then the amount", () => {
    expect(parseTokenWithdraw({ tokenAddress: "", to: "", amount: "" }, 6)).toEqual({
      error: "Enter a valid token address",
    });
    expect(parseTokenWithdraw({ ...form, to: CHECKSUMMED.toLowerCase().slice(0, 41), amount: "" }, 6)).toEqual({
      error: "Enter a valid destination address for token withdraw",
    });
    expect(parseTokenWithdraw({ ...form, amount: "" }, 6)).toEqual({ error: "Enter token amount" });
  });

  it("rejects a non-numeric amount", () => {
    expect(parseTokenWithdraw({ ...form, amount: "1,5" }, 6)).toEqual({ error: "Invalid token amount" });
  });
});

describe("parseNewOwner", () => {
  it.each([DESTINATION, CHECKSUMMED, CHECKSUMMED.toLowerCase()])("accepts %s", address => {
    expect(parseNewOwner(address)).toEqual({ value: address });
  });

  it.each(["", "0x123", BAD_CHECKSUM, `${DESTINATION} `])("rejects %j", address => {
    expect(parseNewOwner(address)).toEqual({ error: "Enter a valid new owner address" });
  });
});
