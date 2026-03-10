import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ARBITRUM_USDC, getNetworkDeployConfig } from "./network-config";
import { deployTokenpingPaywallCore } from "./shared/deployTokenpingPaywallCore";

const MAINNET_CHAIN_ID = 1;
const ARBITRUM_CHAIN_ID = 42161;

const deployTokenpingPaywallProduction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const chainId = Number(await hre.getChainId());

  if (chainId !== MAINNET_CHAIN_ID && chainId !== ARBITRUM_CHAIN_ID) {
    throw new Error(
      `Production deploy script only supports chainId=${MAINNET_CHAIN_ID} (mainnet) and chainId=${ARBITRUM_CHAIN_ID} (arbitrum). Received chainId=${chainId}.`,
    );
  }

  const networkConfig = getNetworkDeployConfig(chainId);

  if (networkConfig.paymentToken.mode !== "canonical") {
    throw new Error(`Production config must use canonical payment token. Profile=${networkConfig.name}`);
  }

  if (
    chainId === ARBITRUM_CHAIN_ID &&
    networkConfig.paymentToken.address.toLowerCase() !== ARBITRUM_USDC.toLowerCase()
  ) {
    throw new Error(
      `Safety check failed: expected Arbitrum USDC ${ARBITRUM_USDC}, got ${networkConfig.paymentToken.address}`,
    );
  }

  await deployTokenpingPaywallCore({
    hre,
    mode: "production",
    config: {
      profileName: networkConfig.name,
      averageBlockTimeSeconds: networkConfig.averageBlockTimeSeconds,
      planDurationDays: networkConfig.planDurationDays,
      maxDurationDays: networkConfig.maxDurationDays,
      planPrice: hre.ethers.parseUnits("3", 6),
      paymentToken: {
        mode: "canonical",
        label: networkConfig.paymentToken.label,
        address: networkConfig.paymentToken.address,
      },
    },
  });
};

export default deployTokenpingPaywallProduction;
deployTokenpingPaywallProduction.tags = ["TokenpingPaywallProduction"];
