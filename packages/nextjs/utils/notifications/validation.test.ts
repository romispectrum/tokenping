import { describe, expect, it } from "vitest";
import {
  EMAIL_REGEX,
  SIGNAL_USERNAME_REGEX,
  isNotificationService,
  isValidEmail,
  isValidSignalUsername,
  normalizeSignalUsername,
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
});

describe("SIGNAL_USERNAME_REGEX", () => {
  it("is the regex used by NotificationConfig and sendSignal", () => {
    expect(SIGNAL_USERNAME_REGEX.source).toBe(/^[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/.source);
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
