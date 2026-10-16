import { type Chain, createPublicClient } from "viem";
import { getFallbackTransport } from "~~/utils/rpc";

// Raw viem rather than SE-2's scaffold hooks: these reads span many external chains that are not in
// scaffold.config targetNetworks, and the Aave contracts are not in deployedContracts/externalContracts.
// Multicall batching packs each round of parallel reads (every market on the chain, every reserve, then their token
// metadata) into a few aggregate3 calls (viem splits a batch at about 1 KB of calldata) instead of one eth_call per
// read.
export const createAaveClient = (chain: Chain) =>
  createPublicClient({ chain, transport: getFallbackTransport(chain), batch: { multicall: true } });

export type AaveClient = ReturnType<typeof createAaveClient>;

export type AaveClientFor = (chain: Chain) => AaveClient;

/** One client per chain for the life of the cache, so every market on a chain shares its multicall batches. */
export const createAaveClientCache = (): AaveClientFor => {
  const clients = new Map<number, AaveClient>();
  return chain => {
    let client = clients.get(chain.id);
    if (!client) {
      client = createAaveClient(chain);
      clients.set(chain.id, client);
    }
    return client;
  };
};
