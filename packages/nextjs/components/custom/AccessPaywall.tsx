"use client";

import { useCallback, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useAccess } from "~~/hooks/custom/useAccess";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { formatTokenAmount } from "~~/utils/format";
import type { AllowedChainIds } from "~~/utils/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const USDC_DECIMALS = 6;

type AccessPaywallProps = {
  children: React.ReactNode;
  /** Optional description shown above the pay CTA when user has no access */
  description?: string;
  /** True when a notification config already exists in Supabase for this network */
  hasExistingConfig?: boolean;
};

export function AccessPaywall({ children, description, hasExistingConfig = false }: AccessPaywallProps) {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    paymentChainId,
    paymentTokenAddress,
    isActive,
    plan,
    access,
    refetch,
    payAsync,
    approveAsync,
    currentAllowance,
    isPayPending,
    isApprovePending,
  } = useAccess();

  const { data: paymentsContract } = useDeployedContractInfo({
    contractName: "TokenpingPaywall",
    chainId: (paymentChainId ?? undefined) as unknown as AllowedChainIds | undefined,
  });

  const [isPaying, setIsPaying] = useState(false);

  const handlePayForAccess = useCallback(async () => {
    if (!address || !plan?.enabled || !plan.price || !paymentTokenAddress || !paymentsContract?.address) {
      notification.error("Paid access not available. Check plan and wallet.");
      return;
    }
    if (chain?.id !== paymentChainId) {
      notification.error("Switch to the correct network to pay.");
      return;
    }

    setIsPaying(true);
    try {
      const spender = paymentsContract.address as `0x${string}`;
      if (currentAllowance < plan.price) {
        await approveAsync(spender, plan.price);
      }
      await payAsync({
        functionName: "pay",
        args: [paymentTokenAddress as `0x${string}`],
      });
      notification.success("Access active. You can now configure notifications.");
      refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      notification.error(msg);
    } finally {
      setIsPaying(false);
    }
  }, [
    address,
    plan,
    paymentTokenAddress,
    paymentsContract?.address,
    currentAllowance,
    chain?.id,
    paymentChainId,
    approveAsync,
    payAsync,
    refetch,
  ]);

  if (isActive) {
    return (
      <div className="space-y-2">
        {access?.expiryTimestamp != null && access.expiryTimestamp > 0n && (
          <p className="text-[10px] text-emerald-400/80">
            Access until{" "}
            {new Date(Number(access.expiryTimestamp) * 1000).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        )}
        {children}
      </div>
    );
  }

  const busy = isPaying || isPayPending || isApprovePending;
  const onCorrectChain = chain?.id === paymentChainId;
  const canPay = Boolean(onCorrectChain && plan?.enabled && plan.price > 0n && paymentTokenAddress);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-warning/40 bg-base-100 dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-amber-950/20 dark:to-gray-900/50 backdrop-blur-xl p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-sm font-semibold text-base-content dark:text-white">
            {hasExistingConfig ? "Extend access to edit notifications" : "Pay for access to configure notifications"}
          </h3>
          <p className="mb-4 max-w-[280px] text-xs text-base-content/70 dark:text-gray-400">
            {description ??
              (hasExistingConfig
                ? "Your previous notification config is saved. Pay again to extend access and edit your settings."
                : "Pay once to unlock notification settings. You set health factor alerts per network. No auto-charges—you pay from your wallet when you want to extend.")}
          </p>

          {!address ? (
            <p className="text-xs text-amber-400">Connect your wallet to pay for access.</p>
          ) : !paymentChainId ? (
            <p className="text-xs text-amber-400">Payment contract not configured for this network.</p>
          ) : !onCorrectChain ? (
            <div className="space-y-2">
              <p className="text-xs text-base-content/70 dark:text-gray-400">Switch to the paywall network to pay.</p>
              <button
                type="button"
                onClick={() => switchChain?.({ chainId: paymentChainId })}
                className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-300 transition-all hover:bg-amber-500/30"
              >
                Switch network
              </button>
            </div>
          ) : !plan?.enabled ? (
            <p className="text-xs text-amber-400">No paid plan is available at the moment.</p>
          ) : (
            <div className="w-full max-w-xs space-y-3">
              <div className="rounded-lg border border-base-300 bg-base-200 dark:border-white/10 dark:bg-white/5 px-3 py-2.5 text-sm text-base-content">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-base-content/70 dark:text-gray-400">Price: </span>
                  <span className="font-semibold text-base-content dark:text-white">
                    {formatTokenAmount(plan.price, USDC_DECIMALS)} USDC
                  </span>
                  <span className="text-sm font-medium text-base-content/90 dark:text-gray-300">
                    ≈ {(Number(plan.durationSeconds) / 86400).toFixed(0)} days access
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePayForAccess}
                disabled={busy || !canPay}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-all shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Processing..." : hasExistingConfig ? "Extend access with USDC" : "Pay for access (USDC)"}
              </button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
