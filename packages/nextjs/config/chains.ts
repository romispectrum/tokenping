import { defineChain } from "viem";
import { katana as viemKatana } from "viem/chains";

// Chains Morpho runs on that viem 2.39 has no mainnet definition for (Katana it has, without Multicall3). RPCs and
// explorers are from each chain's own docs; each RPC answered eth_chainId with its id and Multicall3 has code at its
// usual address on all of them (checked 25 Oct 2026). Arc and Monad, which Aave uses too, live in config/aaveConfig.ts.

const MULTICALL3 = { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } as const;

/** Hyperliquid's EVM. Its id, 999, is also used by two viem testnets, so it is never looked up among viem's chains. */
export const hyperEvm = defineChain({
  id: 999,
  name: "HyperEVM",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.hyperliquid.xyz/evm"] } },
  blockExplorers: { default: { name: "HyperEVMScan", url: "https://hyperevmscan.io" } },
  contracts: { multicall3: MULTICALL3 },
});

/** viem's Katana, with the Multicall3 its definition leaves out (viem's multicall needs it) and Katana's own explorer. */
export const katana = defineChain({
  ...viemKatana,
  blockExplorers: { default: { name: "Katanascan", url: "https://katanascan.com" } },
  contracts: { ...viemKatana.contracts, multicall3: MULTICALL3 },
});

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
  contracts: { multicall3: MULTICALL3 },
});

/** Stable pays gas in USDT0, which has 18 decimals as the native currency (6 as the ERC-20). */
export const stable = defineChain({
  id: 988,
  name: "Stable",
  nativeCurrency: { name: "USDT0", symbol: "USDT0", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.stable.xyz"] } },
  blockExplorers: { default: { name: "Stablescan", url: "https://stablescan.xyz" } },
  contracts: { multicall3: MULTICALL3 },
});

/** Tempo has no native gas token; viem needs one, so it carries the "USD" placeholder the chain reports. */
export const tempo = defineChain({
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.tempo.xyz"] } },
  blockExplorers: { default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" } },
  contracts: { multicall3: MULTICALL3 },
});
