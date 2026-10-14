import type { Address } from "viem";

export type AccessPlan = {
  price: bigint;
  durationSeconds: bigint;
  enabled: boolean;
};

type PlanReadResult =
  | { status: "success"; result: readonly [price: bigint, durationSeconds: bigint, enabled: boolean] }
  | { status: "failure"; result?: undefined };

/**
 * `results[i]` is the `plans(candidates[i])` read. Picks the first plan that can actually be bought, otherwise the
 * first plan that was read at all.
 */
export const selectPaymentPlan = (results: readonly PlanReadResult[] | undefined, candidates: readonly Address[]) => {
  if (!results || candidates.length === 0) return null;
  const byToken = results.flatMap((entry, index) => {
    if (entry.status !== "success") return [];
    const [price, durationSeconds, enabled] = entry.result;
    return [{ token: candidates[index], plan: { price, durationSeconds, enabled } }];
  });
  return byToken.find(({ plan }) => plan.enabled && plan.price > 0n && plan.durationSeconds > 0n) ?? byToken[0] ?? null;
};
