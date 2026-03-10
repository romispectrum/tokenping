"use client";

import { useMemo } from "react";
import { erc20Abi } from "viem";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { getPaymentChainId, getPaymentContractAddress, getPaymentTokenCandidates } from "~~/constants/payments";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import type { AllowedChainIds } from "~~/utils/scaffold-eth";

const PAYMENTS_CHAIN_ID = getPaymentChainId();
const expiryTimestampByUserAbi = [
  {
    type: "function",
    name: "expiryTimestampByUser",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const plansByTokenAbi = [
  {
    type: "function",
    name: "plans",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "durationSeconds", type: "uint256" },
      { name: "enabled", type: "bool" },
    ],
  },
] as const;

export type SubscriptionPlan = {
  price: bigint;
  durationSeconds: bigint;
  enabled: boolean;
};

export type SubscriptionInfo = {
  expiryTimestamp: bigint;
  active: boolean;
};

export function useSubscription() {
  const { address } = useAccount();
  const paymentChainId = PAYMENTS_CHAIN_ID;
  const paymentContractAddress = paymentChainId != null ? getPaymentContractAddress(paymentChainId) : null;
  const paymentTokenCandidates = useMemo(
    () => (paymentChainId != null ? getPaymentTokenCandidates(paymentChainId) : []),
    [paymentChainId],
  );

  const chainId = (paymentChainId ?? undefined) as unknown as AllowedChainIds | undefined;

  const { data: isActive, refetch: refetchActive } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "isActive",
    args: (address ? [address] : [undefined]) as readonly [string | undefined],
    chainId,
  });

  const { data: plansResults, refetch: refetchPlans } = useReadContracts({
    contracts:
      paymentContractAddress && chainId != null
        ? paymentTokenCandidates.map(token => ({
            address: paymentContractAddress as `0x${string}`,
            abi: plansByTokenAbi,
            functionName: "plans",
            args: [token as `0x${string}`] as const,
            chainId,
          }))
        : [],
    query: {
      enabled: Boolean(paymentContractAddress && chainId != null && paymentTokenCandidates.length > 0),
    },
  });

  const selectedPlanByToken = useMemo(() => {
    if (!plansResults || paymentTokenCandidates.length === 0) return null;
    const byToken = plansResults
      .map((entry, index) => {
        if (entry.status !== "success" || !Array.isArray(entry.result) || entry.result.length < 3) return null;
        const [price, durationSeconds, enabled] = entry.result;
        return {
          token: paymentTokenCandidates[index],
          plan: { price: price as bigint, durationSeconds: durationSeconds as bigint, enabled: Boolean(enabled) },
        };
      })
      .filter(Boolean) as { token: string; plan: SubscriptionPlan }[];

    if (byToken.length === 0) return null;

    const enabledPlan = byToken.find(({ plan }) => plan.enabled && plan.price > 0n && plan.durationSeconds > 0n);
    if (enabledPlan) return enabledPlan;
    return byToken[0];
  }, [plansResults, paymentTokenCandidates]);

  const paymentTokenAddress = selectedPlanByToken?.token ?? paymentTokenCandidates[0] ?? null;
  const plan = selectedPlanByToken?.plan ?? null;

  const { data: expiryTimestamp, refetch: refetchExpiryTimestamp } = useReadContract({
    abi: expiryTimestampByUserAbi,
    address: (paymentContractAddress ?? undefined) as `0x${string}` | undefined,
    functionName: "expiryTimestampByUser",
    args: (address ? [address as `0x${string}`] : undefined) as readonly [`0x${string}`] | undefined,
    chainId,
    query: {
      enabled: Boolean(address && chainId != null && paymentContractAddress),
    },
  });

  const { writeContractAsync: payAsync, isPending: isPayPending } = useScaffoldWriteContract({
    contractName: "TokenpingPaywall",
    chainId,
  });

  const { writeContractAsync: writeApproveAsync, isPending: isApprovePending } = useWriteContract();

  const { data: currentAllowance } = useReadContract({
    address: (paymentTokenAddress ?? undefined) as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && paymentContractAddress
        ? [address as `0x${string}`, paymentContractAddress as `0x${string}`]
        : undefined,
    chainId,
    query: {
      enabled: Boolean(address && paymentContractAddress && paymentTokenAddress),
    },
  });

  const subscription: SubscriptionInfo | null = useMemo(() => {
    return {
      expiryTimestamp: (expiryTimestamp as bigint | undefined) ?? 0n,
      active: Boolean(isActive),
    };
  }, [expiryTimestamp, isActive]);

  const refetch = () => {
    refetchActive();
    refetchPlans();
    refetchExpiryTimestamp();
  };

  /** Approve only the exact amount required for payment (never unlimited or excess). */
  const approveAsync = async (spender: `0x${string}`, amount: bigint) => {
    if (!paymentTokenAddress) throw new Error("Payment token is not configured");
    if (amount <= 0n) throw new Error("Approval amount must be positive");
    return writeApproveAsync({
      abi: erc20Abi,
      address: paymentTokenAddress as `0x${string}`,
      functionName: "approve",
      args: [spender, amount],
      chainId,
    });
  };

  return {
    paymentChainId,
    paymentTokenAddress,
    isActive: Boolean(isActive),
    plan,
    subscription,
    refetch,
    payAsync,
    approveAsync,
    currentAllowance: currentAllowance ?? 0n,
    isPayPending,
    isApprovePending,
  };
}
