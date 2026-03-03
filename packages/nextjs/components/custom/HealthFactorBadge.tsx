"use client";

import { HEALTH_FACTOR_CRITICAL, HEALTH_FACTOR_RISKY } from "~~/constants/notifications";

interface HealthFactorBadgeProps {
  healthFactor: string;
}

export const HealthFactorBadge = ({ healthFactor }: HealthFactorBadgeProps) => {
  const hf = parseFloat(healthFactor);
  let colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  let label = "Safe";

  if (healthFactor === "∞") {
    colorClass = "bg-sky-500/20 text-sky-400 border-sky-500/30";
    label = "No Debt";
  } else if (hf < HEALTH_FACTOR_CRITICAL) {
    colorClass = "bg-red-500/20 text-red-400 border-red-500/30";
    label = "Critical";
  } else if (hf < HEALTH_FACTOR_RISKY) {
    colorClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    label = "Risky";
  }

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${colorClass}`}>
      {healthFactor} · {label}
    </span>
  );
};
