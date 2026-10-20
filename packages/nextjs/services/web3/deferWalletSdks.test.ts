import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateConnectorFn } from "wagmi";

type ConnectorConfig = Parameters<CreateConnectorFn>[0];
type Connector = ReturnType<CreateConnectorFn>;

// wagmi's storage, as connectors see it: recentConnectorId is the wallet this browser connected last.
const storage = new Map<string, unknown>();
const config = { chains: [], storage: { getItem: async (key: string) => storage.get(key) ?? null } };

/**
 * A connector that records each call to setup() and getProvider() with the `this` it ran on. Like the real ones, its
 * connect() and getChainId() need a provider. `rkDetails` is what RainbowKit's connectorsForWallets adds.
 */
const fakeConnector = (type: string, id = type, rkDetails?: { id: string }) => {
  const calls = { setup: [] as unknown[], getProvider: [] as unknown[], connect: 0 };
  const provider = { id };
  const connector = {
    id,
    name: id,
    type,
    ...(rkDetails && { rkDetails }),
    async setup(this: Connector) {
      calls.setup.push(this);
      await this.getProvider();
    },
    async getProvider(this: Connector) {
      calls.getProvider.push(this);
      return provider;
    },
    async getChainId(this: Connector) {
      if (!(await this.getProvider())) throw new TypeError("Cannot read properties of undefined (reading 'chainId')");
      return 42161;
    },
    async connect(this: Connector) {
      if (!(await this.getProvider())) throw new TypeError("Cannot read properties of undefined (reading 'request')");
      calls.connect++;
      return { accounts: [], chainId: 42161 };
    },
  };
  const create = (() => connector) as unknown as CreateConnectorFn;
  return { create, connector, calls, provider };
};

