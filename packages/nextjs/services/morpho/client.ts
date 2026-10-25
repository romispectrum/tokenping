import { type Chain, createPublicClient } from "viem";
import { getFallbackTransport } from "~~/utils/rpc";

// Raw viem clients, as for Aave (services/aave/client.ts): Morpho's chains are outside scaffold.config's
// targetNetworks. The readers batch their own calls with client.multicall, one round at a time.

export const createMorphoClient = (chain: Chain, retryCount?: number) =>
  createPublicClient({
    chain,
    transport: getFallbackTransport(chain, retryCount === undefined ? undefined : { retryCount }),
  });

export type MorphoClient = ReturnType<typeof createMorphoClient>;

/** One client per chain for the life of the cache. */
export const createMorphoClientCache = (retryCount?: number) => {
  const clients = new Map<number, MorphoClient>();
  return (chain: Chain) => {
    let client = clients.get(chain.id);
    if (!client) {
      client = createMorphoClient(chain, retryCount);
      clients.set(chain.id, client);
    }
    return client;
  };
};
