import { SECONDS_PER_DAY } from "~~/constants/payments";
import type { AccessPlan } from "~~/services/payments/plans";

/** Why an offered plan cannot be bought right now, when the user should be told. */
export type PayNotice = "paused" | "statusUnavailable";

export type PaywallStatus =
  | { kind: "connectWallet" | "unconfigured" | "noPlan" }
  | { kind: "wrongChain"; paymentChainId: number }
  | { kind: "ready"; plan: AccessPlan; canPay: boolean; notice: PayNotice | null };

type PaywallStatusInput = {
  address: string | undefined;
  paymentChainId: number | undefined;
  onCorrectChain: boolean;
  plan: AccessPlan | null;
  paymentTokenAddress: string | undefined;
  /** The paywall's code was found on chain; undefined while that check runs. */
  isPaywallDeployed: boolean | undefined;
  /** undefined until paused() has been read. */
  isPaused: boolean | undefined;
  /** undefined until the allowance has been read. */
  allowance: bigint | undefined;
  /** The paused() or allowance read failed. */
  hasReadError: boolean;
};

/** What the paywall card offers to a user without access; the checks run in this order. */
export const getPaywallStatus = ({
  address,
  paymentChainId,
  onCorrectChain,
  plan,
  paymentTokenAddress,
  isPaywallDeployed,
  isPaused,
  allowance,
  hasReadError,
}: PaywallStatusInput): PaywallStatus => {
  if (!address) return { kind: "connectWallet" };
  if (!paymentChainId) return { kind: "unconfigured" };
  if (!onCorrectChain) return { kind: "wrongChain", paymentChainId };
  if (!plan?.enabled) return { kind: "noPlan" };
  // An enabled plan is shown even when it cannot be bought; the pay button is then disabled.
  if (isPaused) return { kind: "ready", plan, canPay: false, notice: "paused" };
  // Paying approves the paywall and decides whether to approve from the allowance, so it waits for all three.
  const isPaymentStateKnown = isPaywallDeployed === true && isPaused === false && allowance !== undefined;
  const hasFailed = hasReadError || isPaywallDeployed === false;
  return {
    kind: "ready",
    plan,
    canPay: plan.price > 0n && Boolean(paymentTokenAddress) && isPaymentStateKnown,
    notice: !isPaymentStateKnown && hasFailed ? "statusUnavailable" : null,
  };
};

export const formatDurationDays = (durationSeconds: bigint) => (Number(durationSeconds) / SECONDS_PER_DAY).toFixed(0);
