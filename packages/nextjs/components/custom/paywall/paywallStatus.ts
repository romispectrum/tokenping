import { SECONDS_PER_DAY } from "~~/constants/payments";
import type { AccessPlan } from "~~/services/payments/plans";

export type PaywallStatus =
  | { kind: "connectWallet" | "unconfigured" | "noPlan" }
  | { kind: "wrongChain"; paymentChainId: number }
  | { kind: "ready"; plan: AccessPlan; canPay: boolean };

type PaywallStatusInput = {
  address: string | undefined;
  paymentChainId: number | undefined;
  onCorrectChain: boolean;
  plan: AccessPlan | null;
  paymentTokenAddress: string | undefined;
};

/** What the paywall card offers to a user without access; the checks run in this order. */
export const getPaywallStatus = ({
  address,
  paymentChainId,
  onCorrectChain,
  plan,
  paymentTokenAddress,
}: PaywallStatusInput): PaywallStatus => {
  if (!address) return { kind: "connectWallet" };
  if (!paymentChainId) return { kind: "unconfigured" };
  if (!onCorrectChain) return { kind: "wrongChain", paymentChainId };
  if (!plan?.enabled) return { kind: "noPlan" };
  // An enabled plan is shown even when it cannot be bought; the pay button is then disabled.
  return { kind: "ready", plan, canPay: plan.price > 0n && Boolean(paymentTokenAddress) };
};

export const formatDurationDays = (durationSeconds: bigint) => (Number(durationSeconds) / SECONDS_PER_DAY).toFixed(0);