// What wagmi's createConfig does with each connector: copy it, add its own fields, then call setup() unawaited.
const buildConnector = (create: CreateConnectorFn) => {
  const connector = { ...create(config as unknown as ConnectorConfig), uid: "uid" };
  void connector.setup?.();
  return connector;
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// The started flag is module state, as it is for the one wagmi config in the browser.
const loadModule = async () => {
  vi.resetModules();
  return import("~~/services/web3/deferWalletSdks");
};

beforeEach(() => {
  storage.clear();
});

describe("deferWalletSdk", () => {
  it("leaves injected wallets and Safe alone: they need no SDK, and Safe must connect on load in its iframe", async () => {
    const { deferWalletSdk } = await loadModule();

    for (const type of ["injected", "safe"]) {
      const { create, connector } = fakeConnector(type);
      expect(deferWalletSdk(create)(config as unknown as ConnectorConfig)).toBe(connector);
    }
  });

  it("starts nothing on load for a wallet this browser never connected", async () => {
    const { deferWalletSdk } = await loadModule();
    const { create, calls } = fakeConnector("walletConnect");

    const connector = buildConnector(deferWalletSdk(create));
    await flush();

    expect(calls.setup).toHaveLength(0);
    expect(calls.getProvider).toHaveLength(0);
    // reconnect() asks every connector for its provider and skips the ones without one
    await expect(connector.getProvider()).resolves.toBeUndefined();
    expect(calls.getProvider).toHaveLength(0);
  });

  it("starts the waiting SDKs when the connect modal opens, set up once on wagmi's connector", async () => {
    const { deferWalletSdk, startWalletSdks } = await loadModule();
    const { create, calls, provider } = fakeConnector("walletConnect");
    const connector = buildConnector(deferWalletSdk(create));
    await flush();

    startWalletSdks();
    await flush();

    expect(calls.setup).toEqual([connector]);
    expect(calls.getProvider.length).toBeGreaterThan(0);
    expect(calls.getProvider.every(self => self === connector)).toBe(true);
    await expect(connector.getProvider()).resolves.toBe(provider);
    await connector.getProvider();
    expect(calls.setup).toHaveLength(1);
  });

  it("starts at once, as before, for the wallet this browser connected last, so a returning visitor reconnects", async () => {
    const { deferWalletSdk } = await loadModule();
    storage.set("recentConnectorId", "baseAccount");
    const base = fakeConnector("baseAccount");
    const walletConnect = fakeConnector("walletConnect");

    const baseConnector = buildConnector(deferWalletSdk(base.create));
    const walletConnectConnector = buildConnector(deferWalletSdk(walletConnect.create));
    await flush();

    expect(base.calls.setup).toEqual([baseConnector]);
    await expect(baseConnector.getProvider()).resolves.toBe(base.provider);
    expect(walletConnect.calls.setup).toHaveLength(0);
    await expect(walletConnectConnector.getProvider()).resolves.toBeUndefined();
  });

  it("matches the RainbowKit wallet id wagmi saves, not only the connector's own id", async () => {
    const { deferWalletSdk } = await loadModule();
    // RainbowKit connects through { ...connector, ...rkDetails }, so wagmi saves "metaMask", "rainbow" or "ledger".
    storage.set("recentConnectorId", "metaMask");
    const metaMask = fakeConnector("metaMask", "metaMaskSDK", { id: "metaMask" });
    const rainbow = fakeConnector("walletConnect", "walletConnect", { id: "rainbow" });

    const metaMaskConnector = buildConnector(deferWalletSdk(metaMask.create));
    const rainbowConnector = buildConnector(deferWalletSdk(rainbow.create));
    await flush();

    await expect(metaMaskConnector.getProvider()).resolves.toBe(metaMask.provider);
    await expect(rainbowConnector.getProvider()).resolves.toBeUndefined();

    storage.set("recentConnectorId", "rainbow");
    await expect(rainbowConnector.getProvider()).resolves.toBe(rainbow.provider);
  });

  it("starts nothing when this browser has no last-used wallet", async () => {
    const { deferWalletSdk } = await loadModule();
    const { create, calls } = fakeConnector("baseAccount");

    const connector = buildConnector(deferWalletSdk(create));
    await flush();

    expect(calls.setup).toHaveLength(0);
    await expect(connector.getProvider()).resolves.toBeUndefined();
  });

  it("starts when asked to connect from outside the modal, through RainbowKit's copy of the connector", async () => {
    const { deferWalletSdk } = await loadModule();
    const { create, calls } = fakeConnector("walletConnect", "walletConnect", { id: "ledger" });
    const connector = buildConnector(deferWalletSdk(create));
    await flush();
    // RainbowKit's { ...connector, ...rkDetails }: the same methods, called on the copy, under the wallet's id
    const rainbowKitWallet = { ...connector, id: "ledger" };

    await expect(rainbowKitWallet.getChainId()).resolves.toBe(42161);
    await expect(rainbowKitWallet.connect()).resolves.toEqual({ accounts: [], chainId: 42161 });
    expect(calls.connect).toBe(1);
  });

  it("starts on connect() alone, as wagmi's connect action calls it", async () => {
    const { deferWalletSdk } = await loadModule();
    const { create, calls } = fakeConnector("baseAccount");
    const connector = buildConnector(deferWalletSdk(create));
    await flush();

    await connector.connect();

    expect(calls.connect).toBe(1);
    expect(calls.setup).toHaveLength(1);
  });

  it("starts a connector built after the modal opened right away", async () => {
    const { deferWalletSdk, startWalletSdks } = await loadModule();
    startWalletSdks();
    const { create, calls, provider } = fakeConnector("metaMask", "metaMaskSDK");

    const connector = buildConnector(deferWalletSdk(create));
    await flush();

    expect(calls.setup).toEqual([connector]);
    await expect(connector.getProvider()).resolves.toBe(provider);
  });

  it("passes getProvider's parameters through", async () => {
    const { deferWalletSdk, startWalletSdks } = await loadModule();
    startWalletSdks();
    const getProvider = vi.fn(async () => "provider");
    const create = (() => ({
      id: "walletConnect",
      name: "WalletConnect",
      type: "walletConnect",
      getProvider,
    })) as unknown as CreateConnectorFn;

    const connector = buildConnector(deferWalletSdk(create));
    await connector.getProvider({ chainId: 42161 });

    expect(getProvider).toHaveBeenCalledWith({ chainId: 42161 });
  });
});
