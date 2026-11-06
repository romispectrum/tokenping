import {
  type Address,
  BaseError,
  type ContractFunctionParameters,
  ContractFunctionRevertedError,
  type Hex,
  encodeAbiParameters,
  getAddress,
  isAddressEqual,
  keccak256,
  parseAbiParameters,
  zeroAddress,
} from "viem";
import type { MorphoChain } from "~~/config/morpho";
import type { MorphoProtocol } from "~~/config/protocols";
import {
  ERC20_METADATA_ABI,
  MORPHO_BLUE_ABI,
  MORPHO_MIDNIGHT_ABI,
  PRE_LIQUIDATION_ABI,
  PRE_LIQUIDATION_FACTORY_ABI,
} from "~~/services/morpho/abis";
import { fetchMorphoListing } from "~~/services/morpho/api";
import type { MorphoClient } from "~~/services/morpho/client";
import type {
  BlueMarketParams,
  BluePreLiquidation,
  MidnightMarketParams,
  MorphoMarketParams,
  MorphoToken,
} from "~~/services/morpho/types";

// A market's fixed parameters, read from the chain rather than taken from Morpho's API: the API only says which
// markets are listed and which pre-liquidation contracts exist, and each contract is checked against Morpho's factory.
// An RPC can be a public one, and what is read here is stored and trusted on every later check, so a Blue market's
// parameters are checked against its id, which is their hash, and a Midnight market's against the chain and contract.

type Result<T> = { status: "success"; result: T } | { status: "failure"; error: Error };

const ok = <T>(result: Result<unknown>) => (result.status === "success" ? (result.result as T) : undefined);

/** Symbol and decimals of each token, in order; a token whose symbol cannot be read shows its short address. */
const readTokens = async (client: MorphoClient, addresses: readonly Address[]): Promise<MorphoToken[] | null> => {
  const results = (await client.multicall({
    allowFailure: true,
    contracts: addresses.flatMap(address => [
      { address, abi: ERC20_METADATA_ABI, functionName: "symbol" },
      { address, abi: ERC20_METADATA_ABI, functionName: "decimals" },
    ]),
  })) as Result<unknown>[];
  const tokens = addresses.map((address, index) => {
    const decimals = ok<number>(results[index * 2 + 1]);
    if (decimals === undefined) return null;
    const symbol = ok<string>(results[index * 2])?.trim() || `${address.slice(0, 6)}…${address.slice(-4)}`;
    return { address, symbol, decimals: Number(decimals) };
  });
  return tokens.every(token => token !== null) ? (tokens as MorphoToken[]) : null;
};

const MARKET_PARAMS = parseAbiParameters("address, address, address, address, uint256");

/** The most pre-liquidation contracts kept for one alert. */
export const MAX_PRE_LIQUIDATIONS = 500;

/**
 * A Morpho Blue market's parameters, with the pre-liquidation contracts among `candidates` that Morpho's factory
 * created for this very market. Null when the market does not exist or cannot hold a borrow (an idle market), when the
 * answer is not this market's, or when a factory check could not be read (a contract must not vanish on an RPC error).
 */
export const readBlueMarketParams = async (
  client: MorphoClient,
  chain: MorphoChain,
  marketId: Hex,
  candidates: readonly Address[] = [],
): Promise<BlueMarketParams | null> => {
  const contracts: ContractFunctionParameters[] = [
    { address: chain.blue, abi: MORPHO_BLUE_ABI, functionName: "idToMarketParams", args: [marketId] },
    ...candidates.flatMap(address => [
      {
        address: chain.preLiquidationFactory,
        abi: PRE_LIQUIDATION_FACTORY_ABI,
        functionName: "isPreLiquidation",
        args: [address],
      },
      { address, abi: PRE_LIQUIDATION_ABI, functionName: "ID" },
      { address, abi: PRE_LIQUIDATION_ABI, functionName: "preLiquidationParams" },
    ]),
  ];
  const [marketParams, ...preResults] = (await client.multicall({
    allowFailure: true,
    contracts,
  })) as Result<unknown>[];

  const params = ok<readonly [Address, Address, Address, Address, bigint]>(marketParams);
  if (!params) return null;
  const [loanToken, collateralToken, oracle, irm, lltv] = params;
  if (isAddressEqual(loanToken, zeroAddress) || isAddressEqual(collateralToken, zeroAddress) || lltv === 0n)
    return null;
  const id = keccak256(encodeAbiParameters(MARKET_PARAMS, [loanToken, collateralToken, oracle, irm, lltv]));
  if (id.toLowerCase() !== marketId.toLowerCase()) return null;
  if (candidates.some((_, index) => preResults[index * 3].status !== "success")) return null;

  const preLiquidations: BluePreLiquidation[] = candidates.flatMap((address, index) => {
    const isFromFactory = ok<boolean>(preResults[index * 3]);
    const preMarketId = ok<Hex>(preResults[index * 3 + 1]);
    const preParams = ok<{ preLltv: bigint; preLiquidationOracle: Address }>(preResults[index * 3 + 2]);
    return isFromFactory && preMarketId?.toLowerCase() === marketId.toLowerCase() && preParams
      ? [{ address, preLltv: preParams.preLltv.toString(), oracle: preParams.preLiquidationOracle }]
      : [];
  });

  const tokens = await readTokens(client, [loanToken, collateralToken]);
  if (!tokens) return null;
  return {
    kind: "blue",
    loanToken: tokens[0],
    collateralToken: tokens[1],
    oracle,
    irm,
    lltv: lltv.toString(),
    preLiquidations,
  };
};

