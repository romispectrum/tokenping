import { BellRing } from "lucide-react";
import { HealthFactorBadge } from "~~/components/custom/HealthFactorBadge";
import { Badge } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import type { NetworkPosition } from "~~/services/aave/positions";
import { formatUSD } from "~~/utils/format";

type NetworkSummaryRowProps = {
  position: NetworkPosition;
  isSelected: boolean;
  onSelect: () => void;
  hasNotification: boolean;
};

/**
 * One network in the list: a button that shows the network in the details panel. The list has one current choice,
 * so the selected row is aria-current (a pressed toggle would suggest it can be unpressed). It is drawn with the
 * violet tint plus a 2px edge in the ring colour, so it never rests on the tint alone; hover is a lighter tint.
 */
export const NetworkSummaryRow = ({ position, isSelected, onSelect, hasNotification }: NetworkSummaryRowProps) => {
  const t = useMessages(DASHBOARD_MESSAGES).networks;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? "true" : undefined}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-foreground transition-colors duration-150 ease-[ease] hover:bg-accent/60 aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground aria-[current=true]:shadow-[inset_2px_0_0_var(--ring)]"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{position.chainName}</span>
          {hasNotification ? (
            <>
              <BellRing aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">{t.alertSet}</span>
            </>
          ) : null}
        </span>
        {position.hasPosition ? (
          // Wraps between the two totals on a phone instead of cutting "borrowed" off.
          <span className="text-sm text-muted-foreground tabular-nums">
            <span className="whitespace-nowrap">{t.supplied(formatUSD(position.totalCollateralUSD))}</span>{" "}
            <span className="whitespace-nowrap">{t.borrowed(formatUSD(position.totalDebtUSD))}</span>
          </span>
        ) : null}
      </span>
      {position.hasPosition ? (
        <HealthFactorBadge healthFactor={position.healthFactor} />
      ) : (
        <Badge variant="neutral">{t.noPosition}</Badge>
      )}
    </button>
  );
};
