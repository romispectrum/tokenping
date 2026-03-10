import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys TokenpingPaywall (UUPS proxy) and MockUSDC.
 * - TokenpingPaywall: initialize(initialOwner, averageBlockTime, maxDurationBlocks)
 * - Mints 10000 USDC to a recipient and configures a plan (e.g. 3 USDC for ~1 month).
 */
const deployTokenpingPaywall: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const MINT_RECIPIENT = "0x4f57c97f76E8d1C889eaA74A02E150BE1e0EDe25";
  const MINT_AMOUNT = hre.ethers.parseUnits("10000", 6);
  const PLAN_PRICE = hre.ethers.parseUnits("3", 6);
  const PLAN_DURATION_BLOCKS = 216000; // ~30 days @ 12s blocks
  const AVERAGE_BLOCK_TIME = 12;
  const MAX_DURATION_BLOCKS = 2_628_000; // ~1 year @ 12s/block

  console.log("\n📦 Deploying TokenpingPaywall + MockUSDC...");
  console.log("Deployer:", deployer);
  console.log("Mint recipient:", MINT_RECIPIENT);

  // 1. Deploy MockUSDC
  console.log("\n1️⃣  Deploying MockUSDC...");
  const mockUSDC = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  if (mockUSDC.newlyDeployed) {
    const mockUSDCContract = await hre.ethers.getContract<Contract>("MockUSDC", deployer);
    console.log(`\n2️⃣  Minting ${hre.ethers.formatUnits(MINT_AMOUNT, 6)} USDC to ${MINT_RECIPIENT}...`);
    const mintTx = await mockUSDCContract.mint(MINT_RECIPIENT, MINT_AMOUNT, { gasLimit: 1_000_000n });
    await mintTx.wait();
    const balance = await mockUSDCContract.balanceOf(MINT_RECIPIENT);
    console.log("✅ Mint confirmed. Balance:", hre.ethers.formatUnits(balance, 6), "USDC");
  } else {
    console.log("ℹ️  MockUSDC already deployed at:", mockUSDC.address);
  }

  // 2. Deploy TokenpingPaywall (UUPS proxy)
  const existingPaywall = await hre.deployments.getOrNull("TokenpingPaywall");
  let proxyAddress: string;
  let implementationAddress: string;
  let shouldDeployPaywall = !existingPaywall;

  if (existingPaywall) {
    proxyAddress = existingPaywall.address;
    const code = await hre.ethers.provider.getCode(proxyAddress);
    if (!code || code === "0x") {
      console.log("\n⚠️  Saved deployment has no code at proxy address. Redeploying...");
      await hre.deployments.delete("TokenpingPaywall");
      const proxyArtifact = await hre.deployments.getOrNull("TokenpingPaywallProxy");
      if (proxyArtifact) await hre.deployments.delete("TokenpingPaywallProxy");
      const implArtifact = await hre.deployments.getOrNull("TokenpingPaywall_Implementation");
      if (implArtifact) await hre.deployments.delete("TokenpingPaywall_Implementation");
      shouldDeployPaywall = true;
    } else {
      implementationAddress = (existingPaywall as { implementation?: string }).implementation ?? "unknown";
      console.log("\nℹ️  TokenpingPaywall already deployed at:", proxyAddress);
    }
  }

  if (shouldDeployPaywall) {
    console.log("\n3️⃣  Deploying TokenpingPaywall implementation...");
    const implementation = await deploy("TokenpingPaywall_Implementation", {
      from: deployer,
      contract: "TokenpingPaywall",
      args: [],
      log: true,
      autoMine: true,
    });
    implementationAddress = implementation.address;

    console.log("\n4️⃣  Deploying ERC1967Proxy (TokenpingPaywall proxy)...");
    const TokenpingPaywallFactory = await hre.ethers.getContractFactory("TokenpingPaywall");
    const initData = TokenpingPaywallFactory.interface.encodeFunctionData("initialize", [
      deployer,
      AVERAGE_BLOCK_TIME,
      MAX_DURATION_BLOCKS,
    ]);

    const proxyDeployment = await deploy("TokenpingPaywallProxy", {
      from: deployer,
      contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      args: [implementationAddress, initData],
      log: true,
      autoMine: true,
      gasLimit: 5_000_000,
    });
    proxyAddress = proxyDeployment.address;

    await hre.deployments.save("TokenpingPaywall", {
      address: proxyAddress,
      implementation: implementationAddress,
      abi: implementation.abi,
      receipt: proxyDeployment.receipt,
      transactionHash: proxyDeployment.transactionHash,
    });
    console.log("✅ TokenpingPaywall proxy:", proxyAddress);
    console.log("✅ Implementation:", implementationAddress);
  }

  // 3. Verify and configure plan
  console.log("\n5️⃣  Verifying deployment...");
  const deployerSigner = await hre.ethers.getSigner(deployer);
  const paywall = await hre.ethers.getContractAt("TokenpingPaywall", proxyAddress!, deployerSigner);
  console.log("✅ Owner:", await paywall.owner());
  console.log("✅ Paused:", await paywall.paused());

  console.log("\n6️⃣  Configuring plan for MockUSDC...");
  const currentPlan = await paywall.plans(mockUSDC.address);
  const currentPrice = currentPlan.price ?? currentPlan[0];
  const currentDuration = currentPlan.durationBlocks ?? currentPlan[1];
  const currentEnabled = currentPlan.enabled ?? currentPlan[2];

  if (currentPrice !== PLAN_PRICE || Number(currentDuration) !== PLAN_DURATION_BLOCKS || currentEnabled !== true) {
    const tx = await paywall.setPlan(mockUSDC.address, PLAN_PRICE, PLAN_DURATION_BLOCKS, true, {
      gasLimit: 1_000_000n,
    });
    await tx.wait();
    console.log(
      "✅ Plan set:",
      hre.ethers.formatUnits(PLAN_PRICE, 6),
      "USDC /",
      PLAN_DURATION_BLOCKS,
      "blocks (~30 days)",
    );
  } else {
    console.log("ℹ️  Plan already configured");
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("MockUSDC:", mockUSDC.address);
  console.log("TokenpingPaywall (proxy):", proxyAddress);
  console.log("TokenpingPaywall (implementation):", implementationAddress);
  console.log("Plan:", hre.ethers.formatUnits(PLAN_PRICE, 6), "USDC /", PLAN_DURATION_BLOCKS, "blocks");
  console.log("=".repeat(60) + "\n");
};

export default deployTokenpingPaywall;
deployTokenpingPaywall.tags = ["TokenpingPaywall", "MockUSDC"];
