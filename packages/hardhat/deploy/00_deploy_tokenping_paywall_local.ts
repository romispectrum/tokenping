import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployTokenpingPaywallCore } from "./shared/deployTokenpingPaywallCore";

const LOCAL_CHAIN_ID = 31337;

const deployTokenpingPaywallLocal: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const chainId = Number(await hre.getChainId());

  if (chainId !== LOCAL_CHAIN_ID) {
    throw new Error(
      `Local deploy script only supports chainId=${LOCAL_CHAIN_ID}. Received chainId=${chainId}. Use --deploy-mode production.`,
    );
  }

  await deployTokenpingPaywallCore({
    hre,
    mode: "local",
    config: {
      profileName: "local",
      planDurationDays: 30,
      maxDurationDays: 365,
      planPrice: hre.ethers.parseUnits("3", 6),
      paymentToken: {
        mode: "mock",
        label: "MockUSDC",
        mintRecipient: "0x4f57c97f76E8d1C889eaA74A02E150BE1e0EDe25",
        mintAmount: hre.ethers.parseUnits("10000", 6),
      },
    },
  });
};

export default deployTokenpingPaywallLocal;
deployTokenpingPaywallLocal.tags = ["TokenpingPaywallLocal"];
