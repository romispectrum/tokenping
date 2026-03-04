"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { getPaymentChainId, getPaymentTokenAddress } from "~~/constants/payments";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import type { AllowedChainIds } from "~~/utils/scaffold-eth";

const PAYMENTS_CHAIN_ID = getPaymentChainId();

export type SubscriptionPlan = {
  price: bigint;
  durationBlocks: bigint;
  enabled: boolean;
};

export type SubscriptionInfo = {
  expiryBlock: bigint;
  expiryTimestamp: bigint;
  active: boolean;
};

export function useSubscription() {
  const { address } = useAccount();
  const paymentChainId = PAYMENTS_CHAIN_ID;
  const paymentTokenAddress = paymentChainId != null ? getPaymentTokenAddress(paymentChainId) : null;

  const chainId = (paymentChainId ?? undefined) as unknown as AllowedChainIds | undefined;

  const { data: isActive, refetch: refetchActive } = useScaffoldReadContract({
    contractName: "TokenpingPayments",
    functionName: "isActive",
    args: (address ? [address] : [undefined]) as readonly [string | undefined],
    chainId,
  });

  const { data: planTuple, refetch: refetchPlan } = useScaffoldReadContract({
    contractName: "TokenpingPayments",
    functionName: "plans",
    args: (paymentTokenAddress ? [paymentTokenAddress as `0x${string}`] : [undefined]) as readonly [
      `0x${string}` | undefined,
    ],
    chainId,
  });

  const { data: subscriptionTuple, refetch: refetchSubscription } = useScaffoldReadContract({
    contractName: "TokenpingPayments",
    functionName: "getSubscription",
    args: (address ? [address] : [undefined]) as readonly [string | undefined],
    chainId,
  });

  const { writeContractAsync: payAsync, isPending: isPayPending } = useScaffoldWriteContract({
    contractName: "TokenpingPayments",
    chainId,
  });

  const { writeContractAsync: approveAsync, isPending: isApprovePending } = useScaffoldWriteContract({
    contractName: "MockUSDC",
    chainId,
  });

  const plan: SubscriptionPlan | null = useMemo(() => {
    if (!planTuple || !Array.isArray(planTuple) || planTuple.length < 3) return null;
    const [price, durationBlocks, enabled] = planTuple;
    return { price: price as bigint, durationBlocks: durationBlocks as bigint, enabled: Boolean(enabled) };
  }, [planTuple]);

  const subscription: SubscriptionInfo | null = useMemo(() => {
    if (!subscriptionTuple || !Array.isArray(subscriptionTuple) || subscriptionTuple.length < 3) return null;
    const [expiryBlock, expiryTimestamp, active] = subscriptionTuple;
    return {
      expiryBlock: expiryBlock as bigint,
      expiryTimestamp: expiryTimestamp as bigint,
      active: Boolean(active),
    };
  }, [subscriptionTuple]);

  const refetch = () => {
    refetchActive();
    refetchPlan();
    refetchSubscription();
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
