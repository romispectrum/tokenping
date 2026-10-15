import { unstable_cache } from "next/cache";
import "server-only";
import { createPublicClient, formatUnits } from "viem";
import {
  PAYMENT_CHAIN_ID,
  PAYMENT_TOKEN_CANDIDATES,
  PAYMENT_TOKEN_DECIMALS,
  PAYMENT_TOKEN_SYMBOL,
  SECONDS_PER_DAY,
  getPaywallContract,
} from "~~/constants/payments";
import scaffoldConfig from "~~/scaffold.config";
import { selectPaymentPlan } from "~~/services/payments/plans";
import { getFallbackTransport } from "~~/utils/rpc";

/** The paid alert plan as public copy shows it, e.g. `{ priceLabel: "3 USDC", days: 30 }`. */
export type AlertPlan = {
  priceLabel: string;
  days: number;
};

/** Seconds; matches the hourly revalidation of the pages that show the price. */
export const ALERT_PLAN_REVALIDATE_SECONDS = 3600;

class AlertPlanReadError extends Error {}

/**
 * Reads `plans(token)` for the payment token candidates from TokenpingPaywall on the payment chain and picks the plan
 * the paywall UI would sell (services/payments/plans). Resolves null when nothing is configured or the plan cannot be
 * bought; throws AlertPlanReadError when the chain cannot be read, so a failed read is never cached.
 */
export const readAlertPlan = async (): Promise<AlertPlan | null> => {
  if (PAYMENT_CHAIN_ID === undefined || PAYMENT_TOKEN_CANDIDATES.length === 0) return null;
  const contract = getPaywallContract(PAYMENT_CHAIN_ID);
  const chain = scaffoldConfig.targetNetworks.find(({ id }) => id === PAYMENT_CHAIN_ID);
  if (!contract?.address || !contract.abi || !chain) return null;

  // Each endpoint is tried once: this runs while a page renders (or builds), and the price has a fallback text.
  const client = createPublicClient({ chain, transport: getFallbackTransport(chain, { retryCount: 0 }) });
  const results = await Promise.all(
    PAYMENT_TOKEN_CANDIDATES.map(async token => {
      try {
        const result = (await client.readContract({
          address: contract.address,
          abi: contract.abi,
          functionName: "plans",
          args: [token],
        })) as readonly [bigint, bigint, boolean];
        return { status: "success" as const, result };
      } catch (error) {
        console.error(`readAlertPlan: TokenpingPaywall.plans(${token}) failed on chain ${PAYMENT_CHAIN_ID}`, error);
        return { status: "failure" as const };
      }
    }),
  );
  if (results.every(({ status }) => status === "failure")) throw new AlertPlanReadError("plans() read failed");

  const plan = selectPaymentPlan(results, PAYMENT_TOKEN_CANDIDATES)?.plan;
  if (!plan?.enabled || plan.price <= 0n || plan.durationSeconds <= 0n) return null;

  // One decimal at most, so a plan that is not a whole number of days is not shown as a rounded promise.
  const days = Math.round((Number(plan.durationSeconds) / SECONDS_PER_DAY) * 10) / 10;
  if (days <= 0) return null;
  return { priceLabel: `${formatUnits(plan.price, PAYMENT_TOKEN_DECIMALS)} ${PAYMENT_TOKEN_SYMBOL}`, days };
};

// The key names the chain and tokens, so a config change never serves another deployment's price.
const readAlertPlanCached = unstable_cache(
  readAlertPlan,
  ["alert-plan", String(PAYMENT_CHAIN_ID), ...PAYMENT_TOKEN_CANDIDATES],
  { revalidate: ALERT_PLAN_REVALIDATE_SECONDS, tags: ["alert-plan"] },
);

/** The current alert plan, cached for an hour; null when it is unavailable, so every caller needs a fallback. */
export const getAlertPlan = async (): Promise<AlertPlan | null> => {
  try {
    return await readAlertPlanCached();
  } catch (error) {
    if (!(error instanceof AlertPlanReadError)) console.error("getAlertPlan: unexpected error", error);
    return null;
  }
};
