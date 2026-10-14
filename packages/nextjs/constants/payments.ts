import type { Address } from "viem";
import { arbitrum, mainnet } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import type { ContractAbi, GenericContract } from "~~/utils/scaffold-eth/contract";
import type { AllowedChainIds } from "~~/utils/scaffold-eth/networks";

// Imported by server code (checkAccess), so only type imports from utils/scaffold-eth.
const CONTRACTS_BY_CHAIN: Partial<Record<number, Partial<Record<string, GenericContract>>>> = deployedContracts;

const MAINNET_USDC: Address = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const ARBITRUM_USDC: Address = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

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
  if (chainId === arbitrum.id) return [ARBITRUM_USDC];
  if (chainId === mainnet.id) return [MAINNET_USDC];
  return [];
};

export const PAYMENT_TOKEN_CANDIDATES =
  PAYMENT_CHAIN_ID === undefined ? [] : getPaymentTokenCandidates(PAYMENT_CHAIN_ID);

export const PAYMENT_TOKEN_ADDRESS: Address | undefined = PAYMENT_TOKEN_CANDIDATES[0];

/** The paywall UI prices access in a USDC-like token (MockUSDC locally). */
export const PAYMENT_TOKEN_DECIMALS = 6;
export const PAYMENT_TOKEN_SYMBOL = "USDC";

export const SECONDS_PER_DAY = 24 * 60 * 60;
