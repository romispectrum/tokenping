"use client";

import { useCallback, useEffect, useState } from "react";
import { createPublicClient, formatUnits, http } from "viem";
import * as chains from "viem/chains";
import { useAccount } from "wagmi";
import {
  AAVE_POOL_ABI,
  AAVE_POOL_ADDRESSES,
  AAVE_POOL_DATA_PROVIDER_ABI,
  AAVE_POOL_DATA_PROVIDER_ADDRESSES,
  AAVE_SUPPORTED_CHAINS,
  CHAIN_METADATA,
  ERC20_ABI,
} from "~~/config/aaveConfig";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

export interface TokenPosition {
  asset: `0x${string}`;
  symbol: string;
  decimals: number;
  aTokenBalance: bigint;
  aTokenBalanceFormatted: string;
  stableDebt: bigint;
  stableDebtFormatted: string;
  variableDebt: bigint;
  variableDebtFormatted: string;
  usageAsCollateralEnabled: boolean;
  liquidityRate: number; // APY for supply
}

export interface NetworkPosition {
  chainId: number;
  chainName: string;
  chainIcon: string;
  chainColor: string;
  totalCollateralUSD: string;
  totalDebtUSD: string;
  availableBorrowsUSD: string;
  healthFactor: string;
  ltv: string;
  liquidationThreshold: string;
  netWorthUSD: string;
  tokens: TokenPosition[];
  hasPosition: boolean;
}

export interface AavePositionsResult {
  positions: NetworkPosition[];
  isLoading: boolean;
  error: string | null;
  totalNetWorthUSD: string;
  totalCollateralUSD: string;
  totalDebtUSD: string;
  refetch: () => void;
}

// RPC URLs for different chains
const getChainRpcUrl = (chainId: number): string => {
  const alchemyUrl = getAlchemyHttpUrl(chainId);
  if (alchemyUrl) return alchemyUrl;

  // Fallback RPC URLs
  const fallbackRpcs: Record<number, string> = {
    [chains.mainnet.id]: "https://eth.llamarpc.com",
    [chains.polygon.id]: "https://polygon.llamarpc.com",
    [chains.arbitrum.id]: "https://arb1.arbitrum.io/rpc",
    [chains.optimism.id]: "https://mainnet.optimism.io",
    [chains.base.id]: "https://mainnet.base.org",
    [chains.avalanche.id]: "https://api.avax.network/ext/bc/C/rpc",
    [chains.gnosis.id]: "https://rpc.gnosischain.com",
  };

  return fallbackRpcs[chainId] || "";
};

const createChainClient = (chain: chains.Chain) => {
  const rpcUrl = getChainRpcUrl(chain.id);
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
};

