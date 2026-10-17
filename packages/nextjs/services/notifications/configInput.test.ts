import { describe, expect, it } from "vitest";
import { buildConfigUpdate, validateNotificationForm } from "~~/components/custom/notifications/notificationForm";
import { type ConfigInput, parseConfigInput } from "~~/services/notifications/configInput";

const DEFAULTS = {
  enabled: true,
  services: [],
  healthFactorThreshold: 1.5,
  email: null,
  signalRecipient: null,
  telegramUsername: null,
  locale: "en",
};

const SERVICES_ERROR = "Invalid services: expected an array of email, signal, telegram";
const THRESHOLD_ERROR = "Invalid healthFactorThreshold: expected a finite number";
const EMAIL_ERROR = "Invalid email address for email notifications";
const SIGNAL_ERROR = "Invalid Signal username for Signal notifications. Expected format: alice.42";
const TELEGRAM_ERROR =
  "Invalid Telegram username for Telegram notifications. Expected 4 to 32 letters, digits or underscores, e.g. alice_eth";
const LOCALE_ERROR = "Invalid locale: expected one of en, cs";

describe("parseConfigInput", () => {
  it.each<[ConfigInput, Record<string, unknown>]>([
    [{}, {}],
    [{ services: null }, {}],
    [{ enabled: false }, { enabled: false }],
    [{ enabled: null }, {}],
    [
      { services: ["email", "telegram"], email: "a@b.co", telegramUsername: "alice_eth" },
      { services: ["email", "telegram"], email: "a@b.co", telegramUsername: "alice_eth" },
    ],
    [{ healthFactorThreshold: 1.8 }, { healthFactorThreshold: 1.8 }],
    [{ healthFactorThreshold: 1.234 }, { healthFactorThreshold: 1.234 }],
    [{ healthFactorThreshold: null }, {}],
    // Clamped to the shared 1.1-10 bounds.
    [{ healthFactorThreshold: 0 }, { healthFactorThreshold: 1.1 }],
    [{ healthFactorThreshold: -3 }, { healthFactorThreshold: 1.1 }],
    [{ healthFactorThreshold: 15 }, { healthFactorThreshold: 10 }],
    // Selected recipients are validated and stored normalized.
    [
      { services: ["email"], email: "  a@b.co " },
      { services: ["email"], email: "a@b.co" },
    ],
    [
      { services: ["signal"], signalRecipient: "ursula.42" },
      { services: ["signal"], signalRecipient: "ursula.42" },
    ],
    [
      { services: ["signal"], signalRecipient: " u:@alice.42 " },
      { services: ["signal"], signalRecipient: "alice.42" },
    ],
    [
      { services: ["signal"], signalRecipient: "@uma.01" },
      { services: ["signal"], signalRecipient: "uma.01" },
    ],
    // A Telegram username is stored lowercased, without "@" or a t.me link.
    [
      { services: ["telegram"], telegramUsername: "alice_eth" },
      { services: ["telegram"], telegramUsername: "alice_eth" },
    ],
    [
      { services: ["telegram"], telegramUsername: " @Alice_Eth " },
      { services: ["telegram"], telegramUsername: "alice_eth" },
    ],
    [
      { services: ["telegram"], telegramUsername: "https://t.me/Alice_Eth/" },
      { services: ["telegram"], telegramUsername: "alice_eth" },
    ],
    [
      { services: ["telegram"], telegramUsername: "abcd" },
      { services: ["telegram"], telegramUsername: "abcd" },
    ],
    [
      { services: ["telegram"], telegramUsername: "A".repeat(32) },
      { services: ["telegram"], telegramUsername: "a".repeat(32) },
    ],
    // Recipients of unselected services are not validated: stringified, trimmed / normalized once, blank → null.
    [{ email: " x@y.io " }, { email: "x@y.io" }],
    [{ email: "not-an-email" }, { email: "not-an-email" }],
    [{ email: 42 }, { email: "42" }],
    [{ email: 0 }, { email: "0" }],
    [{ email: false }, { email: "false" }],
    [{ email: "   " }, {}],
    [{ email: "" }, {}],
    [{ signalRecipient: "ursula.42" }, { signalRecipient: "ursula.42" }],
    [{ signalRecipient: "@ @ alice.42" }, { signalRecipient: " @ alice.42" }],
    [{ signalRecipient: 0 }, { signalRecipient: "0" }],
    [{ signalRecipient: "u:" }, {}],
    [{ signalRecipient: "  " }, {}],
    // An unselected Telegram username is kept only when valid: the database checks its format.
    [{ telegramUsername: "@Alice_Eth" }, { telegramUsername: "alice_eth" }],
    [
      { services: ["email"], email: "a@b.co", telegramUsername: "alice_eth" },
      { services: ["email"], email: "a@b.co", telegramUsername: "alice_eth" },
    ],
    [{ telegramUsername: "abc" }, {}],
    [{ telegramUsername: "a".repeat(33) }, {}],
    [{ telegramUsername: "alice_eth_" }, {}],
    [{ telegramUsername: "9lives" }, {}],
    [{ telegramUsername: "alice.42" }, {}],
    [{ telegramUsername: "  " }, {}],
    [{ telegramUsername: "" }, {}],
    [{ telegramUsername: null }, {}],
    [{ telegramUsername: 1234 }, {}],
    [{ telegramUsername: ["alice_eth"] }, {}],
    [{ telegramUsername: `${" ".repeat(60)}alice_eth` }, {}],
    // The alert language: English when absent.
    [{ locale: "cs" }, { locale: "cs" }],
    [{ locale: "en" }, { locale: "en" }],
    [{ locale: undefined }, {}],
    [{ locale: null }, {}],
  ])("accepts %j as the defaults plus %j", (input, overrides) => {
    expect(parseConfigInput(input)).toStrictEqual({ value: { ...DEFAULTS, ...overrides } });
  });

  it.each<[string, ConfigInput, string]>([
    ["a string services", { services: "email" }, SERVICES_ERROR],
    ["an unknown service", { services: ["sms"] }, SERVICES_ERROR],
    ["a non-string service", { services: ["email", 5] }, SERVICES_ERROR],
    ["a services object", { services: { email: true } }, SERVICES_ERROR],
    ["a string threshold", { healthFactorThreshold: "2" }, THRESHOLD_ERROR],
    ["a boolean threshold", { healthFactorThreshold: true }, THRESHOLD_ERROR],
    ["an infinite threshold", { healthFactorThreshold: Infinity }, THRESHOLD_ERROR],
    ["a NaN threshold", { healthFactorThreshold: NaN }, THRESHOLD_ERROR],
    ["a selected email that is missing", { services: ["email"] }, EMAIL_ERROR],
    ["a selected email that is blank", { services: ["email"], email: "   " }, EMAIL_ERROR],
    ["a selected email that is malformed", { services: ["email"], email: "a@b" }, EMAIL_ERROR],
    ["a selected email that is not a string", { services: ["email"], email: 42 }, EMAIL_ERROR],
    ["a selected Signal username that is missing", { services: ["signal"] }, SIGNAL_ERROR],
    [
      "a selected Signal username without a discriminator",
      { services: ["signal"], signalRecipient: "alice" },
      SIGNAL_ERROR,
    ],
    ["whitespace after a Signal prefix", { services: ["signal"], signalRecipient: "@ alice.42" }, SIGNAL_ERROR],
    ["a doubled Signal prefix", { services: ["signal"], signalRecipient: "@@alice.42" }, SIGNAL_ERROR],
    ["a selected Signal username that is not a string", { services: ["signal"], signalRecipient: 42 }, SIGNAL_ERROR],
    ["a selected email over 254 characters", { services: ["email"], email: `${"a".repeat(250)}@b.co` }, EMAIL_ERROR],
    [
      "a selected Signal username over 64 characters",
      { services: ["signal"], signalRecipient: `alice.${"4".repeat(59)}` },
      SIGNAL_ERROR,
    ],
    ["a selected Telegram username that is missing", { services: ["telegram"] }, TELEGRAM_ERROR],
    ["a selected Telegram username that is null", { services: ["telegram"], telegramUsername: null }, TELEGRAM_ERROR],
    ["a selected Telegram username that is blank", { services: ["telegram"], telegramUsername: "  " }, TELEGRAM_ERROR],
    [
      "a selected Telegram username that is only an @",
      { services: ["telegram"], telegramUsername: "@" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username of 3 characters",
      { services: ["telegram"], telegramUsername: "abc" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username of 33 characters",
      { services: ["telegram"], telegramUsername: "a".repeat(33) },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username with a trailing underscore",
      { services: ["telegram"], telegramUsername: "alice_eth_" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username with a leading digit",
      { services: ["telegram"], telegramUsername: "9lives" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username with a dot",
      { services: ["telegram"], telegramUsername: "alice.eth" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username that is not a string",
      { services: ["telegram"], telegramUsername: 1234 },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username over 64 raw characters",
      { services: ["telegram"], telegramUsername: `${" ".repeat(60)}alice_eth` },
      TELEGRAM_ERROR,
    ],
    [
      "a Telegram username sent for another selected service",
      { services: ["telegram"], signalRecipient: "alice_eth" },
      TELEGRAM_ERROR,
    ],
    ["an unsupported locale", { locale: "de" }, LOCALE_ERROR],
    ["an upper-case locale", { locale: "CS" }, LOCALE_ERROR],
    ["a region-tagged locale", { locale: "cs-CZ" }, LOCALE_ERROR],
    ["an empty locale", { locale: "" }, LOCALE_ERROR],
    ["a non-string locale", { locale: 1 }, LOCALE_ERROR],
    ["a locale array", { locale: ["cs"] }, LOCALE_ERROR],
  ])("rejects %s", (_label, input, error) => {
    expect(parseConfigInput(input)).toStrictEqual({ error });
  });

  it("accepts a selected email of exactly 254 characters and a Signal username of exactly 64", () => {
    const email = `${"a".repeat(249)}@b.co`;
    const signalRecipient = `alice.${"4".repeat(58)}`;
    expect(parseConfigInput({ services: ["email", "signal"], email, signalRecipient })).toStrictEqual({
      value: { ...DEFAULTS, services: ["email", "signal"], email, signalRecipient },
    });
  });

  it("rejects a 100k-character crafted email in under 50ms", () => {
    const start = performance.now();
    expect(parseConfigInput({ services: ["email"], email: `a@${"a.".repeat(50_000)}@` })).toStrictEqual({
      error: EMAIL_ERROR,
    });
    expect(performance.now() - start).toBeLessThan(50);
  });

  // The client validates and builds the payload with notificationForm; anything it lets through must pass here.
  it.each([
    "alice.42",
    " u:@alice.42 ",
    `alice.${"4".repeat(58)}`,
    `alice.${"4".repeat(59)}`,
    `@alice.${"4".repeat(58)}`,
    `u:@alice.${"4".repeat(59)}`,
  ])("accepts every Signal username the client form accepts, and only those: %j", signalRecipient => {
    const form = { services: ["signal" as const], email: "", signalRecipient, telegramUsername: "" };
    const clientError = validateNotificationForm(form);
    const payload = buildConfigUpdate({ ...form, services: ["signal"], threshold: 1.5 });
    const server = parseConfigInput(payload);
    expect("value" in server).toBe(clientError === null);
  });

  // The client validates and builds the payload with notificationForm; anything it lets through must pass here.
  it.each([
    ["alice_eth", "alice_eth"],
    ["@Alice_Eth", "alice_eth"],
    [" https://t.me/Alice_Eth/ ", "alice_eth"],
    ["abcd", "abcd"],
    ["a".repeat(32), "a".repeat(32)],
  ])("stores every Telegram username the client form accepts as it normalized it: %j", (telegramUsername, stored) => {
    const form = { services: ["telegram" as const], email: "", signalRecipient: "", telegramUsername };
    expect(validateNotificationForm(form)).toBeNull();
    const payload = buildConfigUpdate({ ...form, services: ["telegram"], threshold: 1.5 });
    expect(parseConfigInput(payload)).toStrictEqual({
      value: { ...DEFAULTS, services: ["telegram"], telegramUsername: stored },
    });
  });

  it.each(["", "abc", "alice_eth_", "9lives", "a".repeat(33)])(
    "rejects the Telegram usernames the client form rejects: %j",
    telegramUsername => {
      const form = { services: ["telegram" as const], email: "", signalRecipient: "", telegramUsername };
      expect(validateNotificationForm(form)).not.toBeNull();
      const payload = buildConfigUpdate({ ...form, services: ["telegram"], threshold: 1.5 });
      expect(parseConfigInput(payload)).toStrictEqual({ error: TELEGRAM_ERROR });
    },
  );

  it("reports the first problem in field order: services, threshold, email, Signal, Telegram, locale", () => {
    const allBad = {
      services: ["email", "signal", "telegram"],
      healthFactorThreshold: "x",
      email: "bad",
      signalRecipient: "bad",
      telegramUsername: "bad",
      locale: "de",
    };
    expect(parseConfigInput({ ...allBad, services: ["sms"] })).toStrictEqual({ error: SERVICES_ERROR });
    expect(parseConfigInput(allBad)).toStrictEqual({ error: THRESHOLD_ERROR });
    expect(parseConfigInput({ ...allBad, healthFactorThreshold: 2 })).toStrictEqual({ error: EMAIL_ERROR });
    expect(parseConfigInput({ ...allBad, healthFactorThreshold: 2, email: "a@b.co" })).toStrictEqual({
      error: SIGNAL_ERROR,
    });
    expect(
      parseConfigInput({ ...allBad, healthFactorThreshold: 2, email: "a@b.co", signalRecipient: "alice.42" }),
    ).toStrictEqual({ error: TELEGRAM_ERROR });
    expect(
      parseConfigInput({
        ...allBad,
        healthFactorThreshold: 2,
        email: "a@b.co",
        signalRecipient: "alice.42",
        telegramUsername: "alice_eth",
      }),
    ).toStrictEqual({ error: LOCALE_ERROR });
  });
});
