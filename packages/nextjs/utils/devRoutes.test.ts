import { arbitrum, hardhat, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { areDevRoutesEnabled } from "~~/utils/devRoutes";

describe("areDevRoutesEnabled", () => {
  it("is off for the production target networks", () => {
    expect(areDevRoutesEnabled()).toBe(false);
    expect(areDevRoutesEnabled([arbitrum, mainnet])).toBe(false);
  });

  it("is on whenever the local hardhat chain is a target", () => {
    expect(areDevRoutesEnabled([hardhat])).toBe(true);
    expect(areDevRoutesEnabled([arbitrum, hardhat])).toBe(true);
  });
});
