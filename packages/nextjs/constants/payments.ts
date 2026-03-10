import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

const contractsByChain = deployedContracts as Record<number, Record<string, { address: string }> | undefined>;

/**
 * Chain ID where TokenpingPaywall is deployed (first target network that has it).
 */
export function getPaymentChainId(): number | null {
  for (const chain of scaffoldConfig.targetNetworks) {
    if (contractsByChain[chain.id]?.TokenpingPaywall) return chain.id;
  }
  return null;
}

/**
 * Payment token address for subscription (e.g. MockUSDC on local).
 * Must match a plan configured on TokenpingPaywall.
 */
export function getPaymentTokenAddress(chainId: number): string | null {
  const contracts = contractsByChain[chainId];
  if (!contracts?.TokenpingPaywall) return null;
  return contracts.MockUSDC?.address ?? null;
}
