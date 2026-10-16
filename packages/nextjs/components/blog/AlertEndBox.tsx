import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { GlowWash } from "~~/components/ui/Glow";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { AAVE_NETWORK_NAMES } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

type AlertEndBoxProps = {
  plan: AlertPlan | null;
  locale?: Locale;
};

/**
 * The product box under every post, its closing moment: a dark panel in both themes (the `dark` class switches every
 * token, the button and the focus ring inside it) with the band glow and the grain. It states the same live price as
 * the homepage and the limits next to it, and carries the view's one pink action.
 */
export const AlertEndBox = ({ plan, locale = DEFAULT_LOCALE }: AlertEndBoxProps) => {
  const t = BLOG_MESSAGES[locale].endBox;
  return (
    <aside
      aria-label={t.label}
      className="dark relative isolate overflow-hidden rounded-3xl border border-border bg-background px-6 py-12 text-center text-foreground md:px-16 md:py-16"
    >
      <GlowWash />
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 -z-10 opacity-30 mix-blend-overlay"
      />
      <h2 className="text-section mx-auto mt-0 mb-0 max-w-3xl text-balance">{t.title}</h2>
      <p className="text-lead mx-auto mt-4 mb-0 max-w-[60ch] text-pretty text-muted-foreground">
        {t.body({
          minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES,
          networks: AAVE_NETWORK_NAMES.length,
          channels: formatAlertChannelsIn(locale, "disjunction"),
          price: formatAlertPrice(plan, locale),
          paymentChain: getPaymentChainName(),
        })}
      </p>
      <div className="mx-auto mt-8 flex max-w-sm flex-col sm:max-w-none sm:flex-row sm:justify-center">
        <Link
          href={routePath(locale, "dashboard")}
          className={buttonClasses({ size: "lg", className: "w-full sm:w-auto sm:min-w-40" })}
        >
          {t.cta}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
};
