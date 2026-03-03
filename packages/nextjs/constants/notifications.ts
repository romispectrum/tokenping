import type { NotificationService } from "~~/types/notifications";

export const DEFAULT_HEALTH_FACTOR_THRESHOLD = 1.5;

/** Health factor boundaries for badge labels (Critical < 1.1, Risky < 1.5, Safe >= 1.5) */
export const HEALTH_FACTOR_CRITICAL = 1.1;
export const HEALTH_FACTOR_RISKY = 1.5;

export const AVAILABLE_SERVICES: { id: NotificationService; name: string; icon: string }[] = [
  { id: "email", name: "Email", icon: "📧" },
];
