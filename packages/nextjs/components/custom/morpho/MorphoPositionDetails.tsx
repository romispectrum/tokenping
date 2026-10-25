import { CalendarClock, CalendarX, Layers, ShieldHalf } from "lucide-react";
import { HealthFactorBadge } from "~~/components/custom/HealthFactorBadge";
import { InlineError } from "~~/components/custom/aave/InlineError";
import { NetworkIcon } from "~~/components/custom/aave/NetworkIcon";
import { StatCard } from "~~/components/custom/aave/StatCard";
import {
  hasDebt,
  healthFactorText,
  lltvText,
  loanAmount,
  ltvText,
  maturityCountdown,
  pairName,
} from "~~/components/custom/morpho/morphoView";
import { Alert, Card } from "~~/components/ui";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoPositionItem } from "~~/hooks/custom/useMorphoPositions";
import { useLocale } from "~~/i18n/LocaleProvider";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";
import { formatUtcTimestamp } from "~~/utils/format";

type MorphoPositionDetailsProps = {
  item: MorphoPositionItem;
  onRetry: () => void;
};

/** A centred note with an icon, as the Aave details show a market without a position. */
const Note = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
    <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Layers aria-hidden="true" className="size-6" strokeWidth={1.5} />
    </div>
    <div className="flex max-w-sm flex-col gap-1">
      <p className="m-0 text-base font-medium text-foreground">{title}</p>
      <p className="m-0 text-sm text-muted-foreground">{detail}</p>
    </div>
  </div>
);

/** The selected Morpho position: its health factor, the four numbers that make it, a fixed-rate loan's maturity. */
export const MorphoPositionDetails = ({ item, onRetry }: MorphoPositionDetailsProps) => {
  const locale = useLocale();
  const t = MORPHO_MESSAGES[locale];
  const { ref, position } = item;
  const chainName = getMorphoChain(ref.chainId)?.name ?? String(ref.chainId);
  const params = position?.params;
  const reading = position?.reading;
  const rate = ref.protocol === "morpho-blue" ? t.list.variableRate : t.list.fixedRate;
  const countdown =
    params?.kind === "midnight" && reading ? maturityCountdown(params.maturity, reading.timestamp) : null;

  const content = (() => {
    if (item.isError || !params || !reading) {
      return <InlineError title={t.details.unreadableTitle} detail={t.details.unreadableDetail} onRetry={onRetry} />;
    }
    if (!hasDebt(reading)) return <Note title={t.details.noDebtTitle} detail={t.details.noDebtDetail} />;
    return (
      <>
        {countdown?.matured ? (
          <Alert variant="destructive" icon={CalendarX} title={t.list.matured}>
            <p>{t.details.pastMaturity}</p>
          </Alert>
        ) : null}
        {reading.line === "pre-liquidation" ? (
          <Alert variant="info" icon={ShieldHalf} title={t.details.preLiquidation}>
            <p>{t.details.preLiquidationNote}</p>
          </Alert>
        ) : null}
        <dl className="m-0 grid gap-2 sm:grid-cols-2 sm:gap-3">
          <StatCard
            variant="panel"
            label={t.details.collateralValue}
            value={loanAmount(reading.collateralValue, params)}
          />
          <StatCard variant="panel" label={t.details.debt} value={loanAmount(reading.debt, params)} />
          <StatCard variant="panel" label={t.details.ltv} value={ltvText(reading)} />
          <StatCard variant="panel" label={t.details.lltv} value={lltvText(params)} />
        </dl>
        {params.kind === "midnight" && countdown ? (
          <p className="m-0 flex items-center gap-2 text-sm text-foreground">
            <CalendarClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-medium">{t.details.maturity}:</span>{" "}
              {formatUtcTimestamp(new Date(params.maturity * 1000), locale)}
              {countdown.matured ? null : ` (${t.details.timeLeft(countdown.days, countdown.hours)})`}
            </span>
          </p>
        ) : null}
        <p className="m-0 text-xs text-muted-foreground">{t.details.amountsIn(params.loanToken.symbol)}</p>
      </>
    );
  })();

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 px-[var(--card-spacing)]">
        <div className="flex min-w-0 items-center gap-3">
          <NetworkIcon chainId={ref.chainId} name={chainName} className="size-8" />
          <div className="min-w-0">
            <h3 className="m-0 truncate text-base font-medium text-foreground">
              {params ? pairName(params) : chainName}
            </h3>
            <p className="m-0 text-sm text-muted-foreground">
              {chainName}, {rate}
            </p>
          </div>
        </div>
        {reading && hasDebt(reading) && !countdown?.matured ? (
          <HealthFactorBadge healthFactor={healthFactorText(reading)} />
        ) : null}
      </div>
      <div className="flex flex-col gap-4 px-[var(--card-spacing)] sm:gap-6">{content}</div>
    </Card>
  );
};