export const useAavePositions = (): AavePositionsResult => {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<NetworkPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!address || !isConnected) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const networkPositions = await Promise.all(
        AAVE_SUPPORTED_CHAINS.map(async chain => {
          const metadata = CHAIN_METADATA[chain.id];
          const poolAddress = AAVE_POOL_ADDRESSES[chain.id];
          const dataProviderAddress = AAVE_POOL_DATA_PROVIDER_ADDRESSES[chain.id];

          if (!poolAddress || !dataProviderAddress) {
            return null;
          }

          try {
            const client = createChainClient(chain);

            // Fetch user account data
            const accountData = await client.readContract({
              address: poolAddress,
              abi: AAVE_POOL_ABI,
              functionName: "getUserAccountData",
              args: [address],
            });

            const [totalCollateralBase, totalDebtBase, availableBorrowsBase, liquidationThreshold, ltv, healthFactor] =
              accountData;

            // Convert from 8 decimals (Aave base currency is USD with 8 decimals)
            const totalCollateralUSD = formatUnits(totalCollateralBase, 8);
            const totalDebtUSD = formatUnits(totalDebtBase, 8);
            const availableBorrowsUSD = formatUnits(availableBorrowsBase, 8);
            const netWorthUSD = (parseFloat(totalCollateralUSD) - parseFloat(totalDebtUSD)).toFixed(2);

            // Format health factor (18 decimals)
            const healthFactorFormatted =
              healthFactor >= BigInt("0xffffffffffffffffffffffffffffffff")
                ? "∞"
                : parseFloat(formatUnits(healthFactor, 18)).toFixed(2);

            const hasPosition = totalCollateralBase > 0n || totalDebtBase > 0n;

            // Get token positions if user has a position
            let tokens: TokenPosition[] = [];
            if (hasPosition) {
              try {
                // Get reserves list
                const reserves = await client.readContract({
                  address: poolAddress,
                  abi: AAVE_POOL_ABI,
                  functionName: "getReservesList",
                });

                // Fetch user data for each reserve in parallel
                const tokenPromises = reserves.map(async asset => {
                  try {
                    const [userData, tokenSymbol, tokenDecimals] = await Promise.all([
                      client.readContract({
                        address: dataProviderAddress,
                        abi: AAVE_POOL_DATA_PROVIDER_ABI,
                        functionName: "getUserReserveData",
                        args: [asset, address],
                      }),
                      client.readContract({
                        address: asset,
                        abi: ERC20_ABI,
                        functionName: "symbol",
                      }),
                      client.readContract({
                        address: asset,
                        abi: ERC20_ABI,
                        functionName: "decimals",
                      }),
                    ]);

                    const [
                      currentATokenBalance,
                      currentStableDebt,
                      currentVariableDebt,
                      ,
                      ,
                      ,
                      liquidityRate,
                      ,
                      usageAsCollateralEnabled,
                    ] = userData;

                    // Only include tokens where user has balance or debt
                    if (currentATokenBalance === 0n && currentStableDebt === 0n && currentVariableDebt === 0n) {
                      return null;
                    }

                    // Convert liquidityRate to APY (27 decimals -> percentage)
                    const liquidityRateAPY = parseFloat(formatUnits(liquidityRate, 25));

                    return {
                      asset,
                      symbol: tokenSymbol,
                      decimals: tokenDecimals,
                      aTokenBalance: currentATokenBalance,
                      aTokenBalanceFormatted: parseFloat(formatUnits(currentATokenBalance, tokenDecimals)).toFixed(4),
                      stableDebt: currentStableDebt,
                      stableDebtFormatted: parseFloat(formatUnits(currentStableDebt, tokenDecimals)).toFixed(4),
                      variableDebt: currentVariableDebt,
                      variableDebtFormatted: parseFloat(formatUnits(currentVariableDebt, tokenDecimals)).toFixed(4),
                      usageAsCollateralEnabled,
                      liquidityRate: liquidityRateAPY,
                    } as TokenPosition;
                  } catch {
                    return null;
                  }
                });

                const tokenResults = await Promise.all(tokenPromises);
                tokens = tokenResults.filter((t): t is TokenPosition => t !== null);
              } catch {
                // If we can't fetch token details, just show the summary
              }
            }

            return {
              chainId: chain.id,
              chainName: metadata.name,
              chainIcon: metadata.icon,
              chainColor: metadata.color,
              totalCollateralUSD: parseFloat(totalCollateralUSD).toFixed(2),
              totalDebtUSD: parseFloat(totalDebtUSD).toFixed(2),
              availableBorrowsUSD: parseFloat(availableBorrowsUSD).toFixed(2),
              healthFactor: healthFactorFormatted,
              ltv: (Number(ltv) / 100).toFixed(2),
              liquidationThreshold: (Number(liquidationThreshold) / 100).toFixed(2),
              netWorthUSD,
              tokens,
              hasPosition,
            } as NetworkPosition;
          } catch {
            // Network might not be reachable, skip it
            return null;
          }
        }),
      );

      const validPositions = networkPositions.filter((p): p is NetworkPosition => p !== null);
      setPositions(validPositions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Aave positions");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Calculate totals
  const totalNetWorthUSD = positions.reduce((sum, p) => sum + parseFloat(p.netWorthUSD), 0).toFixed(2);
  const totalCollateralUSD = positions.reduce((sum, p) => sum + parseFloat(p.totalCollateralUSD), 0).toFixed(2);
  const totalDebtUSD = positions.reduce((sum, p) => sum + parseFloat(p.totalDebtUSD), 0).toFixed(2);

  return {
    positions,
    isLoading,
    error,
    totalNetWorthUSD,
    totalCollateralUSD,
    totalDebtUSD,
    refetch: fetchPositions,
  };
};
