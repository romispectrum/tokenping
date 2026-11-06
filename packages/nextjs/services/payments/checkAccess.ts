import { type Address, createPublicClient } from "viem";
import { PAYMENT_CHAIN_ID, getPaywallContract } from "~~/constants/payments";
import scaffoldConfig from "~~/scaffold.config";
import { getConfiguredTransport, getFallbackTransport } from "~~/utils/rpc";

/**
 * Fails closed: any missing configuration or RPC error counts as no access. Asked through the app's own RPC when it has
 * one, never a public endpoint it would otherwise fall back to, since an answer of `true` opens the paid features.
 */
export const isAccessActive = async (userAddress: string): Promise<boolean> => {
  if (PAYMENT_CHAIN_ID === undefined) return false;
  const contract = getPaywallContract(PAYMENT_CHAIN_ID);
  if (!contract?.address || !contract.abi) return false;

  const chain = scaffoldConfig.targetNetworks.find(({ id }) => id === PAYMENT_CHAIN_ID);
  if (!chain) return false;

  const client = createPublicClient({
    chain,
    transport: getConfiguredTransport(chain.id) ?? getFallbackTransport(chain),
  });
  try {
    const active = await client.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "isActive",
      args: [userAddress as Address],
    });
    return active === true;
  } catch (error) {
    console.error(`isAccessActive: TokenpingPaywall.isActive read failed on chain ${PAYMENT_CHAIN_ID}`, error);
    return false;
  }
};
