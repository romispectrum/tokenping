import { arbitrum, base, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { PAYMENT_CHAIN_ID } from "~~/constants/payments";
import scaffoldConfig from "~~/scaffold.config";
import { findChainName, getPaymentChainName } from "~~/services/marketing/paymentChain";

describe("getPaymentChainName", () => {
  it("names the configured payment network", () => {
    expect(getPaymentChainName()).toBe(scaffoldConfig.targetNetworks.find(({ id }) => id === PAYMENT_CHAIN_ID)?.name);
    // scaffold.config.ts targets Arbitrum One, where TokenpingPaywall is deployed.
    expect(getPaymentChainName()).toBe("Arbitrum One");
  });
});

describe("findChainName", () => {
  it("follows the payment chain when the target networks change", () => {
    expect(findChainName(base.id, [mainnet, base])).toBe("Base");
    expect(findChainName(mainnet.id, [mainnet, arbitrum])).toBe("Ethereum");
  });

  it("is undefined without a payment chain, or when the chain is not a target network", () => {
    expect(findChainName(undefined, [arbitrum])).toBeUndefined();
    expect(findChainName(base.id, [arbitrum])).toBeUndefined();
  });
});
