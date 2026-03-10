"use client";

import { useMemo } from "react";
import { erc20Abi } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getPaymentChainId, getPaymentContractAddress, getPaymentTokenAddress } from "~~/constants/payments";
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
  const paymentTokenAddress = paymentChainId != null ? getPaymentTokenAddress(paymentChainId) : null;
  const paymentContractAddress = paymentChainId != null ? getPaymentContractAddress(paymentChainId) : null;

  const chainId = (paymentChainId ?? undefined) as unknown as AllowedChainIds | undefined;

  const { data: isActive, refetch: refetchActive } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "isActive",
    args: (address ? [address] : [undefined]) as readonly [string | undefined],
    chainId,
  });

  const { data: planTuple, refetch: refetchPlan } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "plans",
    args: (paymentTokenAddress ? [paymentTokenAddress as `0x${string}`] : [undefined]) as readonly [
      `0x${string}` | undefined,
    ],
    chainId,
  });

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

  const plan: SubscriptionPlan | null = useMemo(() => {
    if (!planTuple || !Array.isArray(planTuple) || planTuple.length < 3) return null;
    const [price, durationSeconds, enabled] = planTuple;
    return { price: price as bigint, durationSeconds: durationSeconds as bigint, enabled: Boolean(enabled) };
  }, [planTuple]);

  const subscription: SubscriptionInfo | null = useMemo(() => {
    return {
      expiryTimestamp: (expiryTimestamp as bigint | undefined) ?? 0n,
      active: Boolean(isActive),
    };
  }, [expiryTimestamp, isActive]);

  const refetch = () => {
    refetchActive();
    refetchPlan();
    refetchExpiryTimestamp();
  };

  const approveAsync = async (spender: `0x${string}`, amount: bigint) => {
    if (!paymentTokenAddress) throw new Error("Payment token is not configured");
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
    isPayPending,
    isApprovePending,
  };
}
