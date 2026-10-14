import type { Address } from "viem";
import { arbitrum, mainnet } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import type { ContractAbi, GenericContract } from "~~/utils/scaffold-eth/contract";
import type { AllowedChainIds } from "~~/utils/scaffold-eth/networks";

// Imported by server code (checkAccess), so only type imports from utils/scaffold-eth.
const CONTRACTS_BY_CHAIN: Partial<Record<number, Partial<Record<string, GenericContract>>>> = deployedContracts;

/** Circle's USDC per chain. Mixed-case addresses must carry a valid EIP-55 checksum: viem rejects any other. */
export const CANONICAL_USDC: Partial<Record<number, Address>> = {
  [mainnet.id]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [arbitrum.id]: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
};

export const getPaywallContract = (chainId: number) => CONTRACTS_BY_CHAIN[chainId]?.TokenpingPaywall;

/** First target network with a TokenpingPaywall deployment; every paywall read and write is pinned to it. */
export const PAYMENT_CHAIN_ID: AllowedChainIds | undefined = scaffoldConfig.targetNetworks.find(chain =>
  getPaywallContract(chain.id),
)?.id;

const PAYWALL_CONTRACT = PAYMENT_CHAIN_ID === undefined ? undefined : getPaywallContract(PAYMENT_CHAIN_ID);

export const PAYMENT_CONTRACT_ADDRESS = PAYWALL_CONTRACT?.address;

// The paywall ABI is identical on every chain, so the configured network's generated type fits any deployment.
export const PAYWALL_ABI = PAYWALL_CONTRACT?.abi as ContractAbi<"TokenpingPaywall"> | undefined;

/** Order matters: the first candidate is the default, and each must match a plan configured on the paywall. */
const getPaymentTokenCandidates = (chainId: number): readonly Address[] => {
  const contracts = CONTRACTS_BY_CHAIN[chainId];
  if (!contracts?.TokenpingPaywall) return [];
  if (contracts.MockUSDC?.address) return [contracts.MockUSDC.address];
  const usdc = CANONICAL_USDC[chainId];
  return usdc ? [usdc] : [];
};

export const PAYMENT_TOKEN_CANDIDATES =
  PAYMENT_CHAIN_ID === undefined ? [] : getPaymentTokenCandidates(PAYMENT_CHAIN_ID);

export const PAYMENT_TOKEN_ADDRESS: Address | undefined = PAYMENT_TOKEN_CANDIDATES[0];

/** The paywall UI prices access in a USDC-like token (MockUSDC locally). */
export const PAYMENT_TOKEN_DECIMALS = 6;
export const PAYMENT_TOKEN_SYMBOL = "USDC";

export const SECONDS_PER_DAY = 24 * 60 * 60;
