import { NetworkDeployConfig } from "./types";

export const MAINNET_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export const mainnetDeployConfig: NetworkDeployConfig = {
  chainId: 1,
  name: "mainnet",
  planDurationDays: 30,
  maxDurationDays: 365,
  paymentToken: {
    mode: "canonical",
    label: "USDC (Ethereum Mainnet)",
    address: MAINNET_USDC,
  },
};
