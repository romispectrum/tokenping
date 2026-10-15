import { useMutationState } from "@tanstack/react-query";

/**
 * Where a running "approve, then pay" flow is. useAccess runs both steps behind one call, so the paywall reads the
 * progress from wagmi's contract-write mutations instead: each wallet request is a react-query mutation under the
 * ["writeContract"] key (wagmi's writeContractMutationOptions, used by SE-2's write hooks too), pending while the
 * wallet asks for a signature and holding the transaction hash once it is sent.
 *
 *   preparing        fresh price, pause and allowance reads; nothing asked of the wallet yet
 *   approve-sign     the wallet shows the approval
 *   approve-pending  the approval is sent and being mined (and the payment simulated)
 *   pay-sign         the wallet shows the payment
 *   pay-pending      the payment is sent; mined, then access is read until it shows
 *   failed           the latest request was rejected or failed; the flow is ending and the paywall says nothing more
 */
export type PaymentStep = "preparing" | "approve-sign" | "approve-pending" | "pay-sign" | "pay-pending" | "failed";

export type PaymentWrite = {
  functionName: unknown;
  status: "idle" | "pending" | "success" | "error";
  /** When the wallet request started (ms since the epoch); 0 for one that never started. */
  submittedAt: number;
  /** The transaction hash, once the wallet has sent it. */
  hash: string | undefined;
};

export type PaymentProgress = {
  step: PaymentStep;
  approveHash?: string;
  payHash?: string;
  /** The payment started without an approval: the allowance already covered the price. */
  approveSkipped: boolean;
};

const WRITE_CONTRACT_MUTATION_KEY = ["writeContract"];

const latestWrite = (writes: readonly PaymentWrite[], functionName: "approve" | "pay") =>
  writes.filter(write => write.functionName === functionName).sort((a, b) => b.submittedAt - a.submittedAt)[0];

/** Pending is the wallet prompt and success the sent transaction; a rejected or failed request is never "submitted". */
const stepOf = (write: PaymentWrite, sign: PaymentStep, sent: PaymentStep): PaymentStep => {
  if (write.status === "pending") return sign;
  if (write.status === "success") return sent;
  return "failed";
};

/** The progress of the flow started at `startedAt`, from every contract write in the cache. */
export const getPaymentProgress = (writes: readonly PaymentWrite[], startedAt: number): PaymentProgress => {
  const current = writes.filter(write => write.submittedAt >= startedAt);
  const approve = latestWrite(current, "approve");
  const pay = latestWrite(current, "pay");
  if (pay) {
    return {
      step: stepOf(pay, "pay-sign", "pay-pending"),
      approveHash: approve?.hash,
      payHash: pay.hash,
      approveSkipped: !approve,
    };
  }
  if (approve) {
    return {
      step: stepOf(approve, "approve-sign", "approve-pending"),
      approveHash: approve.hash,
      approveSkipped: false,
    };
  }
  return { step: "preparing", approveSkipped: false };
};

/** Every contract write in the query cache; re-renders when one changes. getPaymentProgress picks the flow's own. */
export const usePaymentWrites = () =>
  useMutationState({
    filters: { mutationKey: WRITE_CONTRACT_MUTATION_KEY },
    select: (mutation): PaymentWrite => {
      const { variables, status, submittedAt, data } = mutation.state;
      return {
        functionName: (variables as { functionName?: unknown } | undefined)?.functionName,
        status,
        submittedAt,
        hash: typeof data === "string" ? data : undefined,
      };
    },
  });
