import { describe, expect, it, vi } from "vitest";
import {
  type NotificationConfigRow,
  rowToConfig,
  toConfigRow,
  userIdForms,
} from "~~/services/notifications/configRepository";

vi.mock("~~/services/supabase/supabaseServer", () => ({ getSupabaseServerClient: vi.fn() }));

const NOW = new Date("2026-10-14T09:05:07.000Z");

const row = (overrides: Partial<NotificationConfigRow> = {}): NotificationConfigRow => ({
  id: "row-1",
  user_id: "0xabc",
  chain_id: 8453,
  enabled: true,
  services: ["email"],
  health_factor_threshold: "1.80",
  email: "a@b.co",
  signal_recipient: "alice.42",
  created_at: "c",
  updated_at: "u",
  ...overrides,
});

describe("userIdForms", () => {
  it.each([
    ["0xabc", { normalized: "0xabc", legacy: undefined }],
    ["  0xabc ", { normalized: "0xabc", legacy: undefined }],
    ["0xAbC", { normalized: "0xabc", legacy: "0xAbC" }],
    [" 0xAbC ", { normalized: "0xabc", legacy: "0xAbC" }],
  ])("%j → %j", (userId, expected) => {
    expect(userIdForms(userId)).toStrictEqual(expected);
  });
});

describe("rowToConfig", () => {
  it("maps a full row in response key order, without Telegram fields", () => {
    expect(JSON.stringify(rowToConfig(row()))).toBe(
      JSON.stringify({
        chainId: 8453,
        enabled: true,
        services: ["email"],
        healthFactorThreshold: 1.8,
        email: "a@b.co",
        signalRecipient: "alice.42",
      }),
    );
  });

  it("drops null optionals and maps null services to []", () => {
    expect(JSON.stringify(rowToConfig(row({ services: null, email: null, signal_recipient: null })))).toBe(
      '{"chainId":8453,"enabled":true,"services":[],"healthFactorThreshold":1.8}',
    );
  });

  it.each([
    [2, 2],
    ["1.10", 1.1],
    ["abc", NaN],
  ])("parses threshold %j as %j", (stored, expected) => {
    expect(rowToConfig(row({ health_factor_threshold: stored })).healthFactorThreshold).toBe(expected);
  });
});

describe("toConfigRow", () => {
  const values = {
    enabled: false,
    services: ["email" as const, "signal" as const],
    healthFactorThreshold: 1.8,
    email: "a@b.co",
    signalRecipient: "ursula.42",
  };

  it("maps parsed config values to the row columns (values and key order)", () => {
    expect(JSON.stringify(toConfigRow("0xabc", 10, values, NOW))).toBe(
      JSON.stringify({
        user_id: "0xabc",
        chain_id: 10,
        enabled: false,
        services: ["email", "signal"],
        health_factor_threshold: 1.8,
        email: "a@b.co",
        signal_recipient: "ursula.42",
        updated_at: "2026-10-14T09:05:07.000Z",
      }),
    );
  });

  it("stamps updated_at with the current time by default", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    expect(toConfigRow("0xabc", 1, values).updated_at).toBe("2026-10-14T09:05:07.000Z");
    vi.useRealTimers();
  });
});
