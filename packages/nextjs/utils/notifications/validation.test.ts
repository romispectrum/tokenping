import { describe, expect, it } from "vitest";
import {
  EMAIL_REGEX,
  MAX_EMAIL_LENGTH,
  MAX_SIGNAL_RECIPIENT_LENGTH,
  MAX_TELEGRAM_INPUT_LENGTH,
  SIGNAL_USERNAME_REGEX,
  TELEGRAM_USERNAME_REGEX,
  isNotificationService,
  isValidEmail,
  isValidSignalUsername,
  isValidTelegramUsername,
  normalizeSignalUsername,
  normalizeTelegramUsername,
} from "~~/utils/notifications/validation";

describe("EMAIL_REGEX / isValidEmail", () => {
  it("is the regex used by NotificationConfig and sendEmail", () => {
    expect(EMAIL_REGEX.source).toBe(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.source);
    expect(EMAIL_REGEX.flags).toBe("");
  });

  it.each(["a@b.co", "first.last+tag@sub.example.com", "x@y.z", "ü@例え.jp", "a@b.c.d"])("accepts %j", value => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each(["", "a@b", "@b.co", "a@.co", "a@b.", "a b@c.co", "a@@b.co", "a@b@c.co", " a@b.co", "a@b.co "])(
    "rejects %j",
    value => {
      expect(isValidEmail(value)).toBe(false);
    },
  );

  it("does not trim (callers trim first)", () => {
    expect(isValidEmail("  a@b.co  ")).toBe(false);
    expect(isValidEmail("  a@b.co  ".trim())).toBe(true);
  });

  // RFC 5321 caps a forward path at 256 octets including the angle brackets.
  it("accepts up to 254 characters and rejects longer addresses", () => {
    const atLimit = `${"a".repeat(249)}@b.co`;
    expect(MAX_EMAIL_LENGTH).toBe(254);
    expect(atLimit).toHaveLength(254);
    expect(isValidEmail(atLimit)).toBe(true);
    expect(isValidEmail(`a${atLimit}`)).toBe(false);
  });

  // EMAIL_REGEX backtracks quadratically on this shape: 100k characters took seconds before the length cap.
  it("rejects a 100k-character crafted address in under 50ms, before running the regex", () => {
    const crafted = `a@${"a.".repeat(50_000)}@`;
    const start = performance.now();
    expect(isValidEmail(crafted)).toBe(false);
    expect(performance.now() - start).toBeLessThan(50);
  });
});

describe("SIGNAL_USERNAME_REGEX", () => {
  it("is the regex used by NotificationConfig and sendSignal", () => {
    expect(SIGNAL_USERNAME_REGEX.source).toBe(/^(?=.{1,64}$)[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/.source);
    expect(SIGNAL_USERNAME_REGEX.flags).toBe("");
  });

  it.each(["alice.42", "a.01", "my_bot.01", "Bob_99.123", `a${"b".repeat(29)}.42`])("accepts %j", value => {
    expect(SIGNAL_USERNAME_REGEX.test(value)).toBe(true);
  });

  it.each([
    "",
    "alice",
    "alice.4",
    "_alice.42",
    "@alice.42",
    "u:alice.42",
    "ali-ce.42",
    "alice.4a",
    `a${"b".repeat(30)}.42`,
  ])("rejects %j", value => {
    expect(SIGNAL_USERNAME_REGEX.test(value)).toBe(false);
  });

  // The client form and sendSignal test the normalized value with this regex directly, so it carries the cap too.
  it("caps the value at MAX_SIGNAL_RECIPIENT_LENGTH characters", () => {
    const atLimit = `alice.${"4".repeat(MAX_SIGNAL_RECIPIENT_LENGTH - 6)}`;
    expect(atLimit).toHaveLength(MAX_SIGNAL_RECIPIENT_LENGTH);
    expect(SIGNAL_USERNAME_REGEX.test(atLimit)).toBe(true);
    expect(SIGNAL_USERNAME_REGEX.test(`${atLimit}4`)).toBe(false);
  });

  it.each([
    "alice.42",
    "uma.01",
    `alice.${"4".repeat(58)}`,
    `alice.${"4".repeat(59)}`,
    `a.${"1".repeat(200)}`,
    "_a.42",
  ])("agrees with isValidSignalUsername on the normalized value the client sends: %j", normalized => {
    expect(SIGNAL_USERNAME_REGEX.test(normalized)).toBe(isValidSignalUsername(normalized));
  });
});

describe("normalizeSignalUsername", () => {
  it.each([
    ["alice.42", "alice.42"],
    ["@alice.42", "alice.42"],
    ["u:alice.42", "alice.42"],
    ["u:@alice.42", "alice.42"],
    ["  @alice.42  ", "alice.42"],
    [" u:@alice.42 ", "alice.42"],
    ["", ""],
    ["   ", ""],
    ["@", ""],
    ["u:", ""],
    ["u:@", ""],
    ["@u:", "u:"],
  ])("normalizes %j to %j", (raw, expected) => {
    expect(normalizeSignalUsername(raw)).toBe(expected);
  });

  // Regression for B3.1: the old /^[u:@]+/ stripped any leading run of "u", ":" and "@".
  it.each([
    ["ursula.42", "ursula.42"],
    ["@uma.01", "uma.01"],
    ["uu.10", "uu.10"],
    ["u:ursula.42", "ursula.42"],
    ["u:@uma.01", "uma.01"],
  ])("keeps usernames that start with u intact: %j -> %j", (raw, expected) => {
    expect(normalizeSignalUsername(raw)).toBe(expected);
  });

  it.each([
    ["@@alice.42", "@alice.42"],
    ["u:u:alice.42", "u:alice.42"],
    ["@u:alice.42", "u:alice.42"],
    [":@u:bob.12", ":@u:bob.12"],
  ])("strips each prefix at most once and only in the order u: then @: %j -> %j", (raw, expected) => {
    expect(normalizeSignalUsername(raw)).toBe(expected);
  });

  it.each([
    ["@@alice.42", "@alice.42", "alice.42"],
    ["u:u:alice.42", "u:alice.42", "alice.42"],
    ["@u:alice.42", "u:alice.42", "alice.42"],
    ["u: alice.42", " alice.42", "alice.42"],
  ])("is not idempotent, so callers normalize once: %j -> %j -> %j", (raw, once, twice) => {
    expect(normalizeSignalUsername(raw)).toBe(once);
    expect(normalizeSignalUsername(once)).toBe(twice);
  });

  it("keeps whitespace that follows a prefix", () => {
    expect(normalizeSignalUsername("u: alice.42")).toBe(" alice.42");
    expect(normalizeSignalUsername("@ alice.42")).toBe(" alice.42");
  });

  it("is case-sensitive: an uppercase U is kept", () => {
    expect(normalizeSignalUsername("Ursula.42")).toBe("Ursula.42");
    expect(normalizeSignalUsername("U:alice.42")).toBe("U:alice.42");
  });
});

describe("isValidSignalUsername", () => {
  it.each(["alice.42", "@alice.42", " u:alice.42 ", "u:@alice.42", "ursula.42", "uu.10", "@uma.01"])(
    "accepts %j",
    raw => {
      expect(isValidSignalUsername(raw)).toBe(true);
    },
  );

  it.each(["", "@", "u:", "alice", "_x.42", "@@alice.42", "u: alice.42", "@ alice.42", "U:alice.42"])(
    "rejects %j",
    raw => {
      expect(isValidSignalUsername(raw)).toBe(false);
    },
  );

  it("accepts up to 64 characters of raw input and rejects longer input", () => {
    const atLimit = `alice.${"4".repeat(58)}`;
    expect(MAX_SIGNAL_RECIPIENT_LENGTH).toBe(64);
    expect(atLimit).toHaveLength(64);
    expect(isValidSignalUsername(atLimit)).toBe(true);
    // The cap applies to the raw value, so padding that normalization would strip still counts.
    expect(isValidSignalUsername(`${atLimit}4`)).toBe(false);
    expect(isValidSignalUsername(` ${atLimit}`)).toBe(false);
  });

  it("rejects a 100k-character recipient in under 50ms", () => {
    const crafted = `a.${"1".repeat(100_000)}x`;
    const start = performance.now();
    expect(isValidSignalUsername(crafted)).toBe(false);
    expect(performance.now() - start).toBeLessThan(50);
  });

  // The hazard in validating an already normalized value: it passes although the value that would be sent does not.
  it.each(["@@alice.42", "u:u:alice.42", "@u:alice.42", "u: alice.42"])(
    "rejects %j but accepts its normalized form, which is not a valid username",
    raw => {
      const normalized = normalizeSignalUsername(raw);
      expect(isValidSignalUsername(raw)).toBe(false);
      expect(SIGNAL_USERNAME_REGEX.test(normalized)).toBe(false);
      expect(isValidSignalUsername(normalized)).toBe(true);
    },
  );
});

describe("TELEGRAM_USERNAME_REGEX", () => {
  // The same pattern as the telegram_chats and notification_configs.telegram_username checks in the migration.
  it("is the database's check", () => {
    expect(TELEGRAM_USERNAME_REGEX.source).toBe(/^[a-z][a-z0-9_]{2,30}[a-z0-9]$/.source);
    expect(TELEGRAM_USERNAME_REGEX.flags).toBe("");
  });

  it.each(["abcd", "alice_eth", "a1_2", "a__b", "abc9", "a".repeat(32)])("accepts the stored form %j", value => {
    expect(TELEGRAM_USERNAME_REGEX.test(value)).toBe(true);
  });

  it.each(["", "abc", "a".repeat(33), "Alice_eth", "@alice_eth", "9lives", "_alice", "alice_", "alice.eth", "ali ce"])(
    "rejects %j",
    value => {
      expect(TELEGRAM_USERNAME_REGEX.test(value)).toBe(false);
    },
  );
});

describe("normalizeTelegramUsername", () => {
  it.each([
    ["alice_eth", "alice_eth"],
    ["Alice_Eth", "alice_eth"],
    ["@Alice_Eth", "alice_eth"],
    ["  @alice_eth  ", "alice_eth"],
    ["t.me/alice_eth", "alice_eth"],
    ["T.ME/Alice_Eth", "alice_eth"],
    ["telegram.me/alice_eth", "alice_eth"],
    ["https://t.me/alice_eth", "alice_eth"],
    ["http://t.me/alice_eth", "alice_eth"],
    ["https://www.t.me/alice_eth", "alice_eth"],
    ["HTTPS://Telegram.Me/Alice_Eth/", "alice_eth"],
    [" https://t.me/alice_eth/// ", "alice_eth"],
    ["t.me/@alice_eth", "alice_eth"],
    ["alice_eth/", "alice_eth"],
    ["", ""],
    ["   ", ""],
    ["@", ""],
    ["t.me/", ""],
  ])("normalizes %j to %j", (raw, expected) => {
    expect(normalizeTelegramUsername(raw)).toBe(expected);
  });

  it.each([
    ["@@alice_eth", "@alice_eth"],
    ["@ alice_eth", " alice_eth"],
    ["@t.me/alice_eth", "t.me/alice_eth"],
    ["https://t.me/alice_eth?start=abc", "alice_eth?start=abc"],
    ["https://t.me/s/alice_eth", "s/alice_eth"],
    ["ftp://t.me/alice_eth", "ftp://t.me/alice_eth"],
    ["https://example.com/alice_eth", "https://example.com/alice_eth"],
    ["xt.me/alice_eth", "xt.me/alice_eth"],
  ])("strips each prefix once and only at the start: %j -> %j", (raw, expected) => {
    expect(normalizeTelegramUsername(raw)).toBe(expected);
  });
});

describe("isValidTelegramUsername", () => {
  it.each([
    "abcd",
    "alice_eth",
    "Alice_Eth",
    "ALICE_ETH",
    "@alice_eth",
    " @Alice_Eth ",
    "t.me/alice_eth",
    "https://t.me/Alice_Eth",
    "https://telegram.me/alice_eth/",
    "a".repeat(32),
    `@${"a".repeat(32)}`,
  ])("accepts %j", raw => {
    expect(isValidTelegramUsername(raw)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["only an @", "@"],
    ["3 characters", "abc"],
    ["33 characters", "a".repeat(33)],
    ["a trailing underscore", "alice_eth_"],
    ["a leading underscore", "_alice_eth"],
    ["a leading digit", "1alice"],
    ["a dot", "alice.eth"],
    ["a hyphen", "alice-eth"],
    ["an inner space", "alice eth"],
    ["two @", "@@alice_eth"],
    ["a space after the @", "@ alice_eth"],
    ["a non-ASCII letter", "románek"],
    ["a link with a query", "https://t.me/alice_eth?start=abc"],
    ["a link to another site", "https://example.com/alice_eth"],
    ["a Signal username", "alice.42"],
  ])("rejects %s: %j", (_label, raw) => {
    expect(isValidTelegramUsername(raw)).toBe(false);
  });

  it("accepts up to 64 characters of raw input and rejects longer input", () => {
    const atLimit = `${" ".repeat(32)}${"a".repeat(32)}`;
    expect(MAX_TELEGRAM_INPUT_LENGTH).toBe(64);
    expect(atLimit).toHaveLength(64);
    expect(isValidTelegramUsername(atLimit)).toBe(true);
    // The cap applies to the raw value, so padding that normalization would strip still counts.
    expect(isValidTelegramUsername(` ${atLimit}`)).toBe(false);
    expect(isValidTelegramUsername(`${atLimit}/`)).toBe(false);
  });

  it("fits a 32-character username behind the longest link prefix", () => {
    const link = `https://www.telegram.me/${"a".repeat(32)}/`;
    expect(link.length).toBeLessThanOrEqual(MAX_TELEGRAM_INPUT_LENGTH);
    expect(isValidTelegramUsername(link)).toBe(true);
  });

  it("rejects a 100k-character input in under 50ms", () => {
    const crafted = `a${"_".repeat(100_000)}`;
    const start = performance.now();
    expect(isValidTelegramUsername(crafted)).toBe(false);
    expect(performance.now() - start).toBeLessThan(50);
  });

  it.each(["alice_eth", "@Alice_Eth", "https://t.me/Alice_Eth/", "abcd", "a".repeat(32)])(
    "normalizes the valid %j to a value that is valid as stored",
    raw => {
      const stored = normalizeTelegramUsername(raw);
      expect(TELEGRAM_USERNAME_REGEX.test(stored)).toBe(true);
      expect(isValidTelegramUsername(stored)).toBe(true);
      expect(normalizeTelegramUsername(stored)).toBe(stored);
    },
  );
});

describe("isNotificationService", () => {
  it.each(["email", "signal", "telegram"])("accepts %j", value => {
    expect(isNotificationService(value)).toBe(true);
  });

  it.each(["Email", " email", "sms", "", null, undefined, 0, {}, ["email"]])("rejects %j", value => {
    expect(isNotificationService(value)).toBe(false);
  });

  it("matches NotificationConfig's inline filter", () => {
    const raw: unknown[] = ["email", "sms", "signal", "EMAIL", "telegram", null, "telegram "];
    const legacy = raw.filter(s => s === "email" || s === "signal" || s === "telegram");
    expect(raw.filter(isNotificationService)).toEqual(legacy);
  });
});
