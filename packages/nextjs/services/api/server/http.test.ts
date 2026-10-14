import { describe, expect, it } from "vitest";
import { internalError, isChainId, jsonError, parseChainId, parseUserId } from "~~/services/api/server/http";

const read = async (res: Response) => ({
  status: res.status,
  type: res.headers.get("content-type"),
  text: await res.text(),
});

describe("jsonError / internalError", () => {
  it("returns { error } JSON with the status", async () => {
    expect(await read(jsonError("Invalid chainId", 400))).toEqual({
      status: 400,
      type: "application/json",
      text: '{"error":"Invalid chainId"}',
    });
  });

  it.each([
    ["an Error's message", new Error("db down"), "db down"],
    ["'Unknown error' for a non-Error", "nope", "Unknown error"],
    ["'Unknown error' for an empty message", new Error(""), "Unknown error"],
  ])("internalError uses %s", async (_label, thrown, message) => {
    expect(await read(internalError(thrown))).toEqual({
      status: 500,
      type: "application/json",
      text: JSON.stringify({ error: message }),
    });
  });
});

describe("parseUserId", () => {
  it.each([undefined, null, "", "   ", 0, 5, true, {}, ["0xabc"]])("rejects %j", raw => {
    expect(parseUserId(raw)).toBeNull();
  });

  it.each([
    ["0xAbC", "0xAbC"],
    ["  0xAbC \n", "0xAbC"],
  ])("returns %j trimmed as %j", (raw, expected) => {
    expect(parseUserId(raw)).toBe(expected);
  });
});

describe("parseChainId", () => {
  it.each([
    [null, undefined],
    ["", undefined],
    ["8453", 8453],
    // BUG(B3.15): parseInt ignores trailing garbage.
    ["1abc", 1],
    ["1.9", 1],
    [" 42", 42],
    ["-5", -5],
    ["0x10", 0],
    ["abc", null],
    [" ", null],
    ["-", null],
  ])("parses %j as %j", (raw, expected) => {
    expect(parseChainId(raw)).toBe(expected);
  });
});

describe("isChainId", () => {
  it.each([
    [1, true],
    [0, true],
    [-1, true],
    [1.5, true],
    [Infinity, true],
    [NaN, false],
    ["1", false],
    [null, false],
    [undefined, false],
    [{}, false],
  ])("%j → %s", (value, expected) => {
    expect(isChainId(value)).toBe(expected);
  });
});
