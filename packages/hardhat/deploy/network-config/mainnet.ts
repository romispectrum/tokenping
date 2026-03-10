import { NetworkDeployConfig } from "./types";

export const MAINNET_USDC = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const mainnetDeployConfig: NetworkDeployConfig = {
  chainId: 1,
  name: "mainnet",
  averageBlockTimeSeconds: 12,
  planDurationDays: 30,
  maxDurationDays: 365,
  paymentToken: {
    mode: "canonical",
    label: "USDC (Ethereum Mainnet)",
    address: MAINNET_USDC,
  },
};
