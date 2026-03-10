import { arbitrumDeployConfig } from "./arbitrum";
import { mainnetDeployConfig } from "./mainnet";
import { NetworkDeployConfig } from "./types";

const deployConfigByChainId: Record<number, NetworkDeployConfig> = {
  [mainnetDeployConfig.chainId]: mainnetDeployConfig,
  [arbitrumDeployConfig.chainId]: arbitrumDeployConfig,
};

/**
 * Returns explicit config for supported networks only.
 */
export const getNetworkDeployConfig = (chainId: number): NetworkDeployConfig => {
  const config = deployConfigByChainId[chainId];
  if (!config) {
    throw new Error(
      `Unsupported network chainId=${chainId}. Add a config file in deploy/network-config before deploying.`,
    );
  }

  return config;
};

export { ARBITRUM_USDC } from "./arbitrum";