type MidnightMarketStruct = {
  chainId: bigint;
  midnight: Address;
  loanToken: Address;
  collateralParams: readonly { token: Address; lltv: bigint; oracle: Address }[];
  maturity: bigint;
};

/**
 * A Morpho Midnight market's parameters; null when the market does not exist on this chain's Midnight. How an id is
 * derived is not public, so the struct's own chain and contract are what ties the answer to this market.
 */
export const readMidnightMarketParams = async (
  client: MorphoClient,
  chain: MorphoChain,
  marketId: Hex,
): Promise<MidnightMarketParams | null> => {
  if (!chain.midnight) return null;
  let market: MidnightMarketStruct;
  try {
    market = (await client.readContract({
      address: chain.midnight,
      abi: MORPHO_MIDNIGHT_ABI,
      functionName: "toMarket",
      args: [marketId],
    })) as MidnightMarketStruct;
  } catch (error) {
    // toMarket reverts (MarketNotCreated) for an id this Midnight does not know. Anything else (the RPC did not answer)
    // is thrown: an outage is not an unknown market.
    if (error instanceof BaseError && error.walk(cause => cause instanceof ContractFunctionRevertedError)) return null;
    throw error;
  }
  if (market.chainId !== BigInt(chain.chain.id) || !isAddressEqual(market.midnight, chain.midnight)) return null;
  const tokens = await readTokens(client, [market.loanToken, ...market.collateralParams.map(({ token }) => token)]);
  if (!tokens) return null;
  return {
    kind: "midnight",
    loanToken: tokens[0],
    collaterals: market.collateralParams.map(({ lltv, oracle }, index) => ({
      token: tokens[index + 1],
      lltv: lltv.toString(),
      oracle,
    })),
    maturity: Number(market.maturity),
  };
};

/**
 * The parameters of a market a new alert may watch: listed in Morpho's app and present on the chain. Null when the API
 * does not list it or the chain does not have it. Throws MorphoApiError when the API cannot answer, so a market nobody
 * could verify is never saved.
 */
export const readListedMarketParams = async (
  client: MorphoClient,
  chain: MorphoChain,
  protocol: MorphoProtocol,
  marketId: Hex,
  fetchImpl?: typeof fetch,
): Promise<MorphoMarketParams | null> => {
  const listing = await fetchMorphoListing(protocol, chain.chain.id, marketId, fetchImpl);
  if (!listing?.listed) return null;
  return protocol === "morpho-blue"
    ? readBlueMarketParams(client, chain, marketId, listing.preLiquidations.slice(0, MAX_PRE_LIQUIDATIONS))
    : readMidnightMarketParams(client, chain, marketId);
};

/**
 * A saved alert's parameters brought up to date. Only a Blue market's pre-liquidation contracts can change (anyone can
 * create one with Morpho's factory after the alert was saved); everything else is fixed when the market is created, so
 * it stays as stored. The stored contracts are checked again with the API's, so an API answer that leaves one out never
 * drops it, and they come first when the list is cut at MAX_PRE_LIQUIDATIONS. Keeps `stored` when the API or the chain
 * cannot answer, so editing an alert never depends on them, and a market delisted since keeps its alert.
 */
export const refreshMarketParams = async (
  client: MorphoClient,
  chain: MorphoChain,
  marketId: Hex,
  stored: MorphoMarketParams,
  fetchImpl?: typeof fetch,
): Promise<MorphoMarketParams> => {
  if (stored.kind !== "blue") return stored;
  try {
    const listing = await fetchMorphoListing("morpho-blue", chain.chain.id, marketId, fetchImpl);
    if (!listing) return stored;
    const candidates = [
      ...new Set([...stored.preLiquidations.map(({ address }) => address), ...listing.preLiquidations].map(getAddress)),
    ];
    const fresh = await readBlueMarketParams(client, chain, marketId, candidates.slice(0, MAX_PRE_LIQUIDATIONS));
    return fresh ? { ...stored, preLiquidations: fresh.preLiquidations } : stored;
  } catch (error) {
    console.error("refreshMarketParams: kept the stored parameters", error);
    return stored;
  }
};
