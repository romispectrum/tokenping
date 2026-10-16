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
import { useAccess } from "~~/hooks/custom/useAccess";
import { useLocale } from "~~/i18n/LocaleProvider";
import { LOCALE_INFO } from "~~/i18n/locales";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import scaffoldConfig from "~~/scaffold.config";
import { formatDurationDays } from "~~/services/payments/paywallStatus";
import { normalizeAddress } from "~~/utils/address";
import { formatTokenAmount } from "~~/utils/format";
import { notification } from "~~/utils/scaffold-eth";

type PaywallMessages = (typeof DASHBOARD_MESSAGES)["en"]["paywall"];

// The Pay button's label while the flow runs, per step: no trailing dots, and it never says "done" early.
const LOADING_TEXT: Record<PaymentStep, keyof PaywallMessages["loading"]> = {
  preparing: "processing",
  "approve-sign": "waitingForWallet",
  "approve-pending": "approving",
  "pay-sign": "waitingForWallet",
  "pay-pending": "paying",
  failed: "processing",
};

const PAID_WALLETS_QUERY_KEY = "paidAccessWallets";

/** A target network by id, for its name, explorer, fee currency and testnet flag. */
const findTargetNetwork = (chainId: number | undefined) =>
  chainId === undefined ? undefined : scaffoldConfig.targetNetworks.find(chain => chain.id === chainId);

/** "30 days" for whole days; "About 2 days" when the plan's duration had to be rounded. */
const formatAccessPeriod = (t: PaywallMessages, durationSeconds: bigint) =>
  t.period(Number(formatDurationDays(durationSeconds)), durationSeconds % BigInt(SECONDS_PER_DAY) !== 0n);

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="m-0 text-right text-foreground">{children}</dd>
  </div>
);

type AccessPaywallProps = {
  /** What the paid access unlocks, rendered after the status; nothing when the caller lays it out elsewhere. */
  children?: ReactNode;
  /** Replaces the default copy above the pay CTA. */
  description?: string;
  /** True when a notification config already exists in Supabase for this network */
  hasExistingConfig?: boolean;
};

export const AccessPaywall = ({ children, description, hasExistingConfig = false }: AccessPaywallProps) => {
  const locale = useLocale();
  const t = DASHBOARD_MESSAGES[locale].paywall;
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
        notification.success(result.isActive ? t.accessActive : t.paymentPending);
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
              {t.unlockedUntil(
                new Date(Number(expiryTimestamp) * 1000).toLocaleDateString(LOCALE_INFO[locale].intl, {
                  dateStyle: "medium",
                }),
              )}
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
      const target = findTargetNetwork(status.paymentChainId)?.name;
      return (
        <>
          <Alert variant="warning" title={t.wrongNetworkTitle}>
            <p>{t.wrongNetworkBody(walletChain?.name, target)}</p>
          </Alert>
          <Button
            className="w-full"
            loading={isSwitching}
            loadingText={t.switching}
            onClick={() => switchChain?.({ chainId: status.paymentChainId })}
          >
            {t.switchTo(target)}
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
          <p>{t[status.kind]}</p>
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
            <span>{t[notice]}</span>
          </p>
        );
      }
      if (plan.price === 0n) {
        return (
          <p id={reasonId} className="m-0 flex items-start gap-2 text-sm text-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>{t.noPlan}</span>
          </p>
        );
      }
      // Still reading the paywall, the pause state or the allowance.
      return (
        <div id={reasonId}>
          <Spinner label={t.loadingDetails} />
        </div>
      );
    };
    const reason = renderReason();

    return (
      <>
        <dl className="m-0 divide-y divide-border rounded-xl border border-border text-sm">
          <DetailRow label={t.price}>
            <span className="font-bold tabular-nums">{formatTokenAmount(plan.price, PAYMENT_TOKEN_DECIMALS)}</span>{" "}
            <span className="font-medium text-muted-foreground">{PAYMENT_TOKEN_SYMBOL}</span>
          </DetailRow>
          <DetailRow label={t.access}>{formatAccessPeriod(t, plan.durationSeconds)}</DetailRow>
          {paymentChain ? (
            <>
              <DetailRow label={t.network}>
                <NetworkBadge name={paymentChain.name} testnet={paymentChain.testnet} />
              </DetailRow>
              <DetailRow label={t.networkFee}>{t.networkFeeValue(paymentChain.nativeCurrency.symbol)}</DetailRow>
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
          loadingText={t.loading[LOADING_TEXT[progress?.step ?? "preparing"]]}
          aria-describedby={reason ? reasonId : hasPaid && !isPaying ? statusId : undefined}
        >
          {t.pay(amount)}
        </Button>
        {reason}

        <PaymentStatus
          id={statusId}
          amount={amount}
          progress={progress}
          pendingAccessMessage={hasPaid && !isPaying ? t.paymentPending : null}
          network={paymentChain?.name}
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
              {hasExistingConfig ? t.titleExtend : t.titleNew}
            </h3>
            <p className="m-0 text-sm text-muted-foreground">
              {description ?? (hasExistingConfig ? t.descriptionExtend : t.descriptionNew)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-[var(--card-spacing)]">{renderBody()}</div>
      </Card>
      {children}
    </div>
  );
};
