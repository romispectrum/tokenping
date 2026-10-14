import { describe, expect, it } from "vitest";
import { normalizeAddress } from "~~/utils/address";

describe("normalizeAddress", () => {
  it("lowercases a checksummed address", () => {
    expect(normalizeAddress("0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045")).toBe(
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    );
  });

  it("trims surrounding whitespace, including newlines and tabs", () => {
    expect(normalizeAddress("  \t0xABC\n ")).toBe("0xabc");
  });

  it("keeps inner whitespace and does not validate the address", () => {
    expect(normalizeAddress(" Not An Address ")).toBe("not an address");
  });

  it("returns an empty string for empty or blank input", () => {
    expect(normalizeAddress("")).toBe("");
    expect(normalizeAddress("   ")).toBe("");
  });

  it("is idempotent", () => {
    const once = normalizeAddress(" 0xAbC ");
    expect(normalizeAddress(once)).toBe(once);
  });
});
