"use client";

import { useMemo } from "react";
import { type Address, erc20Abi } from "viem";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import {
  PAYMENT_CHAIN_ID,
  PAYMENT_CONTRACT_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
  PAYMENT_TOKEN_CANDIDATES,
  PAYWALL_ABI,
} from "~~/constants/payments";
import {
  useDeployedContractInfo,
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useTransactor,
} from "~~/hooks/scaffold-eth";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { getPaywallStatus } from "~~/services/payments/paywallStatus";
import { findTokenPlan, selectPaymentPlan } from "~~/services/payments/plans";
import type { ContractAbi } from "~~/utils/scaffold-eth/contract";

type PaywallAbi = ContractAbi<"TokenpingPaywall">;

/**
 * `isActive`: whether an isActive read after the payment showed the access. `error` is only set when the user has not
 * been told yet: SE-2 toasts its own transaction and simulation errors.
 */
export type PayForAccessResult = { paid: true; isActive: boolean } | { paid: false; error?: string };

// Polled only while paused, so Pay comes back after an unpause: window-focus refetches are off app-wide.
const PAUSED_POLL_INTERVAL_MS = 30_000;

// After the pay receipt, isActive can be answered by an RPC node that has not seen that block yet.
const ACCESS_CHECK_ATTEMPTS = 5;
const ACCESS_CHECK_INTERVAL_MS = 2_000;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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

const PLAN_READS = getPlanReads();

const IS_PAYWALL_CONFIGURED = PAYMENT_CHAIN_ID !== undefined && Boolean(PAYMENT_CONTRACT_ADDRESS);

// Plans, expiry, paused and allowance are raw wagmi reads. useScaffoldReadContract would run one more uncached
// getBytecode check (useDeployedContractInfo) per read and per useAccess instance, and watches every block by
// default. The plans are one batched read and the allowance is on the ERC-20; the scaffold read hook covers neither.
export const useAccess = () => {
  const { address, chain } = useAccount();
  // The error messages payForAccess returns, in the page's language.
  const t = useMessages(DASHBOARD_MESSAGES).paywall;

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
    query: { enabled: Boolean(address && IS_PAYWALL_CONFIGURED) },
  });

  const {
    data: isPaused,
    isError: isPausedError,
    refetch: refetchPaused,
  } = useReadContract<PaywallAbi, "paused", readonly []>({
    abi: PAYWALL_ABI,
    address: PAYMENT_CONTRACT_ADDRESS,
    functionName: "paused",
    chainId: PAYMENT_CHAIN_ID,
    query: {
      enabled: IS_PAYWALL_CONFIGURED,
      refetchInterval: query => (query.state.data ? PAUSED_POLL_INTERVAL_MS : false),
    },
  });

  const {
    data: allowance,
    isError: isAllowanceError,
    refetch: refetchAllowance,
  } = useReadContract({
    address: paymentTokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && PAYMENT_CONTRACT_ADDRESS ? [address, PAYMENT_CONTRACT_ADDRESS] : undefined,
    chainId: PAYMENT_CHAIN_ID,
    query: { enabled: Boolean(address && PAYMENT_CONTRACT_ADDRESS && paymentTokenAddress) },
  });

  // Confirms the paywall has code on chain before anything is approved to it.
  const { data: paywallContract, isLoading: isPaywallCheckLoading } = useDeployedContractInfo({
    contractName: "TokenpingPaywall",
    chainId: PAYMENT_CHAIN_ID,
  });

  const status = getPaywallStatus({
    address,
    paymentChainId: PAYMENT_CHAIN_ID,
    onCorrectChain: chain !== undefined && chain.id === PAYMENT_CHAIN_ID,
    plan,
    paymentTokenAddress,
    isPaywallDeployed: isPaywallCheckLoading ? undefined : Boolean(paywallContract),
    isPaused,
    allowance,
    hasReadError: isPausedError || isAllowanceError,
  });

  const { writeContractAsync: payAsync } = useScaffoldWriteContract({
    contractName: "TokenpingPaywall",
    chainId: PAYMENT_CHAIN_ID,
  });

  const { writeContractAsync: writeApproveAsync } = useWriteContract();
  const writeTx = useTransactor();

  /** Re-reads isActive (and the expiry with it) until it shows the payment, at most ACCESS_CHECK_ATTEMPTS times. */
  const confirmAccess = async () => {
    for (let attempt = 1; ; attempt++) {
      const [active] = await Promise.all([refetchActive(), refetchExpiryTimestamp()]);
      if (!active.isError && active.data === true) return true;
      if (attempt === ACCESS_CHECK_ATTEMPTS) return false;
      await wait(ACCESS_CHECK_INTERVAL_MS);
    }
  };

  /** Fresh plan, paused() and allowance reads, an exact-amount approve (mined before `pay` is simulated), then pay. */
  const payForAccess = async (): Promise<PayForAccessResult> => {
    const spender = paywallContract?.address;
    // A payable status implies the wallet, the token and the paywall; checking them again narrows their types.
    if (status.kind !== "ready" || !status.canPay || !address || !paymentTokenAddress || !spender) {
      return { paid: false, error: t.unavailable };
    }

    // The cached reads may predate an owner change (price, plan, pause) or a confirmed approve. A failed refetch
    // resolves with the last cached value, so its error flag decides, not just the data.
    const [plans, paused, current] = await Promise.all([refetchPlans(), refetchPaused(), refetchAllowance()]);
    if (paused.isError || paused.data === undefined || current.isError || current.data === undefined) {
      return { paid: false, error: t.checkFailed };
    }
    // pay(token) charges plans[token] as stored when it runs, so the approve amount and the guard use the fresh plan
    // of the token whose allowance was just read, never the one cached at render.
    const plan = plans.isError ? null : findTokenPlan(plans.data, PAYMENT_TOKEN_CANDIDATES, paymentTokenAddress);
    if (!plan?.enabled || plan.price === 0n) return { paid: false, error: t.unavailable };
    if (paused.data) return { paid: false, error: t.paused };
    const { price } = plan;

    try {
      if (current.data < price) {
        // Exactly the price, never an unlimited approval. useTransactor resolves once the approve is mined.
        const approveHash = await writeTx(() =>
          writeApproveAsync({
            abi: erc20Abi,
            address: paymentTokenAddress,
            functionName: "approve",
            args: [spender, price],
            chainId: PAYMENT_CHAIN_ID,
          }),
        );
        if (!approveHash) return { paid: false };
        const approved = await refetchAllowance();
        if (approved.isError || approved.data === undefined || approved.data < price) {
          return { paid: false, error: t.approvalNotVisible };
        }
      }
      // undefined: nothing was sent (e.g. wallet on the wrong network), and SE-2 has said why.
      const payHash = await payAsync({ functionName: "pay", args: [paymentTokenAddress] });
      if (!payHash) return { paid: false };
    } catch {
      // useTransactor and the scaffold `pay` simulation have already toasted the error.
      return { paid: false };
    }

    // Awaited, so the paywall swaps to the children together with the success message, not a round trip later.
    const [hasAccess] = await Promise.all([confirmAccess(), refetchPlans(), refetchAllowance(), refetchPaused()]);
    return { paid: true, isActive: hasAccess };
  };

  return {
    isActive: Boolean(isActive),
    expiryTimestamp: expiryTimestamp ?? 0n,
    status,
    payForAccess,
  };
};
