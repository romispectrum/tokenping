import { describe, expect, it, vi } from "vitest";
import {
  type NotificationConfigRow,
  rowChannelLocale,
  rowLocale,
  rowMarket,
  rowMarketKey,
  rowToConfig,
  toConfigRow,
  userIdForms,
} from "~~/services/notifications/configRepository";

vi.mock("~~/services/supabase/supabaseServer", () => ({ getSupabaseServerClient: vi.fn() }));

const NOW = new Date("2026-10-14T09:05:07.000Z");

// The Ethereum Lido Spoke, as notification_configs.market stores it.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";

const row = (overrides: Partial<NotificationConfigRow> = {}): NotificationConfigRow => ({
  id: "row-1",
  user_id: "0xabc",
  chain_id: 8453,
  market: "v3",
  enabled: true,
  services: ["email"],
  health_factor_threshold: "1.80",
  email: "a@b.co",
  signal_recipient: "alice.42",
  telegram_username: "alice_eth",
  locale: "cs",
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
  it("maps a full row in response key order", () => {
    expect(JSON.stringify(rowToConfig(row()))).toBe(
      JSON.stringify({
        chainId: 8453,
        market: "v3",
        enabled: true,
        services: ["email"],
        healthFactorThreshold: 1.8,
        email: "a@b.co",
        signalRecipient: "alice.42",
        telegramUsername: "alice_eth",
        locale: "cs",
        channelLocales: { email: "cs" },
      }),
    );
  });

  it("drops null optionals and maps null services to [], keeping the locale", () => {
    const empty = row({ services: null, email: null, signal_recipient: null, telegram_username: null });
    expect(JSON.stringify(rowToConfig(empty))).toBe(
      '{"chainId":8453,"market":"v3","enabled":true,"services":[],"healthFactorThreshold":1.8,"locale":"cs","channelLocales":{}}',
    );
  });

  // What the form and the summary show: the language each selected channel actually goes out in.
  it("lists the language of each selected channel: its own, else the row's", () => {
    const mixed = row({ services: ["email", "signal", "telegram", "sms"], locale: "cs", signal_locale: "en" });
    expect(rowToConfig(mixed).channelLocales).toStrictEqual({ email: "cs", signal: "en", telegram: "cs" });
    // An unselected channel's language is not listed.
    expect(rowToConfig(row({ services: ["email"], telegram_locale: "en" })).channelLocales).toStrictEqual({
      email: "cs",
    });
  });

  it("leaves the Telegram username out of the JSON for a row from before the telegram_username column", () => {
    const legacy = row();
    delete legacy.telegram_username;
    expect(rowToConfig(legacy).telegramUsername).toBeUndefined();
    expect(JSON.stringify(rowToConfig(legacy))).not.toContain("telegramUsername");
  });

  it("keeps a V4 row's Spoke as its market", () => {
    expect(rowToConfig(row({ chain_id: 1, market: LIDO_SPOKE })).market).toBe(LIDO_SPOKE);
  });

  it.each([
    [2, 2],
    ["1.10", 1.1],
    ["abc", NaN],
  ])("parses threshold %j as %j", (stored, expected) => {
    expect(rowToConfig(row({ health_factor_threshold: stored })).healthFactorThreshold).toBe(expected);
  });
});

describe("rowLocale", () => {
  it.each([
    ["cs", "cs"],
    ["en", "en"],
    // Rows from before the locale migration have no column; anything unexpected is English.
    [undefined, "en"],
    [null, "en"],
    ["de", "en"],
    ["CS", "en"],
  ])("reads the stored locale %j as %j", (locale, expected) => {
    expect(rowLocale({ locale })).toBe(expected);
    expect(rowToConfig(row({ locale })).locale).toBe(expected);
  });
});

describe("rowChannelLocale", () => {
  it.each([
    ["en", "cs", "en"],
    ["cs", "en", "cs"],
    // No language of its own (null, or a row from before the column): the row's.
    [null, "cs", "cs"],
    [undefined, "cs", "cs"],
    // Anything unexpected falls through to the row's, and to English after that.
    ["de", "cs", "cs"],
    [null, null, "en"],
  ])("reads Telegram's own %j over the row's %j as %j", (own, locale, expected) => {
    expect(rowChannelLocale({ locale, telegram_locale: own }, "telegram")).toBe(expected);
  });

  it("reads each channel's own column", () => {
    const languages = { locale: "en", email_locale: "cs", signal_locale: null, telegram_locale: "cs" };
    expect((["email", "signal", "telegram"] as const).map(channel => rowChannelLocale(languages, channel))).toEqual([
      "cs",
      "en",
      "cs",
    ]);
  });
});

describe("rowMarket", () => {
  it.each([
    ["v3", "v3"],
    [LIDO_SPOKE, LIDO_SPOKE],
    // A row from before the market column, and anything the database check would not let in, is V3.
    [undefined, "v3"],
    [null, "v3"],
    ["", "v3"],
    ["V3", "v3"],
    ["0xE1900480ac69f0B296841Cd01cC37546d92F35Cd", "v3"],
    ["0x1234", "v3"],
  ])("reads the stored market %j as %j", (market, expected) => {
    expect(rowMarket({ market })).toBe(expected);
    expect(rowToConfig(row({ market })).market).toBe(expected);
  });
});

describe("rowMarketKey", () => {
  it.each([
    [{ chain_id: 8453, market: "v3" }, "8453:v3"],
    [{ chain_id: 1, market: LIDO_SPOKE }, `1:${LIDO_SPOKE}`],
    [{ chain_id: 10, market: null }, "10:v3"],
    [{ chain_id: 10 }, "10:v3"],
  ])("keys %j as %j", (stored, expected) => {
    expect(rowMarketKey(stored)).toBe(expected);
  });
});

describe("toConfigRow", () => {
  const values = {
    enabled: false,
    services: ["email" as const, "signal" as const],
    healthFactorThreshold: 1.8,
    email: "a@b.co",
    signalRecipient: "ursula.42",
    telegramUsername: "alice_eth",
    locale: "cs" as const,
    channelLocales: { email: "en" as const, signal: null, telegram: "cs" as const },
  };

  it("maps parsed config values to the row columns (values and key order)", () => {
    expect(JSON.stringify(toConfigRow("0xabc", { chainId: 10, market: "v3" }, values, NOW))).toBe(
      JSON.stringify({
        user_id: "0xabc",
        chain_id: 10,
        market: "v3",
        enabled: false,
        services: ["email", "signal"],
        health_factor_threshold: 1.8,
        email: "a@b.co",
        signal_recipient: "ursula.42",
        telegram_username: "alice_eth",
        locale: "cs",
        email_locale: "en",
        signal_locale: null,
        telegram_locale: "cs",
        updated_at: "2026-10-14T09:05:07.000Z",
      }),
    );
  });

  // A null clears a username the row held: the key is always written.
  it("writes a null Telegram username", () => {
    const row = toConfigRow("0xabc", { chainId: 10, market: "v3" }, { ...values, telegramUsername: null }, NOW);
    expect(row).toHaveProperty("telegram_username", null);
  });

  it("writes a V4 Spoke as the market", () => {
    expect(toConfigRow("0xabc", { chainId: 1, market: LIDO_SPOKE }, values, NOW)).toMatchObject({
      chain_id: 1,
      market: LIDO_SPOKE,
    });
  });

  it("stamps updated_at with the current time by default", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    expect(toConfigRow("0xabc", { chainId: 1, market: "v3" }, values).updated_at).toBe("2026-10-14T09:05:07.000Z");
    vi.useRealTimers();
  });
});
