import type { CreateConnectorFn } from "wagmi";

// Connectors without an SDK of their own start as usual: an injected wallet is already in the browser, and Safe's SDK
// only answers inside the Safe app's iframe, where the app has to connect on load without a click.
const STARTS_ON_LOAD = new Set(["injected", "safe"]);

let walletSdksStarted = false;
const waitingSdks = new Set<() => void>();

/** Starts every deferred wallet SDK. The connect modal calls it when it opens, so the SDKs are ready for the click. */
export const startWalletSdks = () => {
  if (walletSdksStarted) return;
  walletSdksStarted = true;
  waitingSdks.forEach(start => start());
  waitingSdks.clear();
};

type Connector = ReturnType<CreateConnectorFn>;

/**
 * Holds back a wallet's own SDK until it is needed. Some call their servers as soon as they start: WalletConnect
 * (remote config and analytics) and Base Account (telemetry). wagmi starts every connector on every page load
 * (WalletConnect's in setup(), the others when reconnect() asks each one for its provider), so every visitor made those
 * requests, and each one that failed (blocked, rate-limited, refused from a datacenter) was a console error.
 * A deferred connector starts on load only when it is the wallet this browser connected last, so a returning visitor
 * reconnects as before. Any other starts with startWalletSdks() or when something asks it to connect; until then
 * reconnect() gets no provider from it and skips it.
 */
export const deferWalletSdk =
  (createConnector: CreateConnectorFn): CreateConnectorFn =>
  config => {
    const connector = createConnector(config);
    if (STARTS_ON_LOAD.has(connector.type)) return connector;

    const { setup, getProvider, connect, getChainId } = connector;
    // RainbowKit connects through a copy that carries its wallet's id ("metaMask", "rainbow", "ledger"), so that is
    // the id wagmi saves as recentConnectorId; the connector's own id ("metaMaskSDK", "walletConnect") is not.
    const ids = [connector.id, (connector.rkDetails as { id?: string } | undefined)?.id];
    const isLastUsed = async () => {
      const recentConnectorId = await config.storage?.getItem("recentConnectorId");
      return typeof recentConnectorId === "string" && ids.includes(recentConnectorId);
    };
    let isRequested = false;
    const mayStart = async () => walletSdksStarted || isRequested || (await isLastUsed());
    let isSetUp = false;
    const setUpOnce = (self: Connector) => {
      if (isSetUp) return;
      isSetUp = true;
      return setup?.call(self);
    };

    return {
      ...connector,
      // wagmi calls setup() once, on the connector it builds from this object; `this` is that connector.
      async setup() {
        if (await mayStart()) return setUpOnce(this);
        waitingSdks.add(() => void this.getProvider().catch(() => undefined));
      },
      async getProvider(...parameters) {
        if (!(await mayStart())) return undefined;
        // Not awaited, as wagmi does not await setup(): the connector's own setup() asks for the provider too.
        void setUpOnce(this);
        return getProvider.apply(this, parameters);
      },
      // A connect from any button, not only the modal, starts the SDK. RainbowKit asks for the chain id first.
      connect: function (this: Connector, ...parameters: Parameters<Connector["connect"]>) {
        isRequested = true;
        return connect.apply(this, parameters);
      } as Connector["connect"],
      async getChainId() {
        isRequested = true;
        return getChainId.call(this);
      },
    };
  };
