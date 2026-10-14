"use client";

import { type ReactNode, useState } from "react";
import { useSwitchChain } from "wagmi";
import { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_SYMBOL } from "~~/constants/payments";
import { PAYMENTS_PAUSED_MESSAGE, useAccess } from "~~/hooks/custom/useAccess";
import { type PayNotice, formatDurationDays } from "~~/services/payments/paywallStatus";
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

type AccessPaywallProps = {
  children: ReactNode;
  /** Replaces the default copy above the pay CTA. */
  description?: string;
  /** True when a notification config already exists in Supabase for this network */
  hasExistingConfig?: boolean;
};

export const AccessPaywall = ({ children, description, hasExistingConfig = false }: AccessPaywallProps) => {
  const { switchChain } = useSwitchChain();
  const { isActive, expiryTimestamp, status, payForAccess } = useAccess();

  const [isPaying, setIsPaying] = useState(false);

  const handlePayForAccess = async () => {
    setIsPaying(true);
    try {
      const result = await payForAccess();
      if (result.paid) notification.success("Access active. You can now configure notifications.");
      else if (result.error) notification.error(result.error);
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
                disabled={isPaying || !status.canPay}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-all shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPaying
                  ? "Processing..."
                  : hasExistingConfig
                    ? `Extend access with ${PAYMENT_TOKEN_SYMBOL}`
                    : `Pay for access (${PAYMENT_TOKEN_SYMBOL})`}
              </button>
              {status.notice ? (
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
