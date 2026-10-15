import { type AlertPlan, getAlertPlan } from "~~/services/marketing/alertPlan";

/** Shown whenever the on-chain plan cannot be read; reads correctly where "3 USDC per 30 days" would. */
export const ALERT_PRICE_FALLBACK = "a small USDC fee (see the dashboard for the current price)";

/** "3 USDC per 30 days", from the plan on the paywall contract. */
export const formatAlertPrice = (plan: AlertPlan | null) => {
  if (!plan) return ALERT_PRICE_FALLBACK;
  return `${plan.priceLabel} per ${plan.days === 1 ? "day" : `${plan.days} days`}`;
};

type AlertPriceTextProps = {
  plan: AlertPlan | null;
};

export const AlertPriceText = ({ plan }: AlertPriceTextProps) => <>{formatAlertPrice(plan)}</>;

/**
 * `<AlertPrice />` in MDX. Post pages override it with AlertPriceText bound to the plan they already read; this async
 * version keeps the component usable anywhere else MDX renders on the server.
 */
export const AlertPrice = async () => <AlertPriceText plan={await getAlertPlan()} />;
