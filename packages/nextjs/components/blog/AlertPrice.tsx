import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { type AlertPlan, getAlertPlan } from "~~/services/marketing/alertPlan";

/** Shown whenever the on-chain plan cannot be read; reads correctly where "3 USDC per 30 days" would. */
export const ALERT_PRICE_FALLBACK = BLOG_MESSAGES.en.alertPrice.fallback;

/** "3 USDC per 30 days" / "3 USDC na 30 dní", from the plan on the paywall contract. */
export const formatAlertPrice = (plan: AlertPlan | null, locale: Locale = DEFAULT_LOCALE) => {
  const messages = BLOG_MESSAGES[locale].alertPrice;
  return plan ? messages.plan(plan) : messages.fallback;
};

type AlertPriceTextProps = {
  plan: AlertPlan | null;
  locale?: Locale;
};

export const AlertPriceText = ({ plan, locale }: AlertPriceTextProps) => <>{formatAlertPrice(plan, locale)}</>;

/**
 * `<AlertPrice />` in MDX. Post pages override it with AlertPriceText bound to the plan they already read; this async
 * version keeps the component usable anywhere else MDX renders on the server.
 */
export const AlertPrice = async ({ locale }: { locale?: Locale } = {}) => (
  <AlertPriceText plan={await getAlertPlan()} locale={locale} />
);
