"use client";

import { type ReactNode, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSwitchChain } from "wagmi";
import { PAYMENT_CHAIN_ID, PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_SYMBOL } from "~~/constants/payments";
import { PAYMENTS_PAUSED_MESSAGE, useAccess } from "~~/hooks/custom/useAccess";
import { type PayNotice, formatDurationDays } from "~~/services/payments/paywallStatus";
import { normalizeAddress } from "~~/utils/address";
import { formatTokenAmount } from "~~/utils/format";
import { notification } from "~~/utils/scaffold-eth";

const STATUS_MESSAGES = {
  connectWallet: "Connect your wallet to pay for access.",
  unconfigured: "Payment contract not configured for this network.",
  noPlan: "No paid plan is available at the moment.",
};

const PAY_NOTICES: Record<PayNotice, string> = {
  paused: PAYMENTS_PAUSED_MESSAGE,
  statusUnavailable: "Could not load the payment status. Reload the page to try again.",
};

const ACCESS_ACTIVE_MESSAGE = "Access active. You can now configure notifications.";
const PAYMENT_PENDING_MESSAGE = "Payment confirmed — access will appear shortly.";

const PAID_WALLETS_QUERY_KEY = "paidAccessWallets";

type AccessPaywallProps = {
  children: ReactNode;
  /** Replaces the default copy above the pay CTA. */
  description?: string;
  /** True when a notification config already exists in Supabase for this network */
  hasExistingConfig?: boolean;
};

export const AccessPaywall = ({ children, description, hasExistingConfig = false }: AccessPaywallProps) => {
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const { isActive, expiryTimestamp, status, payForAccess } = useAccess();
  const queryClient = useQueryClient();

  const [isPaying, setIsPaying] = useState(false);
  // isActive can still read false after the receipt (a lagging RPC node, also on a later watched read), and Pay must
  // not be offered again to a wallet that paid: it would charge twice. The wallets that paid (lowercased) live in the
  // query cache, never fetched or collected, so the lock outlives a remount (Refresh swaps the paywall for a skeleton)
  // and lasts until the page is reloaded.
  const paidWalletsKey = [PAID_WALLETS_QUERY_KEY, PAYMENT_CHAIN_ID] as const;
  const { data: paidWallets = [] } = useQuery<readonly string[]>({
    queryKey: paidWalletsKey,
    queryFn: skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const hasPaid = address !== undefined && paidWallets.includes(normalizeAddress(address));

  const handlePayForAccess = async () => {
    const payer = address;
    setIsPaying(true);
    try {
      const result = await payForAccess();
      if (result.paid) {
        if (payer) {
          queryClient.setQueryData<readonly string[]>(paidWalletsKey, (wallets = []) => [
            ...wallets,
            normalizeAddress(payer),
          ]);
        }
        notification.success(result.isActive ? ACCESS_ACTIVE_MESSAGE : PAYMENT_PENDING_MESSAGE);
      } else if (result.error) notification.error(result.error);
    } finally {
      setIsPaying(false);
    }
  };

  if (isActive) {
    return (
      <div className="space-y-2">
        {expiryTimestamp > 0n && (
          <p className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80">
            Access until{" "}
            {new Date(Number(expiryTimestamp) * 1000).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-warning/40 bg-base-100 dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-amber-950/20 dark:to-gray-900/50 backdrop-blur-xl p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <svg
              className="h-6 w-6 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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

          {status.kind === "wrongChain" ? (
            <div className="space-y-2">
              <p className="text-xs text-base-content/70 dark:text-gray-400">Switch to the paywall network to pay.</p>
              <button
                type="button"
                onClick={() => switchChain?.({ chainId: status.paymentChainId })}
                className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 transition-all hover:bg-amber-500/30"
              >
                Switch network
              </button>
            </div>
          ) : status.kind === "ready" ? (
            <div className="w-full max-w-xs space-y-3">
              <div className="rounded-lg border border-base-300 bg-base-200 dark:border-white/10 dark:bg-white/5 px-3 py-2.5 text-sm text-base-content">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-base-content/70 dark:text-gray-400">Price: </span>
                  <span className="font-semibold text-base-content dark:text-white">
                    {formatTokenAmount(status.plan.price, PAYMENT_TOKEN_DECIMALS)} {PAYMENT_TOKEN_SYMBOL}
                  </span>
                  <span className="text-sm font-medium text-base-content/90 dark:text-gray-300">
                    ≈ {formatDurationDays(status.plan.durationSeconds)} days access
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePayForAccess}
                disabled={isPaying || hasPaid || !status.canPay}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-all shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPaying
                  ? "Processing..."
                  : hasExistingConfig
                    ? `Extend access with ${PAYMENT_TOKEN_SYMBOL}`
                    : `Pay for access (${PAYMENT_TOKEN_SYMBOL})`}
              </button>
              {hasPaid ? (
                <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">
                  {PAYMENT_PENDING_MESSAGE}
                </p>
              ) : status.notice ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">{PAY_NOTICES[status.notice]}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">{STATUS_MESSAGES[status.kind]}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};
