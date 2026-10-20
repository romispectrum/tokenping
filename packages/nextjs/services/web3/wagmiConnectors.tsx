import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  baseAccount,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";
import { deferWalletSdk } from "~~/services/web3/deferWalletSdks";

const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

const wallets = [
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  baseAccount,
  rainbowWallet,
  safeWallet,
  ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
    ? [rainbowkitBurnerWallet]
    : []),
];

/**
 * wagmi connectors for the wagmi context. Wallet SDKs that call their own servers start when the connect modal opens
 * (deferWalletSdks), not on every page load.
 */
export const wagmiConnectors = () => {
  // Only create connectors on client-side to avoid SSR issues
  // TODO: update when https://github.com/rainbow-me/rainbowkit/issues/2476 is resolved
  if (typeof window === "undefined") {
    return [];
  }

  return connectorsForWallets(
    [
      {
        groupName: "Supported Wallets",
        wallets,
      },
    ],

    {
      appName: "Tokenping",
      projectId: scaffoldConfig.walletConnectProjectId,
    },
  ).map(deferWalletSdk);
};
