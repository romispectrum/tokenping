import { describe, expect, it } from "vitest";
import { shortenHex, toDisplayAddress } from "~~/components/custom/aave/web3Format";

const ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("shortenHex", () => {
  it("keeps 6 + 4 characters around three ASCII dots by default", () => {
    expect(shortenHex(ADDRESS)).toBe("0xd8dA...6045");
  });

  it("takes other lengths for transaction hashes", () => {
    const hash = `0x${"ab".repeat(32)}`;
    expect(shortenHex(hash, { start: 10, end: 8 })).toBe("0xabababab...abababab");
  });

  it("leaves a value that would not get shorter", () => {
    expect(shortenHex("0xapprove", { start: 10, end: 8 })).toBe("0xapprove");
  });
});

describe("toDisplayAddress", () => {
  it("checksums a lowercased address", () => {
    expect(toDisplayAddress(ADDRESS.toLowerCase())).toBe(ADDRESS);
  });

  it("returns anything that is not an address unchanged", () => {
    expect(toDisplayAddress("not an address")).toBe("not an address");
  });
});
