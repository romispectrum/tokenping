import { NetworkDeployConfig } from "./types";

export const ARBITRUM_USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

export const arbitrumDeployConfig: NetworkDeployConfig = {
  chainId: 42161,
  name: "arbitrum",
  planDurationDays: 30,
  maxDurationDays: 365,
  paymentToken: {
    mode: "canonical",
    label: "USDC (Arbitrum One)",
    address: ARBITRUM_USDC,
  },
};
