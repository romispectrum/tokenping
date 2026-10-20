// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import scaffoldConfig from "~~/scaffold.config";
import { wagmiConnectors } from "~~/services/web3/wagmiConnectors";

const { connectorsForWallets } = vi.hoisted(() => ({
  connectorsForWallets: vi.fn((): unknown[] => ["walletConnectConnector", "baseAccountConnector"]),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({ connectorsForWallets }));

vi.mock("~~/services/web3/deferWalletSdks", () => ({
  deferWalletSdk: (connector: unknown) => ({ deferred: connector }),
}));

vi.mock("@rainbow-me/rainbowkit/wallets", () => ({
  baseAccount: "baseAccount",
  ledgerWallet: "ledgerWallet",
  metaMaskWallet: "metaMaskWallet",
  rainbowWallet: "rainbowWallet",
  safeWallet: "safeWallet",
  walletConnectWallet: "walletConnectWallet",
}));

vi.mock("burner-connector", () => ({ rainbowkitBurnerWallet: "rainbowkitBurnerWallet" }));

describe("wagmiConnectors", () => {
  it("introduces the dapp as Tokenping in wallet connection prompts", () => {
    wagmiConnectors();

    expect(connectorsForWallets).toHaveBeenCalledWith(expect.any(Array), {
      appName: "Tokenping",
      projectId: scaffoldConfig.walletConnectProjectId,
    });
  });

  it("holds back every wallet SDK until the connect modal opens (deferWalletSdks decides which ones wait)", () => {
    expect(wagmiConnectors()).toEqual([{ deferred: "walletConnectConnector" }, { deferred: "baseAccountConnector" }]);
  });
});
