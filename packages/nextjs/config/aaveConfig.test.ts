import * as chains from "viem/chains";
import { describe, expect, it } from "vitest";
import { AAVE_MARKETS, getAaveMarket } from "~~/config/aaveConfig";

// Verbatim copies of the parallel maps AAVE_MARKETS replaced.
const LEGACY_POOL_ADDRESSES: Record<number, `0x${string}`> = {
  [chains.mainnet.id]: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  [chains.polygon.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.arbitrum.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.optimism.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.base.id]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  [chains.avalanche.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.gnosis.id]: "0xb50201558B00496A145fE76f7424749556E326D8",
};

const LEGACY_POOL_DATA_PROVIDER_ADDRESSES: Record<number, `0x${string}`> = {
  [chains.mainnet.id]: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
  [chains.polygon.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.arbitrum.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.optimism.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.base.id]: "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac",
  [chains.avalanche.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.gnosis.id]: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
};

const LEGACY_SUPPORTED_CHAINS = [
  chains.mainnet,
  chains.polygon,
  chains.arbitrum,
  chains.optimism,
  chains.base,
  chains.avalanche,
  chains.gnosis,
];

const LEGACY_CHAIN_METADATA: Record<number, { name: string; icon: string; color: string }> = {
  [chains.mainnet.id]: { name: "Ethereum", icon: "⟠", color: "#627EEA" },
  [chains.polygon.id]: { name: "Polygon", icon: "⬡", color: "#8247E5" },
  [chains.arbitrum.id]: { name: "Arbitrum", icon: "🔷", color: "#28A0F0" },
  [chains.optimism.id]: { name: "Optimism", icon: "🔴", color: "#FF0420" },
  [chains.base.id]: { name: "Base", icon: "🔵", color: "#0052FF" },
  [chains.avalanche.id]: { name: "Avalanche", icon: "🔺", color: "#E84142" },
  [chains.gnosis.id]: { name: "Gnosis", icon: "🦉", color: "#04795B" },
};

describe("AAVE_MARKETS", () => {
  it("lists the same chains in the same order", () => {
    expect(AAVE_MARKETS.map(market => market.chain)).toEqual(LEGACY_SUPPORTED_CHAINS);
  });

  it("keeps each chain's pool, data provider and display metadata", () => {
    expect(
      AAVE_MARKETS.map(({ chain, pool, dataProvider, name, icon, color }) => ({
        chainId: chain.id,
        pool,
        dataProvider,
        name,
        icon,
        color,
      })),
    ).toEqual(
      LEGACY_SUPPORTED_CHAINS.map(chain => ({
        chainId: chain.id,
        pool: LEGACY_POOL_ADDRESSES[chain.id],
        dataProvider: LEGACY_POOL_DATA_PROVIDER_ADDRESSES[chain.id],
        ...LEGACY_CHAIN_METADATA[chain.id],
      })),
    );
  });
});

describe("getAaveMarket", () => {
  it("finds a market by chain id", () => {
    expect(getAaveMarket(chains.base.id)?.name).toBe("Base");
  });

  it("returns undefined for chains without an Aave market", () => {
    expect(getAaveMarket(chains.bsc.id)).toBeUndefined();
    expect(getAaveMarket(chains.hardhat.id)).toBeUndefined();
  });
});
