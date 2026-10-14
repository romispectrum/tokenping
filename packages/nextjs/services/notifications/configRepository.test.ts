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
  it("maps a full row plus the Telegram link, in response key order", () => {
    const config = rowToConfig(row(), { userId: "0xabc", chatId: "42", username: "alice", linkedAt: "t" });
    expect(JSON.stringify(config)).toBe(
      JSON.stringify({
        chainId: 8453,
        enabled: true,
        services: ["email"],
        healthFactorThreshold: 1.8,
        email: "a@b.co",
        signalRecipient: "alice.42",
        telegramChatId: "42",
        telegramUsername: "alice",
      }),
    );
  });

  it("drops null optionals and maps null services to []", () => {
    const config = rowToConfig(row({ services: null, email: null, signal_recipient: null }), {
      userId: "0xabc",
      chatId: "42",
      username: null,
      linkedAt: "t",
    });
    expect(JSON.stringify(config)).toBe(
      '{"chainId":8453,"enabled":true,"services":[],"healthFactorThreshold":1.8,"telegramChatId":"42"}',
    );
  });

  it.each([
    [2, 2],
    ["1.10", 1.1],
    ["abc", NaN],
  ])("parses threshold %j as %j", (stored, expected) => {
    expect(rowToConfig(row({ health_factor_threshold: stored }), null).healthFactorThreshold).toBe(expected);
  });
});

describe("toConfigRow", () => {
  const DEFAULT_ROW = {
    user_id: "0xabc",
    chain_id: 10,
    enabled: true,
    services: [],
    health_factor_threshold: 1.5,
    email: null,
    signal_recipient: null,
    updated_at: "2026-10-14T09:05:07.000Z",
  };

  it.each([
    [{}, {}],
    [
      { enabled: false, services: ["email", "telegram"], healthFactorThreshold: 1.8 },
      { enabled: false, services: ["email", "telegram"], health_factor_threshold: 1.8 },
    ],
    [{ services: "email", healthFactorThreshold: 0 }, { health_factor_threshold: 0 }],
    [{ healthFactorThreshold: "2", enabled: null }, { health_factor_threshold: "2" }],
    [
      { email: "  a@b.co ", signalRecipient: " u:@alice.42 " },
      { email: "a@b.co", signal_recipient: "alice.42" },
    ],
    [{ email: "   ", signalRecipient: "   " }, {}],
    [{ email: "", signalRecipient: "" }, {}],
    [{ email: null, signalRecipient: null }, {}],
    [
      { email: 42, signalRecipient: 42 },
      { email: "42", signal_recipient: "42" },
    ],
    [
      { email: 0, signalRecipient: 0 },
      { email: "0", signal_recipient: "0" },
    ],
    [
      { email: false, signalRecipient: false },
      { email: "false", signal_recipient: "false" },
    ],
    // BUG(B3.1): "ursula.42" is stored as "rsula.42".
    [{ signalRecipient: "ursula.42" }, { signal_recipient: "rsula.42" }],
    [{ signalRecipient: "u:" }, {}],
    [{ signalRecipient: "@ @ alice.42" }, { signal_recipient: " @ alice.42" }],
  ])("builds %j as the default row plus %j (values and key order)", (input, overrides) => {
    expect(JSON.stringify(toConfigRow("0xabc", 10, input, NOW))).toBe(JSON.stringify({ ...DEFAULT_ROW, ...overrides }));
  });

  it("stamps updated_at with the current time by default", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    expect(toConfigRow("0xabc", 1, {}).updated_at).toBe("2026-10-14T09:05:07.000Z");
    vi.useRealTimers();
  });
});
