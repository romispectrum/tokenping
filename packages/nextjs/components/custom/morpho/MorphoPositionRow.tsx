import { BellRing, CalendarX, RotateCw } from "lucide-react";
import { HealthFactorBadge } from "~~/components/custom/HealthFactorBadge";
import { NetworkIcon } from "~~/components/custom/aave/NetworkIcon";
import { healthFactorText, maturityCountdown, maturityDay, pairName } from "~~/components/custom/morpho/morphoView";
import { Badge, Button, Skeleton } from "~~/components/ui";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoPositionItem } from "~~/hooks/custom/useMorphoPositions";
import { useLocale, useMessages } from "~~/i18n/LocaleProvider";
import { formatLongDate } from "~~/i18n/format";

type MorphoPositionRowProps = {
  item: MorphoPositionItem;
  isSelected: boolean;
  onSelect: () => void;
  hasNotification: boolean;
  /** The market's name in words ("Ethereum (weETH/RLUSD)"), for the label of its Try again button. */
  name: string;
};

/**
 * One Morpho market in the list, drawn like the Aave list's rows: a button that shows it in the details panel,
 * aria-current when selected. Its pair, its network and rate, and its health factor, or the state of its read. A
 * market that could not be read keeps the pair its alert stored, and gets a button beside it that reads it again.
 */
export const MorphoPositionRow = ({ item, isSelected, onSelect, hasNotification, name }: MorphoPositionRowProps) => {
  const locale = useLocale();
  const t = useMessages("morpho").list;
  const { alertSet } = useMessages("dashboard").networks;
  const { ref, position, isLoading, isError } = item;
  const chainName = getMorphoChain(ref.chainId)?.name ?? String(ref.chainId);
  const params = position?.params ?? item.savedParams;
  const reading = position?.reading;
  const isUnreadable = !isLoading && (isError || !params || !reading);

  const rate = ref.protocol === "morpho-blue" ? t.variableRate : t.fixedRate;
  const matured =
    params?.kind === "midnight" && reading ? maturityCountdown(params.maturity, reading.timestamp).matured : false;
  const detail =
    params?.kind === "midnight" && !matured
      ? `${chainName}, ${rate}, ${t.matures(formatLongDate(locale, maturityDay(params.maturity)))}`
      : `${chainName}, ${rate}`;

  const status = isLoading ? (
    <Skeleton className="h-6 w-20" />
  ) : isError || !params || !reading ? (
    <Badge variant="neutral">{t.unreadable}</Badge>
  ) : matured && reading.debt > 0n ? (
    <Badge variant="destructive">
      <CalendarX aria-hidden="true" />
      {t.matured}
    </Badge>
  ) : (
    <HealthFactorBadge healthFactor={healthFactorText(reading)} />
  );

  const row = (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? "true" : undefined}
      className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-foreground transition-colors duration-150 ease-[ease] hover:bg-accent/60 aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground aria-[current=true]:shadow-[inset_2px_0_0_var(--ring)]"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <NetworkIcon chainId={ref.chainId} name={chainName} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
            {params ? (
              <span className="truncate">{pairName(params)}</span>
            ) : isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="truncate font-data">{ref.marketId.slice(0, 10)}</span>
            )}
            {hasNotification ? (
              <>
                <BellRing aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">{alertSet}</span>
              </>
            ) : null}
          </span>
          <span className="text-sm text-muted-foreground">{detail}</span>
        </span>
      </span>
      {status}
    </button>
  );

  // A sibling, not inside the row: a button cannot hold another.
  return isUnreadable ? (
    <div className="flex items-center gap-1">
      {row}
      <Button variant="ghost" size="icon" onClick={item.retry} aria-label={t.retry(name)} title={t.retry(name)}>
        <RotateCw aria-hidden="true" />
      </Button>
    </div>
  ) : (
    row
  );
};
