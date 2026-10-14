"use client";

import { useCallback, useMemo } from "react";
import { type Address, erc20Abi } from "viem";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import {
  PAYMENT_CHAIN_ID,
  PAYMENT_CONTRACT_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
  PAYMENT_TOKEN_CANDIDATES,
  PAYWALL_ABI,
} from "~~/constants/payments";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { selectPaymentPlan } from "~~/services/payments/plans";
import type { ContractAbi } from "~~/utils/scaffold-eth/contract";

type PaywallAbi = ContractAbi<"TokenpingPaywall">;

const getPlanReads = () => {
  // Local copies: TypeScript does not carry the narrowing of imported bindings into the map callback.
  const address = PAYMENT_CONTRACT_ADDRESS;
  const abi = PAYWALL_ABI;
  const chainId = PAYMENT_CHAIN_ID;
  if (!address || !abi || chainId === undefined) return [];
  return PAYMENT_TOKEN_CANDIDATES.map(
    token => ({ address, abi, functionName: "plans", args: [token], chainId }) as const,
  );
};

// Plans, expiry and allowance use raw wagmi reads so they are not refetched every block (only isActive is).
const PLAN_READS = getPlanReads();

export const useAccess = () => {
  const { address } = useAccount();

  const { data: isActive, refetch: refetchActive } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "isActive",
    args: [address],
    chainId: PAYMENT_CHAIN_ID,
  });

  const { data: plansResults, refetch: refetchPlans } = useReadContracts({
    contracts: PLAN_READS,
    query: { enabled: PLAN_READS.length > 0 },
  });

  const selected = useMemo(() => selectPaymentPlan(plansResults, PAYMENT_TOKEN_CANDIDATES), [plansResults]);
  const paymentTokenAddress = selected?.token ?? PAYMENT_TOKEN_ADDRESS;
  const plan = selected?.plan ?? null;

  // Explicit type arguments: the possibly-undefined ABI would otherwise defeat wagmi's result inference.
  const { data: expiryTimestamp, refetch: refetchExpiryTimestamp } = useReadContract<
    PaywallAbi,
    "expiryTimestampByUser",
    readonly [Address]
  >({
    abi: PAYWALL_ABI,
    address: PAYMENT_CONTRACT_ADDRESS,
    functionName: "expiryTimestampByUser",
    args: address ? [address] : undefined,
    chainId: PAYMENT_CHAIN_ID,
    query: { enabled: Boolean(address && PAYMENT_CHAIN_ID !== undefined && PAYMENT_CONTRACT_ADDRESS) },
  });

  const { writeContractAsync: payAsync, isPending: isPayPending } = useScaffoldWriteContract({
    contractName: "TokenpingPaywall",
    chainId: PAYMENT_CHAIN_ID,
  });

  const { writeContractAsync: writeApproveAsync, isPending: isApprovePending } = useWriteContract();

  const { data: currentAllowance } = useReadContract({
    address: paymentTokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && PAYMENT_CONTRACT_ADDRESS ? [address, PAYMENT_CONTRACT_ADDRESS] : undefined,
    chainId: PAYMENT_CHAIN_ID,
    query: { enabled: Boolean(address && PAYMENT_CONTRACT_ADDRESS && paymentTokenAddress) },
  });

  // BUG(B2.0): the allowance is not refetched, so a retry after a failed pay compares against a stale allowance.
  const refetch = useCallback(() => {
    refetchActive();
    refetchPlans();
    refetchExpiryTimestamp();
  }, [refetchActive, refetchPlans, refetchExpiryTimestamp]);

  /** Approve only the exact amount required for payment (never unlimited or excess). */
  const approveAsync = useCallback(
    async (spender: Address, amount: bigint) => {
      if (!paymentTokenAddress) throw new Error("Payment token is not configured");
      if (amount <= 0n) throw new Error("Approval amount must be positive");
      return writeApproveAsync({
        abi: erc20Abi,
        address: paymentTokenAddress,
        functionName: "approve",
        args: [spender, amount],
        chainId: PAYMENT_CHAIN_ID,
      });
    },
    [paymentTokenAddress, writeApproveAsync],
  );

  return {
    paymentTokenAddress,
    isActive: Boolean(isActive),
    plan,
    expiryTimestamp: expiryTimestamp ?? 0n,
    refetch,
    payAsync,
    approveAsync,
    currentAllowance: currentAllowance ?? 0n,
    isPayPending,
    isApprovePending,
  };
};
