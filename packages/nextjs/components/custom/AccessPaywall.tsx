"use client";

import { type ReactNode, useId, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Info, Lock, TriangleAlert, Wallet } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { NetworkBadge } from "~~/components/custom/aave/NetworkBadge";
import { PaymentStatus, PaymentSteps } from "~~/components/custom/aave/PaymentLifecycle";
import { type PaymentStep, getPaymentProgress, usePaymentWrites } from "~~/components/custom/aave/paymentProgress";
import { Alert, Button, Card, Spinner } from "~~/components/ui";
import { PAYMENT_CHAIN_ID, PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_SYMBOL, SECONDS_PER_DAY } from "~~/constants/payments";
import { PAYMENTS_PAUSED_MESSAGE, useAccess } from "~~/hooks/custom/useAccess";
import scaffoldConfig from "~~/scaffold.config";
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
const PAYMENT_PENDING_MESSAGE = "Payment confirmed. Access will appear shortly.";

// The Pay button's label while the flow runs, per step: no trailing dots, and it never says "done" early.
const LOADING_TEXT: Record<PaymentStep, string> = {
  preparing: "Processing",
  "approve-sign": "Waiting for your wallet",
  "approve-pending": "Approving",
  "pay-sign": "Waiting for your wallet",
  "pay-pending": "Paying",
  failed: "Processing",
};

const PAID_WALLETS_QUERY_KEY = "paidAccessWallets";

/** A target network by id, for its name, explorer, fee currency and testnet flag. */
const findTargetNetwork = (chainId: number | undefined) =>
  chainId === undefined ? undefined : scaffoldConfig.targetNetworks.find(chain => chain.id === chainId);

/** "30 days" for whole days; "About 2 days" when the plan's duration had to be rounded. */
const formatAccessPeriod = (durationSeconds: bigint) => {
  const days = formatDurationDays(durationSeconds);
  const period = `${days} ${days === "1" ? "day" : "days"}`;
  return durationSeconds % BigInt(SECONDS_PER_DAY) === 0n ? period : `About ${period}`;
};

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="m-0 text-right text-foreground">{children}</dd>
  </div>
);

type AccessPaywallProps = {
  children: ReactNode;
  /** Replaces the default copy above the pay CTA. */
  description?: string;
  /** True when a notification config already exists in Supabase for this network */
  hasExistingConfig?: boolean;
};

