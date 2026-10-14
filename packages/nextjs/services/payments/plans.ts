import type { Address } from "viem";

export type AccessPlan = {
  price: bigint;
  durationSeconds: bigint;
  enabled: boolean;
};

type PlanReadResult =
  | { status: "success"; result: readonly [price: bigint, durationSeconds: bigint, enabled: boolean] }
  | { status: "failure"; result?: undefined };

const toPlan = ([price, durationSeconds, enabled]: readonly [bigint, bigint, boolean]): AccessPlan => ({
  price,
  durationSeconds,
  enabled,
});

/**
 * `results[i]` is the `plans(candidates[i])` read. Picks the first plan that can actually be bought, otherwise the
 * first plan that was read at all.
 */
export const selectPaymentPlan = (results: readonly PlanReadResult[] | undefined, candidates: readonly Address[]) => {
  if (!results || candidates.length === 0) return null;
  const byToken = results.flatMap((entry, index) =>
    entry.status === "success" ? [{ token: candidates[index], plan: toPlan(entry.result) }] : [],
  );
  return byToken.find(({ plan }) => plan.enabled && plan.price > 0n && plan.durationSeconds > 0n) ?? byToken[0] ?? null;
};

/** The `plans(token)` read among `results` (same indexing as selectPaymentPlan), or null when it is missing or failed. */
export const findTokenPlan = (
  results: readonly PlanReadResult[] | undefined,
  candidates: readonly Address[],
  token: Address,
): AccessPlan | null => {
  const index = candidates.findIndex(candidate => candidate.toLowerCase() === token.toLowerCase());
  const entry = index === -1 ? undefined : results?.[index];
  return entry?.status === "success" ? toPlan(entry.result) : null;
};
