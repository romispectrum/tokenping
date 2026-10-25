import { type Address, type Hex, getAddress, isAddress } from "viem";
import { MORPHO_API_URL, MORPHO_CHAINS, MORPHO_MIDNIGHT_CHAINS } from "~~/config/morpho";
import { isMorphoMarketId } from "~~/config/protocols";
import type { MorphoProtocol } from "~~/config/protocols";

// Morpho's public API, used for two things only: finding which listed markets a wallet borrows in (the dashboard), and
// whether a market is listed, with its pre-liquidation contracts (saving an alert). Health is never taken from it: the
// readers in services/morpho/health.ts compute it on-chain. No SLA and 750 requests a minute, so callers must cope
// with it being down. Answers are untrusted: ids, chains and addresses are checked before use.

const TIMEOUT_MS = 10_000;
const PAGE_SIZE = 100;
// Enough for any real wallet (10,000 positions); stops a misbehaving cursor from looping.
const MAX_PAGES = 100;

export class MorphoApiError extends Error {}

type Fetch = typeof fetch;

/** A listed Morpho market a wallet borrows in, as found by the API. */
export type MorphoPositionRef = {
  protocol: MorphoProtocol;
  chainId: number;
  marketId: Hex;
  /** Blue only: the pre-liquidation contracts the API knows for the market (checked on-chain before use). */
  preLiquidations: Address[];
};

const BLUE_CHAIN_IDS = new Set(MORPHO_CHAINS.map(({ chain }) => chain.id));
const MIDNIGHT_CHAIN_IDS = MORPHO_MIDNIGHT_CHAINS.map(({ chain }) => chain.id);

const request = async (fetchImpl: Fetch, url: string, init?: RequestInit) => {
  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new MorphoApiError(`Morpho API unreachable: ${String(error)}`);
  }
  if (!response.ok) throw new MorphoApiError(`Morpho API answered ${response.status}`);
  return (await response.json()) as unknown;
};

const graphql = async <T>(fetchImpl: Fetch, query: string, variables: Record<string, unknown>) => {
  const body = (await request(fetchImpl, `${MORPHO_API_URL}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })) as { data?: T; errors?: unknown[] };
  if (body.errors?.length || !body.data) throw new MorphoApiError("Morpho API returned GraphQL errors");
  return body.data;
};

const preLiquidationAddresses = (items: unknown): Address[] =>
  (Array.isArray(items) ? items : []).flatMap((item: { address?: unknown }) =>
    typeof item?.address === "string" && isAddress(item.address) ? [getAddress(item.address)] : [],
  );

const BLUE_POSITIONS_QUERY = `query BluePositions($user: [String!], $first: Int, $skip: Int) {
  marketPositions(first: $first, skip: $skip, where: { userAddress_in: $user, borrowShares_gte: "1", marketListed: true }) {
    pageInfo { countTotal count }
    items { market { marketId listed chain { id } preLiquidations(first: 20) { items { address } } } }
  }
}`;

type BluePositionsData = {
  marketPositions: {
    pageInfo: { countTotal: number; count: number };
    items: {
      market: { marketId: string; listed: boolean; chain: { id: number }; preLiquidations?: { items?: unknown } };
    }[];
  };
};

const fetchBluePositions = async (address: Address, fetchImpl: Fetch): Promise<MorphoPositionRef[]> => {
  const positions: MorphoPositionRef[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { marketPositions } = await graphql<BluePositionsData>(fetchImpl, BLUE_POSITIONS_QUERY, {
      user: [address],
      first: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    });
    for (const { market } of marketPositions.items) {
      const marketId = market.marketId?.toLowerCase();
      if (!market.listed || !BLUE_CHAIN_IDS.has(market.chain?.id) || !isMorphoMarketId(marketId)) continue;
      positions.push({
        protocol: "morpho-blue",
        chainId: market.chain.id,
        marketId: marketId as Hex,
        preLiquidations: preLiquidationAddresses(market.preLiquidations?.items),
      });
    }
    if ((page + 1) * PAGE_SIZE >= marketPositions.pageInfo.countTotal || marketPositions.items.length === 0) break;
  }
  return positions;
};

type MidnightPositionsData = {
  cursor: string | null;
  data: { chain_id: number; market_id: string; type: string; debt: string }[];
};

const fetchMidnightPositions = async (address: Address, fetchImpl: Fetch): Promise<MorphoPositionRef[]> => {
  const positions: MorphoPositionRef[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      types: "borrow",
      listed: "true",
      chain_ids: MIDNIGHT_CHAIN_IDS.join(","),
      limit: String(PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
    });
    const body = (await request(
      fetchImpl,
      `${MORPHO_API_URL}/v0/midnight/users/${address}/positions?${params}`,
    )) as MidnightPositionsData;
    for (const { chain_id, market_id, type, debt } of body.data ?? []) {
      const marketId = market_id?.toLowerCase();
      if (type !== "borrow" || debt === "0" || !MIDNIGHT_CHAIN_IDS.includes(chain_id) || !isMorphoMarketId(marketId))
        continue;
      positions.push({
        protocol: "morpho-midnight",
        chainId: chain_id,
        marketId: marketId as Hex,
        preLiquidations: [],
      });
    }
    cursor = body.cursor ?? null;
    if (!cursor) break;
  }
  return positions;
};

/** Every listed Morpho Blue and Midnight market the wallet borrows in, on the chains Tokenping covers. */
export const fetchMorphoPositions = async (address: Address, fetchImpl: Fetch = fetch) => {
  const [blue, midnight] = await Promise.all([
    fetchBluePositions(address, fetchImpl),
    fetchMidnightPositions(address, fetchImpl),
  ]);
  return [...blue, ...midnight];
};

/** Whether a market is listed and, for Blue, its pre-liquidation contracts. Null when the API does not know it. */
export type MorphoListing = { listed: boolean; preLiquidations: Address[] };

const BLUE_MARKET_QUERY = `query BlueMarket($marketId: String!, $chainId: Int!) {
  marketById(marketId: $marketId, chainId: $chainId) { marketId listed preLiquidations(first: 20) { items { address } } }
}`;

export const fetchMorphoListing = async (
  protocol: MorphoProtocol,
  chainId: number,
  marketId: Hex,
  fetchImpl: Fetch = fetch,
): Promise<MorphoListing | null> => {
  if (protocol === "morpho-blue") {
    const { marketById } = await graphql<{
      marketById: { marketId: string; listed: boolean; preLiquidations?: { items?: unknown } } | null;
    }>(fetchImpl, BLUE_MARKET_QUERY, { marketId, chainId });
    if (!marketById || marketById.marketId?.toLowerCase() !== marketId.toLowerCase()) return null;
    return {
      listed: marketById.listed === true,
      preLiquidations: preLiquidationAddresses(marketById.preLiquidations?.items),
    };
  }
  const params = new URLSearchParams({ market_ids: marketId, chain_ids: String(chainId) });
  const body = (await request(fetchImpl, `${MORPHO_API_URL}/v0/midnight/markets?${params}`)) as {
    data?: { market_id: string; chain_id: number; listed: boolean }[];
  };
  const market = body.data?.find(
    ({ market_id, chain_id }) => market_id?.toLowerCase() === marketId.toLowerCase() && chain_id === chainId,
  );
  return market ? { listed: market.listed === true, preLiquidations: [] } : null;
};
