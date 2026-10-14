import { describe, expect, it } from "vitest";
import {
  maskChatId,
  maskEmail,
  maskRecipient,
  maskSignalUsername,
  redactRecipients,
  shortenAddress,
} from "~~/services/notifications/redact";

describe("maskEmail", () => {
  it.each([
    ["alice@example.com", "a***@example.com"],
    ["a@b.co", "a***@b.co"],
    ["first.last@sub.example.org", "f***@sub.example.org"],
    ["odd@local@example.com", "o***@example.com"],
    ["no-at-sign", "n***"],
    ["@example.com", "***@example.com"],
    ["", "***"],
  ])("%j → %j", (email, masked) => {
    expect(maskEmail(email)).toBe(masked);
  });
});

describe("maskSignalUsername", () => {
  it.each([
    ["alice.42", "al***"],
    ["ursula.01", "ur***"],
    ["a", "***"],
    ["ab", "***"],
    ["", "***"],
  ])("%j → %j", (username, masked) => {
    expect(maskSignalUsername(username)).toBe(masked);
  });
});

describe("maskChatId", () => {
  it.each([
    ["123456789", "***6789"],
    ["-1001234567890", "***7890"],
    ["12345", "***2345"],
    ["1234", "***"],
    ["555", "***"],
    ["", "***"],
  ])("%j → %j", (chatId, masked) => {
    expect(maskChatId(chatId)).toBe(masked);
  });
});

describe("maskRecipient", () => {
  it.each([
    ["email", "a@b.co", "a***@b.co"],
    ["signal", "alice.42", "al***"],
    ["telegram", "123456789", "***6789"],
  ] as const)("masks a %s recipient", (channel, recipient, masked) => {
    expect(maskRecipient(channel, recipient)).toBe(masked);
  });
});

describe("redactRecipients", () => {
  it("masks every occurrence of each recipient", () => {
    const text = 'a@b.co bounced; "alice.42" unknown; chat 123456789 gone; again a@b.co';
    expect(
      redactRecipients(text, [
        { channel: "email", recipient: "a@b.co" },
        { channel: "signal", recipient: "alice.42" },
        { channel: "telegram", recipient: "123456789" },
      ]),
    ).toBe('a***@b.co bounced; "al***" unknown; chat ***6789 gone; again a***@b.co');
  });

  it("also masks the normalized form of a Signal recipient", () => {
    expect(
      redactRecipients('Invalid Signal username "alice.42"', [{ channel: "signal", recipient: "@alice.42" }]),
    ).toBe('Invalid Signal username "al***"');
  });

  it("covers prefixed forms an API may echo", () => {
    expect(redactRecipients("unknown recipient u:alice.42", [{ channel: "signal", recipient: "alice.42" }])).toBe(
      "unknown recipient u:al***",
    );
  });

  it("ignores empty recipients and leaves other text alone", () => {
    expect(redactRecipients("Rate limit exceeded", [{ channel: "telegram", recipient: "" }])).toBe(
      "Rate limit exceeded",
    );
  });
});

describe("shortenAddress", () => {
  it.each([
    [`0x${"3a".repeat(20)}`, "0x3a3a…3a3a"],
    ["0xAbCdEf0123456789aBcDeF0123456789AbCdEf01", "0xAbCd…Ef01"],
    ["0xabc", "0xabc"],
  ])("%j → %j", (address, short) => {
    expect(shortenAddress(address)).toBe(short);
  });
});
