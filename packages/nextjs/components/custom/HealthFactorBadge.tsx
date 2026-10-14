import { HEALTH_FACTOR_CRITICAL, HEALTH_FACTOR_RISKY } from "~~/constants/notifications";
import { INFINITE_HEALTH_FACTOR } from "~~/utils/healthFactor";

type HealthFactorStatus = "no-debt" | "critical" | "risky" | "safe";

const STATUS_STYLES: Record<HealthFactorStatus, { className: string; label: string }> = {
  "no-debt": { className: "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30", label: "No Debt" },
  critical: { className: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30", label: "Critical" },
  risky: { className: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30", label: "Risky" },
  safe: { className: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", label: "Safe" },
};

/** Unparseable values fail every comparison and count as safe. */
export const getHealthFactorStatus = (healthFactor: string): HealthFactorStatus => {
  if (healthFactor === INFINITE_HEALTH_FACTOR) return "no-debt";
  const hf = parseFloat(healthFactor);
  if (hf < HEALTH_FACTOR_CRITICAL) return "critical";
  if (hf < HEALTH_FACTOR_RISKY) return "risky";
  return "safe";
};

type HealthFactorBadgeProps = {
  healthFactor: string;
};

export const HealthFactorBadge = ({ healthFactor }: HealthFactorBadgeProps) => {
  const { className, label } = STATUS_STYLES[getHealthFactorStatus(healthFactor)];

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${className}`}>
      {healthFactor} · {label}
    </span>
  );
};
