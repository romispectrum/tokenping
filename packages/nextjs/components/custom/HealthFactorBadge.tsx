import { Infinity as InfinityIcon, type LucideIcon, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, type BadgeVariant } from "~~/components/ui";
import { HEALTH_FACTOR_CRITICAL, HEALTH_FACTOR_RISKY } from "~~/constants/notifications";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { INFINITE_HEALTH_FACTOR } from "~~/utils/healthFactor";

type HealthFactorStatus = "no-debt" | "critical" | "risky" | "safe";

type StatusLabel = "noDebt" | "critical" | "risky" | "safe";

// Status colours with an icon and a word each, so the state never rests on colour alone. Never pink.
const STATUS_DISPLAY: Record<HealthFactorStatus, { variant: BadgeVariant; label: StatusLabel; Icon: LucideIcon }> = {
  "no-debt": { variant: "info", label: "noDebt", Icon: InfinityIcon },
  critical: { variant: "destructive", label: "critical", Icon: ShieldAlert },
  risky: { variant: "warning", label: "risky", Icon: TriangleAlert },
  safe: { variant: "success", label: "safe", Icon: ShieldCheck },
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

/** "1.85 Safe" with a shield; "No debt" when Aave reports no borrowing (the health factor is then infinite). */
export const HealthFactorBadge = ({ healthFactor }: HealthFactorBadgeProps) => {
  const t = useMessages(DASHBOARD_MESSAGES).healthFactor;
  const status = getHealthFactorStatus(healthFactor);
  const { variant, label, Icon } = STATUS_DISPLAY[status];

  return (
    <Badge variant={variant} data-status={status}>
      <Icon aria-hidden="true" />
      <span className="sr-only">{t.srPrefix}</span>
      {status !== "no-debt" && healthFactor ? <span className="tabular-nums">{healthFactor}</span> : null}
      <span>{t[label]}</span>
    </Badge>
  );
};
