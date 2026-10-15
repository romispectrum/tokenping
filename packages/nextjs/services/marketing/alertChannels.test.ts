import { afterEach, describe, expect, it, vi } from "vitest";
import { formatAlertChannels, getAlertChannelNames } from "~~/services/marketing/alertChannels";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAlertChannelNames", () => {
  it("names Signal and email while the Telegram bot is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");

    expect(getAlertChannelNames()).toEqual(["Signal", "email"]);
  });

  it("adds Telegram once the bot username is set", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");

    expect(getAlertChannelNames()).toEqual(["Signal", "Telegram", "email"]);
  });
});

describe("formatAlertChannels", () => {
  it.each([
    [["Signal", "email"], "or", "Signal or email"],
    [["Signal", "Telegram", "email"], "or", "Signal, Telegram or email"],
    [["Signal", "Telegram", "email"], "and", "Signal, Telegram and email"],
    [["email"], "or", "email"],
    [[], "or", ""],
  ] as const)("joins %j with %s as %j", (names, conjunction, expected) => {
    expect(formatAlertChannels(conjunction, [...names])).toBe(expected);
  });

  it("defaults to the configured channels and 'or'", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");

    expect(formatAlertChannels()).toBe("Signal or email");
  });
});
