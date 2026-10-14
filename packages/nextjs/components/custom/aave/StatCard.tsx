type StatCardVariant = "summary" | "detail";
type StatCardTone = "collateral" | "debt" | "netWorth";

// Summary cards (totals across networks) are tinted with their tone; detail cards (one network) share a neutral card.
const SUMMARY_CARD_STYLES: Record<StatCardTone, { card: string; label: string }> = {
  collateral: {
    card: "relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-gradient-to-br dark:from-emerald-950/50 dark:to-gray-900/50 p-4",
    label: "text-[10px] uppercase tracking-wider text-emerald-600/90 dark:text-emerald-400/80 mb-1",
  },
  debt: {
    card: "relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 dark:border-red-500/20 dark:bg-gradient-to-br dark:from-red-950/50 dark:to-gray-900/50 p-4",
    label: "text-[10px] uppercase tracking-wider text-red-600/90 dark:text-red-400/80 mb-1",
  },
  netWorth: {
    card: "relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 dark:border-purple-500/20 dark:bg-gradient-to-br dark:from-purple-950/50 dark:to-gray-900/50 p-4",
    label: "text-[10px] uppercase tracking-wider text-primary/90 dark:text-purple-400/80 mb-1",
  },
};

const DETAIL_CARD_STYLES = {
  card: "bg-base-200 dark:bg-white/5 rounded-xl p-3",
  label: "text-[10px] uppercase tracking-wider text-base-content/60 dark:text-gray-500 mb-1",
};

const VALUE_SIZE: Record<StatCardVariant, string> = {
  summary: "text-xl font-bold",
  detail: "text-lg font-bold",
};

const VALUE_COLOR: Record<StatCardTone, string> = {
  collateral: "text-emerald-600 dark:text-emerald-400",
  debt: "text-red-600 dark:text-red-400",
  netWorth: "text-base-content dark:text-white",
};

type StatCardProps = {
  label: string;
  value: string;
  variant: StatCardVariant;
  tone: StatCardTone;
};

export const StatCard = ({ label, value, variant, tone }: StatCardProps) => {
  const styles = variant === "summary" ? SUMMARY_CARD_STYLES[tone] : DETAIL_CARD_STYLES;

  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={`${VALUE_SIZE[variant]} ${VALUE_COLOR[tone]}`}>{value}</p>
    </div>
  );
};
