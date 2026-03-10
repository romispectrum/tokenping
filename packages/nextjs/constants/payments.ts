import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

const contractsByChain = deployedContracts as Record<number, Record<string, { address: string }> | undefined>;
const MAINNET_USDC = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const ARBITRUM_USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

/**
 * Chain ID where TokenpingPaywall is deployed (first target network that has it).
 */
export function getPaymentChainId(): number | null {
  for (const chain of scaffoldConfig.targetNetworks) {
    if (contractsByChain[chain.id]?.TokenpingPaywall) return chain.id;
  }
  return null;
}

export function getPaymentContractAddress(chainId: number): string | null {
  const contracts = contractsByChain[chainId];
  return contracts?.TokenpingPaywall?.address ?? null;
}

/**
 * Payment token address for subscription (e.g. MockUSDC on local).
 * Must match a plan configured on TokenpingPaywall.
 */
export function getPaymentTokenAddress(chainId: number): string | null {
  const contracts = contractsByChain[chainId];
  if (!contracts?.TokenpingPaywall) return null;
  if (contracts.MockUSDC?.address) return contracts.MockUSDC.address;
  if (chainId === 42161) return ARBITRUM_USDC;
  if (chainId === 1) return MAINNET_USDC;
  return null;
}
