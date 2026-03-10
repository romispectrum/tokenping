import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const ERC1967_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

const getImplementationFromSlot = async (hre: HardhatRuntimeEnvironment, proxyAddress: string) => {
  const rawSlotValue = await hre.ethers.provider.getStorage(proxyAddress, ERC1967_IMPLEMENTATION_SLOT);
  return hre.ethers.getAddress(`0x${rawSlotValue.slice(-40)}`);
};

const upgradeTokenpingPaywallImplementation: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = Number(await hre.getChainId());

  const paywallDeployment = await hre.deployments.getOrNull("TokenpingPaywall");
  if (!paywallDeployment) {
    throw new Error(
      "Missing TokenpingPaywall proxy deployment. Run the deploy script first so the proxy address is saved in deployments.",
    );
  }

  const proxyAddress = paywallDeployment.address;
  const proxyCode = await hre.ethers.provider.getCode(proxyAddress);
  if (!proxyCode || proxyCode === "0x") {
    throw new Error(`No contract code at saved proxy address: ${proxyAddress}`);
  }

  console.log("\n🔄 Upgrading TokenpingPaywall implementation...");
  console.log("Network:", hre.network.name, `(chainId=${chainId})`);
  console.log("Deployer:", deployer);
  console.log("Proxy:", proxyAddress);

  const implementationBefore = await getImplementationFromSlot(hre, proxyAddress);
  console.log("Current implementation:", implementationBefore);

  const implementationDeployment = await deploy("TokenpingPaywall_Implementation", {
    from: deployer,
    contract: "TokenpingPaywall",
    args: [],
    log: true,
    autoMine: true,
  });

  const newImplementationAddress = implementationDeployment.address;
  console.log("New implementation candidate:", newImplementationAddress);

  if (implementationBefore.toLowerCase() === newImplementationAddress.toLowerCase()) {
    console.log("ℹ️  Implementation is already up to date. Skipping upgrade transaction.");
    return;
  }

  const deployerSigner = await hre.ethers.getSigner(deployer);
  const paywall = await hre.ethers.getContractAt("TokenpingPaywall", proxyAddress, deployerSigner);
  const owner = await paywall.owner();
  if (owner.toLowerCase() !== deployer.toLowerCase()) {
    throw new Error(`Only owner can upgrade. Contract owner=${owner}, deployer=${deployer}`);
  }

  const upgradeTx = await paywall.upgradeToAndCall(newImplementationAddress, "0x");
  const upgradeReceipt = await upgradeTx.wait();
  if (!upgradeReceipt) {
    throw new Error("Upgrade transaction receipt missing");
  }

  const implementationAfter = await getImplementationFromSlot(hre, proxyAddress);
  if (implementationAfter.toLowerCase() !== newImplementationAddress.toLowerCase()) {
    throw new Error(
      `Upgrade verification failed. Implementation slot=${implementationAfter}, expected=${newImplementationAddress}`,
    );
  }

  await hre.deployments.save("TokenpingPaywall", {
    ...paywallDeployment,
    address: proxyAddress,
    implementation: newImplementationAddress,
    abi: implementationDeployment.abi,
    transactionHash: upgradeReceipt.hash,
    receipt: upgradeReceipt,
  });

  console.log("✅ Upgrade complete");
  console.log("Proxy:", proxyAddress);
  console.log("Implementation (before):", implementationBefore);
  console.log("Implementation (after):", implementationAfter);
};

export default upgradeTokenpingPaywallImplementation;
upgradeTokenpingPaywallImplementation.tags = ["TokenpingPaywallUpgrade"];
