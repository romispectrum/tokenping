import { describe, expect, it } from "vitest";
import {
  EMAIL_REGEX,
  SIGNAL_USERNAME_REGEX,
  isNotificationService,
  isValidEmail,
  isValidSignalUsername,
  normalizeSignalUsername,
  stripLeadingAt,
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

describe("normalizeSignalUsername (server semantics)", () => {
  it.each([
    ["alice.42", "alice.42"],
    ["@alice.42", "alice.42"],
    ["u:alice.42", "alice.42"],
    ["u:@alice.42", "alice.42"],
    ["  @alice.42  ", "alice.42"],
    ["@@alice.42", "alice.42"],
    ["", ""],
    ["   ", ""],
  ])("normalizes %j to %j", (raw, expected) => {
    expect(normalizeSignalUsername(raw)).toBe(expected);
  });

  it("strips any leading run of u, : and @ characters", () => {
    // BUG(B3.1): intended to strip only the literal "@" / "u:" prefixes, but corrupts usernames starting with "u".
    expect(normalizeSignalUsername("ursula.42")).toBe("rsula.42");
    expect(normalizeSignalUsername("@uma.01")).toBe("ma.01");
    expect(normalizeSignalUsername("uu.10")).toBe(".10");
    expect(normalizeSignalUsername(":@u:bob.12")).toBe("bob.12");
  });

  it("is case-sensitive: an uppercase U is kept", () => {
    expect(normalizeSignalUsername("Ursula.42")).toBe("Ursula.42");
  });
});

describe("stripLeadingAt (client semantics)", () => {
  it.each([
    ["alice.42", "alice.42"],
    ["@alice.42", "alice.42"],
    ["  @alice.42 ", "alice.42"],
    ["@@alice.42", "@alice.42"],
    ["u:alice.42", "u:alice.42"],
    ["ursula.42", "ursula.42"],
    ["@", ""],
    ["", ""],
  ])("normalizes %j to %j", (raw, expected) => {
    expect(stripLeadingAt(raw)).toBe(expected);
  });
});

describe("isValidSignalUsername", () => {
  it.each(["alice.42", "@alice.42", " u:alice.42 ", "u:@alice.42"])("accepts %j", raw => {
    expect(isValidSignalUsername(raw)).toBe(true);
  });

  it.each(["", "@", "alice", "uu.10", "_x.42"])("rejects %j", raw => {
    expect(isValidSignalUsername(raw)).toBe(false);
  });

  it("validates the corrupted form of usernames starting with u", () => {
    // BUG(B3.1): "ursula.42" is accepted because its normalized form "rsula.42" is valid.
    expect(isValidSignalUsername("ursula.42")).toBe(true);
  });

  it("is more lenient than the client check, which only strips one '@'", () => {
    const clientCheck = (raw: string) => SIGNAL_USERNAME_REGEX.test(stripLeadingAt(raw));
    expect(clientCheck("u:alice.42")).toBe(false);
    expect(isValidSignalUsername("u:alice.42")).toBe(true);
  });
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