export const AccessPaywall = ({ children, description, hasExistingConfig = false }: AccessPaywallProps) => {
  const { address, chain: walletChain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { isActive, expiryTimestamp, status, payForAccess } = useAccess();
  const queryClient = useQueryClient();
  const writes = usePaymentWrites();
  const reasonId = useId();
  const statusId = useId();

  // When the running payment started; null while none runs. It also picks this flow's wallet requests out of the
  // mutation cache, so a finished earlier flow never shows up as progress.
  const [payStartedAt, setPayStartedAt] = useState<number | null>(null);
  const isPaying = payStartedAt !== null;
  const progress = payStartedAt === null ? null : getPaymentProgress(writes, payStartedAt);

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
    setPayStartedAt(Date.now());
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
      setPayStartedAt(null);
    }
  };

  if (isActive) {
    return (
      <div className="flex flex-col gap-4">
        {expiryTimestamp > 0n && (
          <p className="m-0 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
            <span>
              Alerts unlocked until{" "}
              {new Date(Number(expiryTimestamp) * 1000).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </span>
          </p>
        )}
        {children}
      </div>
    );
  }

  const paymentChain = findTargetNetwork(PAYMENT_CHAIN_ID);
  const explorer = paymentChain?.blockExplorers?.default;

  const renderBody = () => {
    if (status.kind === "wrongChain") {
      const target = findTargetNetwork(status.paymentChainId)?.name ?? "the payment network";
      return (
        <>
          <Alert variant="warning" title="Wrong network">
            <p>{`Your wallet is on ${walletChain?.name ?? "another network"}. Switch to ${target} to pay.`}</p>
          </Alert>
          <Button
            className="w-full"
            loading={isSwitching}
            loadingText="Switching network"
            onClick={() => switchChain?.({ chainId: status.paymentChainId })}
          >
            {`Switch to ${target}`}
          </Button>
        </>
      );
    }

    if (status.kind !== "ready") {
      return (
        <Alert
          variant={status.kind === "unconfigured" ? "warning" : "default"}
          icon={status.kind === "connectWallet" ? Wallet : undefined}
        >
          <p>{STATUS_MESSAGES[status.kind]}</p>
        </Alert>
      );
    }

    const { plan, canPay, notice } = status;
    const amount = `${formatTokenAmount(plan.price, PAYMENT_TOKEN_DECIMALS)} ${PAYMENT_TOKEN_SYMBOL}`;
    const isBlocked = !isPaying && (hasPaid || !canPay);

    // Why Pay is blocked, said next to it. After a payment the status below says it instead.
    const renderReason = () => {
      if (isPaying || hasPaid || canPay) return null;
      if (notice) {
        return (
          <p id={reasonId} className="m-0 flex items-start gap-2 text-sm text-foreground">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>{PAY_NOTICES[notice]}</span>
          </p>
        );
      }
      if (plan.price === 0n) {
        return (
          <p id={reasonId} className="m-0 flex items-start gap-2 text-sm text-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{STATUS_MESSAGES.noPlan}</span>
          </p>
        );
      }
      // Still reading the paywall, the pause state or the allowance.
      return (
        <div id={reasonId}>
          <Spinner label="Loading payment details" />
        </div>
      );
    };
    const reason = renderReason();

    return (
      <>
        <dl className="m-0 divide-y divide-border rounded-xl border border-border text-sm">
          <DetailRow label="Price">
            <span className="font-bold tabular-nums">{formatTokenAmount(plan.price, PAYMENT_TOKEN_DECIMALS)}</span>{" "}
            <span className="font-medium text-muted-foreground">{PAYMENT_TOKEN_SYMBOL}</span>
          </DetailRow>
          <DetailRow label="Access">{formatAccessPeriod(plan.durationSeconds)}</DetailRow>
          {paymentChain ? (
            <>
              <DetailRow label="Network">
                <NetworkBadge name={paymentChain.name} testnet={paymentChain.testnet} />
              </DetailRow>
              <DetailRow label="Network fee">
                {`Paid in ${paymentChain.nativeCurrency.symbol} for each step, shown in your wallet`}
              </DetailRow>
            </>
          ) : null}
        </dl>

        <PaymentSteps amount={amount} progress={progress} />

        {/* Blocked is aria-disabled, not disabled: the button stays in the tab order, so keyboard and screen reader
            users reach it and hear the reason. Button only swallows clicks while loading, so this drops the handler. */}
        {/* lint-brand-ignore-next-line multiple-primary: the wrong-network Switch and this Pay never render together */}
        <Button
          className="w-full"
          onClick={isBlocked ? undefined : handlePayForAccess}
          aria-disabled={isBlocked || undefined}
          loading={isPaying}
          loadingText={LOADING_TEXT[progress?.step ?? "preparing"]}
          aria-describedby={reason ? reasonId : hasPaid && !isPaying ? statusId : undefined}
        >
          {`Pay ${amount}`}
        </Button>
        {reason}

        <PaymentStatus
          id={statusId}
          amount={amount}
          progress={progress}
          pendingAccessMessage={hasPaid && !isPaying ? PAYMENT_PENDING_MESSAGE : null}
          network={paymentChain?.name ?? "the network"}
          explorer={explorer}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-start gap-3 px-[var(--card-spacing)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Lock aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="m-0 text-base font-medium text-foreground">
              {hasExistingConfig ? "Extend access to edit your alerts" : "Unlock health factor alerts"}
            </h3>
            <p className="m-0 text-sm text-muted-foreground">
              {description ??
                (hasExistingConfig
                  ? "Your previous alert settings are saved. Pay again to extend access and edit them."
                  : "Pay once to unlock alert settings and set a health factor threshold for each network. Nothing renews automatically: you pay from your wallet when you want to extend.")}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-[var(--card-spacing)]">{renderBody()}</div>
      </Card>
      {children}
    </div>
  );
};
