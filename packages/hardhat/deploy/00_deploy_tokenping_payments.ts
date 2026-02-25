import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys TokenpingPayments (UUPS proxy) and MockUSDC
 * Mints 10000 USDC to a specific address
 * Configures plan: 3 USDC for ~1 month
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployTokenpingContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Address to receive the minted USDC tokens
  const MINT_RECIPIENT = "0x4f57c97f76E8d1C889eaA74A02E150BE1e0EDe25"; // Hardhat account #0
  const MINT_AMOUNT = hre.ethers.parseUnits("10000", 6); // 10000 USDC (6 decimals)
  const PLAN_PRICE = hre.ethers.parseUnits("3", 6); // 3 USDC (6 decimals)
  const PLAN_DURATION_BLOCKS = 216000; // ~30 days @ 12s blocks (30*24*60*60/12)

  console.log("\n📦 Deploying contracts...");
  console.log("Deployer:", deployer);
  console.log("Mint recipient:", MINT_RECIPIENT);
  console.log("Mint amount: 10000 USDC\n");

  // 1. Deploy MockUSDC
  console.log("1️⃣  Deploying MockUSDC...");
  const mockUSDC = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  if (mockUSDC.newlyDeployed) {
    console.log("✅ MockUSDC deployed at:", mockUSDC.address);

    // Get the contract instance to mint tokens
    const mockUSDCContract = await hre.ethers.getContract<Contract>("MockUSDC", deployer);

    // Mint 10000 USDC to the specified address
    console.log(`\n2️⃣  Minting ${hre.ethers.formatUnits(MINT_AMOUNT, 6)} USDC to ${MINT_RECIPIENT}...`);
    // Some local nodes enforce a tx gas cap (~16.7M). Mint is cheap, so pin a safe limit.
    const mintTx = await mockUSDCContract.mint(MINT_RECIPIENT, MINT_AMOUNT, { gasLimit: 1_000_000n });
    await mintTx.wait();
    console.log("✅ Mint transaction confirmed:", mintTx.hash);

    // Verify the balance
    const balance = await mockUSDCContract.balanceOf(MINT_RECIPIENT);
    console.log(`✅ Balance verified: ${hre.ethers.formatUnits(balance, 6)} USDC`);
  } else {
    console.log("ℹ️  MockUSDC already deployed at:", mockUSDC.address);
  }

  // 2. Deploy TokenpingPayments (idempotent)
  const existingSubscription = await hre.deployments.getOrNull("TokenpingPayments");
  let proxyAddress: string;
  let implementationAddress: string;
  let shouldDeploySubscription = !existingSubscription;

  if (existingSubscription) {
    proxyAddress = existingSubscription.address;

    // If the local chain was restarted, the address may exist in deployments but not on-chain.
    const code = await hre.ethers.provider.getCode(proxyAddress);
    if (!code || code === "0x") {
      console.log(
        `\n⚠️  Found saved deployment for TokenpingPayments at ${proxyAddress}, but no code is deployed there.`,
      );
      console.log("⚠️  Redeploying TokenpingPayments...");
      await hre.deployments.delete("TokenpingPayments");
      const maybeProxy = await hre.deployments.getOrNull("TokenpingPaymentsProxy");
      if (maybeProxy) await hre.deployments.delete("TokenpingPaymentsProxy");
      const maybeImpl = await hre.deployments.getOrNull("TokenpingPayments_Implementation");
      if (maybeImpl) await hre.deployments.delete("TokenpingPayments_Implementation");
      shouldDeploySubscription = true;
    } else {
      implementationAddress = (existingSubscription as any).implementation ?? "unknown";
      console.log("\nℹ️  TokenpingPayments already deployed at:", proxyAddress);
      // Continue to plan config
    }
  }

  if (shouldDeploySubscription) {
    // Deploy TokenpingPayments implementation (use a distinct deployment name)
    console.log("\n3️⃣  Deploying TokenpingPayments implementation...");
    const implementation = await deploy("TokenpingPayments_Implementation", {
      from: deployer,
      contract: "TokenpingPayments", // artifact name differs from deployment name
      args: [],
      log: true,
      autoMine: true,
    });

    implementationAddress = implementation.address;

    if (implementation.newlyDeployed) {
      console.log("✅ Implementation deployed at:", implementationAddress);
    } else {
      console.log("ℹ️  Implementation already deployed at:", implementationAddress);
    }

    // Deploy ERC1967Proxy for UUPS upgradeable pattern
    console.log("\n4️⃣  Deploying ERC1967Proxy...");

    // Encode the initialize function call
    const TokenpingPaymentsFactory = await hre.ethers.getContractFactory("TokenpingPayments");
    const initData = TokenpingPaymentsFactory.interface.encodeFunctionData("initialize", [deployer]);

    // Deploy the proxy via hardhat-deploy so receipts/tx hashes are persisted.
    const proxyDeployment = await deploy("TokenpingPaymentsProxy", {
      from: deployer,
      contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      args: [implementationAddress, initData],
      log: true,
      autoMine: true,
      // Some local nodes enforce a tx gas cap (~16.7M). Pin a safe gas limit for proxy deployment.
      gasLimit: 5_000_000,
    });

    proxyAddress = proxyDeployment.address;

    // Save the proxy under the expected contract name (used by the frontend/hooks)
    await hre.deployments.save("TokenpingPayments", {
      address: proxyAddress,
      implementation: implementationAddress,
      abi: implementation.abi,
      receipt: proxyDeployment.receipt,
      transactionHash: proxyDeployment.transactionHash,
    });

    console.log("✅ Proxy deployed at:", proxyAddress);
    console.log("✅ Implementation at:", implementationAddress);
  }

  // 4. Verify the deployment
  console.log("\n5️⃣  Verifying deployment...");
  const deployerSigner = await hre.ethers.getSigner(deployer);
  const tokenpingPaymentsContract = await hre.ethers.getContractAt("TokenpingPayments", proxyAddress, deployerSigner);

  const owner = await tokenpingPaymentsContract.owner();
  console.log("✅ Contract owner:", owner);
  console.log("✅ Contract paused:", await tokenpingPaymentsContract.paused());

  // 5. Configure plan for MockUSDC (3 USDC / ~1 month)
  console.log("\n6️⃣  Configuring subscription plan...");
  const currentPlan = await tokenpingPaymentsContract.plans(mockUSDC.address);
  const currentPrice = currentPlan.price ?? currentPlan[0];
  const currentDuration = currentPlan.durationBlocks ?? currentPlan[1];
  const currentEnabled = currentPlan.enabled ?? currentPlan[2];

  if (currentPrice !== PLAN_PRICE || Number(currentDuration) !== PLAN_DURATION_BLOCKS || currentEnabled !== true) {
    const tx = await tokenpingPaymentsContract.setPlan(mockUSDC.address, PLAN_PRICE, PLAN_DURATION_BLOCKS, true, {
      gasLimit: 1_000_000n,
    });
    await tx.wait();
    console.log(
      "✅ Plan set for MockUSDC:",
      hre.ethers.formatUnits(PLAN_PRICE, 6),
      "USDC /",
      PLAN_DURATION_BLOCKS,
      "blocks",
    );
  } else {
    console.log("ℹ️  Plan already configured");
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("MockUSDC:", mockUSDC.address);
  console.log("TokenpingPayments (Proxy):", proxyAddress);
  console.log("TokenpingPayments (Implementation):", implementationAddress);
  console.log("USDC Minted:", hre.ethers.formatUnits(MINT_AMOUNT, 6), "USDC");
  console.log("Mint Recipient:", MINT_RECIPIENT);
  console.log("Plan Price:", hre.ethers.formatUnits(PLAN_PRICE, 6), "USDC");
  console.log("Plan Duration:", PLAN_DURATION_BLOCKS, "blocks (~30 days)");
  console.log("=".repeat(60) + "\n");
};

export default deployTokenpingContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployTokenpingContracts.tags = ["TokenpingPayments", "MockUSDC"];
