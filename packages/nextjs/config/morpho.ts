import type { Address, Chain } from "viem";
import { arbitrum, base, mainnet, optimism, polygon, unichain, worldchain } from "viem/chains";
import { arc, monad } from "~~/config/aaveConfig";
import { hyperEvm, katana, robinhood, stable, tempo } from "~~/config/chains";

/** Morpho's public API: GraphQL at /graphql for Morpho Blue, REST under /v0/midnight for Midnight. */
export const MORPHO_API_URL = "https://api.morpho.org";

export type MorphoChain = {
  chain: Chain;
  /** The network's name, as the dashboard and alerts show it. */
  name: string;
  /** The Morpho Blue core contract. */
  blue: Address;
  /** The Morpho Midnight core contract, on the chains that have one. */
  midnight?: Address;
  /** Morpho's PreLiquidationFactory, which proves a pre-liquidation contract is Morpho's own. */
  preLiquidationFactory: Address;
  /**
   * Whether Morpho's API lists Midnight markets here. Only listed markets get alerts, so Midnight is offered only
   * where the API can say which are listed (not on Tempo, as of 25 Oct 2026).
   */
  midnightListed: boolean;
};

// The 14 chains Morpho's own app covers (25 Oct 2026), in its order. Core and factory addresses are from Morpho's
// docs (docs.morpho.org/developers/contracts/addresses) and its MIT-licensed SDK (github.com/morpho-org/sdks,
// packages/morpho-ts/src/addresses.ts); each one has contract code on its chain (checked 25 Oct 2026).
export const MORPHO_CHAINS: readonly MorphoChain[] = [
  {
    chain: mainnet,
    name: "Ethereum",
    blue: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    midnight: "0x471686c42792F93528B000beF54bC10E3aa2045f",
    preLiquidationFactory: "0x6FF33615e792E35ed1026ea7cACCf42D9BF83476",
    midnightListed: true,
  },
  {
    chain: base,
    name: "Base",
    blue: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    midnight: "0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A",
    preLiquidationFactory: "0x8cd16b62E170Ee0bA83D80e1F80E6085367e2aef",
    midnightListed: true,
  },
  {
    chain: arbitrum,
    name: "Arbitrum",
    blue: "0x6c247b1F6182318877311737BaC0844bAa518F5e",
    preLiquidationFactory: "0x635c31B5DF1F7EFbCbC07E302335Ef4230758e3d",
    midnightListed: false,
  },
  {
    chain: optimism,
    name: "OP Mainnet",
    blue: "0xce95AfbB8EA029495c66020883F87aaE8864AF92",
    preLiquidationFactory: "0x3d05C01EE8e97361b9E19D172128255eaE5F98B9",
    midnightListed: false,
  },
  {
    chain: polygon,
    name: "Polygon",
    blue: "0x1bF0c2541F820E775182832f06c0B7Fc27A25f67",
    preLiquidationFactory: "0xeDadDe37D76c72b98725614d0b41C20Fe612d304",
    midnightListed: false,
  },
  {
    chain: unichain,
    name: "Unichain",
    blue: "0x8f5ae9CddB9f68de460C77730b018Ae7E04a140A",
    preLiquidationFactory: "0xb04e4D3D59Ee47Ca9BA192707AF13A7D02969911",
    midnightListed: false,
  },
  {
    chain: worldchain,
    name: "World Chain",
    blue: "0xE741BC7c34758b4caE05062794E8Ae24978AF432",
    preLiquidationFactory: "0xe3cE2051a24e58DBFC0eFBe4c2d9e89c5eAe4695",
    midnightListed: false,
  },
  {
    chain: hyperEvm,
    name: "HyperEVM",
    blue: "0x68e37dE8d93d3496ae143F2E900490f6280C57cD",
    preLiquidationFactory: "0x1b6782Ac7A859503cE953FBf4736311CC335B8f0",
    midnightListed: false,
  },
  {
    chain: katana,
    name: "Katana",
    blue: "0xD50F2DffFd62f94Ee4AEd9ca05C61d0753268aBc",
    preLiquidationFactory: "0x678EB53A3bB79111263f47B84989d16D81c36D85",
    midnightListed: false,
  },
  {
    chain: monad,
    name: "Monad",
    blue: "0xD5D960E8C380B724a48AC59E2DfF1b2CB4a1eAee",
    preLiquidationFactory: "0xB5b3e541abD19799E0c65905a5a42BD37d6c94c0",
    midnightListed: false,
  },
  {
    chain: arc,
    name: "Arc",
    blue: "0x34CD04070dD72b14E241112F6d83812Df5Af7fCD",
    midnight: "0x208786922BE56fDE2D1Fa60e6b9eC5D723e8d7b0",
    preLiquidationFactory: "0x8edf6Ac769a7E7D81d571aC0FB8733aD724f6922",
    midnightListed: true,
  },
  {
    chain: robinhood,
    name: "Robinhood Chain",
    blue: "0x9D53d5E3bd5E8d4Cbfa6DB1ca238AEA02E651010",
    midnight: "0x6120765Ba5336150BbdDdD0Cd9108B5bFD369632",
    preLiquidationFactory: "0x0B0cFa151c06d2342799267754b0a2c320C43D5B",
    midnightListed: true,
  },
  {
    chain: stable,
    name: "Stable",
    blue: "0xa40103088A899514E3fe474cD3cc5bf811b1102e",
    preLiquidationFactory: "0x741A6604e974FeAF35a5FBb1416B3e01c33e5C0e",
    midnightListed: false,
  },
  {
    chain: tempo,
    name: "Tempo",
    blue: "0x10EE9AAC980A180dd4DcFc96C746d60B0EA88f97",
    midnight: "0x31Ff800b0FA4AA42071d4ae9D0392e84f256D83D",
    preLiquidationFactory: "0xB83d2D5CAE5Fc64a408cA82447445442Fe249fe3",
    midnightListed: false,
  },
];

export const getMorphoChain = (chainId: number) => MORPHO_CHAINS.find(({ chain }) => chain.id === chainId);

/** The chains where Midnight positions are found and offered alerts (listed markets only). */
export const MORPHO_MIDNIGHT_CHAINS = MORPHO_CHAINS.filter(
  ({ midnight, midnightListed }) => midnight && midnightListed,
);
