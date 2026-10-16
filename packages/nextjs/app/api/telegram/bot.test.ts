import { describe, expect, it } from "vitest";
import { parseCommand, telegramLocale } from "~~/app/api/telegram/bot";

describe("parseCommand", () => {
  it.each([
    ["/start", { name: "start", token: undefined }],
    ["/start TOKEN", { name: "start", token: "TOKEN" }],
    ["  /start \t TOKEN  extra ", { name: "start", token: "TOKEN" }],
    ["/start\nTOKEN", { name: "start", token: "TOKEN" }],
    ["/start@tokenping_bot TOKEN", { name: "start", token: "TOKEN" }],
    ["/stop", { name: "stop" }],
    ["/stop now", { name: "stop" }],
    ["/stop@tokenping_bot", { name: "stop" }],
    ["/help", { name: "help" }],
    // Commands match exactly, not by prefix (S3.21).
    ["/startTOKEN", { name: "unknown" }],
    ["/stopwatch", { name: "unknown" }],
    ["/stop-alerts", { name: "unknown" }],
    ["/helpme", { name: "unknown" }],
    ["/start@", { name: "unknown" }],
    ["/START", { name: "unknown" }],
    ["start", { name: "unknown" }],
    ["hello /start", { name: "unknown" }],
    ["", { name: "unknown" }],
  ])("parses %j as %j", (text, expected) => {
    expect(parseCommand(text)).toEqual(expected);
  });
});

describe("telegramLocale", () => {
  it.each([
    ["cs", "cs"],
    ["sk", "cs"],
    ["CS", "cs"],
    ["cs-CZ", "cs"],
    ["sk-SK", "cs"],
    ["en", "en"],
    ["en-US", "en"],
    ["de", "en"],
    ["", "en"],
    ["csx", "en"],
    [undefined, "en"],
    [null, "en"],
    [42, "en"],
  ])("answers the Telegram language %j in %j", (languageCode, expected) => {
    expect(telegramLocale(languageCode)).toBe(expected);
  });
});
