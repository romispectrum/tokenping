import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { GlowWash } from "~~/components/ui/Glow";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

type AlertEndBoxProps = {
  plan: AlertPlan | null;
};

/**
 * The product box under every post, its closing moment: a dark panel in both themes (the `dark` class switches every
 * token, the button and the focus ring inside it) with the band glow and the grain. It states the same live price as
 * the homepage and the limits next to it, and carries the view's one pink action.
 */
export const AlertEndBox = ({ plan }: AlertEndBoxProps) => {
  const paymentChainName = getPaymentChainName();
  const paidOn = paymentChainName ? `, paid on ${paymentChainName}` : "";
  return (
    <aside
      aria-label="About Tokenping"
      className="dark relative isolate overflow-hidden rounded-3xl border border-border bg-background px-6 py-12 text-center text-foreground md:px-16 md:py-16"
    >
      <GlowWash />
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 -z-10 opacity-30 mix-blend-overlay"
      />
      <h2 className="text-section mx-auto mt-0 mb-0 max-w-3xl text-balance">Health factor alerts from Tokenping</h2>
      <p className="text-lead mx-auto mt-4 mb-0 max-w-[60ch] text-pretty text-muted-foreground">
        {`Tokenping checks your Aave V3 health factor every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes on ${AAVE_MARKETS.length} networks and messages you on ${formatAlertChannels("or")} when it is below your threshold. The dashboard is free; alerts cost ${formatAlertPrice(plan)}${paidOn}. Alerts give you time to act; they don't prevent liquidation.`}
      </p>
      <div className="mx-auto mt-8 flex max-w-sm flex-col sm:max-w-none sm:flex-row sm:justify-center">
        <Link href="/aave" className={buttonClasses({ size: "lg", className: "w-full sm:w-auto sm:min-w-40" })}>
          Open the free dashboard
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
};
