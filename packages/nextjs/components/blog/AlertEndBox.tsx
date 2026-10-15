import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

type AlertEndBoxProps = {
  plan: AlertPlan | null;
};

/** The product box under every post: the same live price as the homepage, and the limits stated next to it. */
export const AlertEndBox = ({ plan }: AlertEndBoxProps) => {
  const paymentChainName = getPaymentChainName();
  const paidOn = paymentChainName ? `, paid on ${paymentChainName}` : "";
  return (
    <aside
      aria-label="About Tokenping"
      className="mt-8 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-base-100 p-5 sm:p-6 dark:border-indigo-400/30 dark:from-indigo-500/15 dark:to-gray-900/60"
    >
      <p className="m-0 mb-2 text-lg font-semibold text-base-content">Health factor alerts from Tokenping</p>
      <p className="my-2 leading-relaxed text-base-content/90 dark:text-gray-200">
        {`Tokenping checks your Aave V3 health factor every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes on ${AAVE_MARKETS.length} networks and messages you on ${formatAlertChannels("or")} when it is below your threshold. The dashboard is free; alerts cost ${formatAlertPrice(plan)}${paidOn}. Alerts give you time to act; they don't prevent liquidation.`}
      </p>
      <Link href="/aave" className="btn btn-primary btn-sm sm:btn-md mt-2 gap-2 rounded-full">
        Open the free dashboard
        <ArrowRightIcon className="h-4 w-4" aria-hidden />
      </Link>
    </aside>
  );
};
