import { Contract } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export type DeployMode = "local" | "production";

type CanonicalPaymentToken = {
  mode: "canonical";
  label: string;
  address: string;
};

type MockPaymentToken = {
  mode: "mock";
  label: string;
  mintRecipient: string;
  mintAmount: bigint;
};

type PaymentTokenConfig = CanonicalPaymentToken | MockPaymentToken;

export type TokenpingDeployConfig = {
  profileName: string;
  planDurationDays: number;
  maxDurationDays: number;
  planPrice: bigint;
  paymentToken: PaymentTokenConfig;
};

type DeployCoreParams = {
  hre: HardhatRuntimeEnvironment;
  config: TokenpingDeployConfig;
  mode: DeployMode;
};

export const deployTokenpingPaywallCore = async ({ hre, config, mode }: DeployCoreParams) => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const networkName = hre.network.name;
  const chainId = Number(await hre.getChainId());

  const secondsPerDay = 86_400;
  const planDurationSeconds = config.planDurationDays * secondsPerDay;
  const maxDurationSeconds = config.maxDurationDays * secondsPerDay;

  let paymentTokenAddress: string;
  const paymentTokenLabel = config.paymentToken.label;

  console.log("\n📦 Deploying TokenpingPaywall...");
  console.log("Mode:", mode);
  console.log("Deployer:", deployer);
  console.log("Network:", networkName, `(chainId=${chainId})`);
  console.log("Config profile:", config.profileName);
  console.log("Plan duration:", config.planDurationDays, "days =", planDurationSeconds, "seconds");
  console.log("Max duration:", config.maxDurationDays, "days =", maxDurationSeconds, "seconds");

  if (config.paymentToken.mode === "canonical") {
    paymentTokenAddress = config.paymentToken.address;
    const tokenCode = await hre.ethers.provider.getCode(paymentTokenAddress);
    if (!tokenCode || tokenCode === "0x") {
      throw new Error(`Configured payment token has no contract code: ${paymentTokenAddress}`);
    }
    console.log(`\n1️⃣  Using ${paymentTokenLabel}:`, paymentTokenAddress);
  } else {
    console.log("Mint recipient:", config.paymentToken.mintRecipient);
    console.log("\n1️⃣  Deploying MockUSDC...");
    const mockUSDC = await deploy("MockUSDC", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
    paymentTokenAddress = mockUSDC.address;

    if (mockUSDC.newlyDeployed) {
      const mockUSDCContract = await hre.ethers.getContract<Contract>("MockUSDC", deployer);
      console.log(
        `\n2️⃣  Minting ${hre.ethers.formatUnits(config.paymentToken.mintAmount, 6)} USDC to ${config.paymentToken.mintRecipient}...`,
      );
      const mintTx = await mockUSDCContract.mint(config.paymentToken.mintRecipient, config.paymentToken.mintAmount, {
        gasLimit: 1_000_000n,
      });
      await mintTx.wait();
      const balance = await mockUSDCContract.balanceOf(config.paymentToken.mintRecipient);
      console.log("✅ Mint confirmed. Balance:", hre.ethers.formatUnits(balance, 6), "USDC");
    } else {
      console.log("ℹ️  MockUSDC already deployed at:", mockUSDC.address);
    }
  }

  const existingPaywall = await hre.deployments.getOrNull("TokenpingPaywall");
  let proxyAddress: string | undefined;
  let implementationAddress: string | undefined;
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
    const initData = TokenpingPaywallFactory.interface.encodeFunctionData("initialize", [deployer, maxDurationSeconds]);

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

  if (!proxyAddress || !implementationAddress) {
    throw new Error("TokenpingPaywall deployment addresses are unavailable");
  }

  console.log("\n5️⃣  Verifying deployment...");
  const deployerSigner = await hre.ethers.getSigner(deployer);
  const paywall = await hre.ethers.getContractAt("TokenpingPaywall", proxyAddress, deployerSigner);
  console.log("✅ Owner:", await paywall.owner());
  console.log("✅ Paused:", await paywall.paused());

  console.log(`\n6️⃣  Configuring plan for ${paymentTokenLabel}...`);
  const currentPlan = await paywall.plans(paymentTokenAddress);
  const currentPrice = currentPlan.price ?? currentPlan[0];
  const currentDuration = currentPlan.durationSeconds ?? currentPlan[1];
  const currentEnabled = currentPlan.enabled ?? currentPlan[2];

  if (currentPrice !== config.planPrice || Number(currentDuration) !== planDurationSeconds || currentEnabled !== true) {
    const tx = await paywall.setPlan(paymentTokenAddress, config.planPrice, planDurationSeconds, true, {
      gasLimit: 1_000_000n,
    });
    await tx.wait();
    console.log(
      "✅ Plan set:",
      hre.ethers.formatUnits(config.planPrice, 6),
      "USDC /",
      planDurationSeconds,
      `seconds (~${config.planDurationDays} days)`,
    );
  } else {
    console.log("ℹ️  Plan already configured");
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Payment token:", paymentTokenAddress, `(${paymentTokenLabel})`);
  console.log("TokenpingPaywall (proxy):", proxyAddress);
  console.log("TokenpingPaywall (implementation):", implementationAddress);
  console.log(
    "Plan:",
    hre.ethers.formatUnits(config.planPrice, 6),
    "USDC /",
    planDurationSeconds,
    "seconds",
    `(~${config.planDurationDays} days)`,
  );
  console.log("=".repeat(60) + "\n");
};
