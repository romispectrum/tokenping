"use client";

import { useCallback, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useSubscription } from "~~/hooks/custom/useSubscription";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { formatTokenAmount } from "~~/utils/format";
import type { AllowedChainIds } from "~~/utils/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const USDC_DECIMALS = 6;

type SubscriptionPaywallProps = {
  children: React.ReactNode;
  /** Optional description shown above the pay CTA when not subscribed */
  description?: string;
};

export function SubscriptionPaywall({ children, description }: SubscriptionPaywallProps) {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const {
    paymentChainId,
    paymentTokenAddress,
    isActive,
    plan,
    subscription,
    refetch,
    payAsync,
    approveAsync,
    isPayPending,
    isApprovePending,
  } = useSubscription();

  const { data: paymentsContract } = useDeployedContractInfo({
    contractName: "TokenpingPaywall",
    chainId: (paymentChainId ?? undefined) as unknown as AllowedChainIds | undefined,
  });

  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!address || !plan?.enabled || !plan.price || !paymentTokenAddress || !paymentsContract?.address) {
      notification.error("Subscription not available. Check plan and wallet.");
      return;
    }
    if (chain?.id !== paymentChainId) {
      notification.error("Switch to the correct network to subscribe.");
      return;
    }

    setIsSubscribing(true);
    try {
      await approveAsync({
        functionName: "approve",
        args: [paymentsContract.address as `0x${string}`, plan.price],
      });
      await payAsync({
        functionName: "pay",
        args: [paymentTokenAddress as `0x${string}`],
      });
      notification.success("Subscription active. You can now configure notifications.");
      refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Subscribe failed";
      notification.error(msg);
    } finally {
      setIsSubscribing(false);
    }
  }, [
    address,
    plan,
    paymentTokenAddress,
    paymentsContract?.address,
    chain?.id,
    paymentChainId,
    approveAsync,
    payAsync,
    refetch,
  ]);

  if (isActive) {
    return (
      <div className="space-y-2">
        {subscription?.expiryTimestamp != null && subscription.expiryTimestamp > 0n && (
          <p className="text-[10px] text-emerald-400/80">
            Subscribed · Access until{" "}
            {new Date(Number(subscription.expiryTimestamp) * 1000).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        )}
        {children}
      </div>
    );
  }

  const busy = isSubscribing || isPayPending || isApprovePending;
  const onCorrectChain = chain?.id === paymentChainId;
  const canSubscribe = Boolean(onCorrectChain && plan?.enabled && plan.price > 0n && paymentTokenAddress);

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
            Subscribe to configure notifications
          </h3>
          <p className="mb-4 max-w-[280px] text-xs text-base-content/70 dark:text-gray-400">
            {description ??
              "Pay once to unlock notification settings. You can set health factor alerts per network after subscribing."}
          </p>

          {!address ? (
            <p className="text-xs text-amber-400">Connect your wallet to subscribe.</p>
          ) : !paymentChainId ? (
            <p className="text-xs text-amber-400">Payment contract not configured for this network.</p>
          ) : !onCorrectChain ? (
            <div className="space-y-2">
              <p className="text-xs text-base-content/70 dark:text-gray-400">
                Switch to the subscription network to pay.
              </p>
              <button
                type="button"
                onClick={() => switchChain?.({ chainId: paymentChainId })}
                className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-300 transition-all hover:bg-amber-500/30"
              >
                Switch network
              </button>
            </div>
          ) : !plan?.enabled ? (
            <p className="text-xs text-amber-400">No subscription plan is available at the moment.</p>
          ) : (
            <div className="w-full max-w-xs space-y-3">
              <div className="rounded-lg border border-base-300 bg-base-200 dark:border-white/10 dark:bg-white/5 px-3 py-2 text-sm text-base-content">
                <span className="text-base-content/70 dark:text-gray-400">Price: </span>
                <span className="font-semibold text-base-content dark:text-white">
                  {formatTokenAmount(plan.price, USDC_DECIMALS)} USDC
                </span>
                <span className="ml-1 text-xs text-base-content/60 dark:text-gray-500">
                  (≈ {((Number(plan.durationBlocks) * 12) / 86400).toFixed(0)} days access)
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={busy || !canSubscribe}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-all shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Processing..." : "Subscribe with USDC"}
              </button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
