import * as dotenv from "dotenv";
dotenv.config();
import { Wallet } from "ethers";
import password from "@inquirer/password";
import { spawn } from "child_process";
import { config } from "hardhat";

/**
 * Unencrypts the private key and runs the hardhat deploy command
 */
async function main() {
  const deployModeIndex = process.argv.indexOf("--deploy-mode");
  const deployModeArg = deployModeIndex !== -1 ? process.argv[deployModeIndex + 1] : undefined;
  const networkIndex = process.argv.indexOf("--network");
  const networkName = networkIndex !== -1 ? process.argv[networkIndex + 1] : config.defaultNetwork;
  const isLocalNetwork = networkName === "localhost" || networkName === "hardhat";
  const deployMode = deployModeArg ?? (isLocalNetwork ? "local" : "production");

  if (deployMode !== "local" && deployMode !== "production") {
    console.error("Invalid --deploy-mode value. Use --deploy-mode local or --deploy-mode production");
    process.exit(1);
  }

  if (deployMode === "local" && !isLocalNetwork) {
    console.error(`--deploy-mode local requires network hardhat/localhost. Received network=${networkName}`);
    process.exit(1);
  }

  if (deployMode === "production" && isLocalNetwork) {
    console.error(`--deploy-mode production cannot run on network ${networkName}. Use --deploy-mode local instead.`);
    process.exit(1);
  }

  const scriptArgs = process.argv
    .slice(2)
    .filter((arg, index, all) => !(arg === "--deploy-mode" || all[index - 1] === "--deploy-mode"));
  const requiredTag = deployMode === "local" ? "TokenpingPaywallLocal" : "TokenpingPaywallProduction";
  const tagsIndex = scriptArgs.indexOf("--tags");
  if (tagsIndex !== -1 && scriptArgs[tagsIndex + 1]) {
    scriptArgs[tagsIndex + 1] = `${scriptArgs[tagsIndex + 1]},${requiredTag}`;
  } else {
    scriptArgs.push("--tags", requiredTag);
  }

  if (isLocalNetwork) {
    // Deploy command on the localhost network
    const hardhat = spawn("hardhat", ["deploy", ...scriptArgs], {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    hardhat.on("exit", code => {
      process.exit(code || 0);
    });
    return;
  }

  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;

  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
    process.exit(1);
  }

  const pass = await password({ message: "Enter password to decrypt private key:" });

  try {
    const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);
    process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;

    const hardhat = spawn("hardhat", ["deploy", ...scriptArgs], {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    hardhat.on("exit", code => {
      process.exit(code || 0);
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.error("Failed to decrypt private key. Wrong password?");
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
