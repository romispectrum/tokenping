import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

const contractsByChain = deployedContracts as Record<number, Record<string, { address: string }> | undefined>;

/**
 * Chain ID where TokenpingPayments is deployed (first target network that has it).
 */
export function getPaymentChainId(): number | null {
  for (const chain of scaffoldConfig.targetNetworks) {
    if (contractsByChain[chain.id]?.TokenpingPayments) return chain.id;
  }
  return null;
}

/**
 * Payment token address for subscription (e.g. MockUSDC on local).
 * Must match a plan configured on TokenpingPayments.
 */
export function getPaymentTokenAddress(chainId: number): string | null {
  const contracts = contractsByChain[chainId];
  if (!contracts?.TokenpingPayments) return null;
  return contracts.MockUSDC?.address ?? null;
}
