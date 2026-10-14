import { describe, expect, it } from "vitest";
import { parseCommand } from "~~/app/api/telegram/bot";

describe("parseCommand", () => {
  it.each([
    ["/start", { name: "start", token: undefined }],
    ["/start TOKEN", { name: "start", token: "TOKEN" }],
    ["  /start \t TOKEN  extra ", { name: "start", token: "TOKEN" }],
    ["/start\nTOKEN", { name: "start", token: "TOKEN" }],
    // BUG(S3.21): prefix matching.
    ["/startTOKEN", { name: "start", token: undefined }],
    ["/start@tokenping_bot TOKEN", { name: "start", token: "TOKEN" }],
    ["/stop", { name: "stop" }],
    ["/stopwatch", { name: "stop" }],
    ["/stop now", { name: "stop" }],
    ["/help", { name: "help" }],
    ["/helpme", { name: "help" }],
    ["/START", { name: "unknown" }],
    ["start", { name: "unknown" }],
    ["hello /start", { name: "unknown" }],
    ["", { name: "unknown" }],
  ])("parses %j as %j", (text, expected) => {
    expect(parseCommand(text)).toEqual(expected);
  });
});
