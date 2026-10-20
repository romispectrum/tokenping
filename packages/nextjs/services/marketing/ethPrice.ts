import "server-only";
import { createPublicClient, parseAbi } from "viem";
import { mainnet } from "viem/chains";
import { getFallbackTransport } from "~~/utils/rpc";

/** Seconds; how often /api/eth-price reads the pool again. */
export const ETH_PRICE_REVALIDATE_SECONDS = 300;

// Uniswap V2's DAI/WETH pool on Ethereum, the one Scaffold-ETH's price hook read from the browser. A pair sorts its
// tokens by address, so token0 is DAI and token1 is WETH; both have 18 decimals.
export const DAI_WETH_PAIR = "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11";
const PAIR_ABI = parseAbi([
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
]);

/**
 * The ETH price in US dollars (DAI per WETH in the pool), to the cent, or null when the chain cannot be read. Read on
 * the server so that the footer sends no RPC call from visitors' browsers: a refused or rate-limited call was a console
 * error on every page.
 */
export const readEthPrice = async (): Promise<number | null> => {
  // Each endpoint is tried once: the footer leaves the price out until the next read.
  const client = createPublicClient({ chain: mainnet, transport: getFallbackTransport(mainnet, { retryCount: 0 }) });
  try {
    const [daiReserve, wethReserve] = await client.readContract({
      address: DAI_WETH_PAIR,
      abi: PAIR_ABI,
      functionName: "getReserves",
    });
    if (wethReserve === 0n) return null;
    return Number((daiReserve * 100n) / wethReserve) / 100;
  } catch (error) {
    console.error("readEthPrice: getReserves() failed on Ethereum", error);
    return null;
  }
};
