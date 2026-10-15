import { describe, expect, it } from "vitest";
import {
  AVAILABLE_SERVICES,
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_CRITICAL,
  HEALTH_FACTOR_RISKY,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  NOTIFICATION_CHECK_INTERVAL_MINUTES,
  NOTIFICATION_SERVICES,
  TELEGRAM_LINK_POLL_INTERVAL_MS,
  TELEGRAM_LINK_POLL_TIMEOUT_MS,
  THRESHOLD_SLIDER_MAX,
  THRESHOLD_SLIDER_MIN,
  THRESHOLD_SLIDER_STEP,
} from "~~/constants/notifications";
import vercelConfig from "~~/vercel.json";

describe("notification constants", () => {
  it("keeps the existing health factor values", () => {
    expect(DEFAULT_HEALTH_FACTOR_THRESHOLD).toBe(1.5);
    expect(HEALTH_FACTOR_CRITICAL).toBe(1.1);
    expect(HEALTH_FACTOR_RISKY).toBe(1.5);
  });

  it("lists the services in display order, with the same ids as NOTIFICATION_SERVICES", () => {
    expect(NOTIFICATION_SERVICES).toEqual(["email", "signal", "telegram"]);
    expect(AVAILABLE_SERVICES).toEqual([
      { id: "email", name: "Email" },
      { id: "signal", name: "Signal" },
      { id: "telegram", name: "Telegram" },
    ]);
    expect(AVAILABLE_SERVICES.map(service => service.id)).toEqual(NOTIFICATION_SERVICES);
  });

  it("matches the threshold bounds formerly inlined in NotificationConfig", () => {
    expect(HEALTH_FACTOR_THRESHOLD_MIN).toBe(1.1);
    expect(HEALTH_FACTOR_THRESHOLD_MAX).toBe(10);
    expect(THRESHOLD_SLIDER_MIN).toBe(1.1);
    expect(THRESHOLD_SLIDER_MAX).toBe(3);
    expect(THRESHOLD_SLIDER_STEP).toBe(0.1);
  });

  it("matches the Telegram polling timings formerly inlined in NotificationConfig", () => {
    expect(TELEGRAM_LINK_POLL_INTERVAL_MS).toBe(2_000);
    expect(TELEGRAM_LINK_POLL_TIMEOUT_MS).toBe(120_000);
  });

  it("matches the cron schedule in vercel.json", () => {
    const cron = vercelConfig.crons.find(entry => entry.path === "/api/cron/notifications");
    expect(cron?.schedule).toBe(`*/${NOTIFICATION_CHECK_INTERVAL_MINUTES} * * * *`);
  });
});
