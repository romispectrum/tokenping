import { describe, expect, it } from "vitest";
import {
  internalError,
  isChainId,
  jsonError,
  parseChainId,
  parseUserId,
  readJsonObject,
} from "~~/services/api/server/http";

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

describe("readJsonObject", () => {
  const request = (body?: string) => new Request("http://localhost/api", { method: "POST", body });

  it("returns a JSON object body as parsed", async () => {
    expect(await readJsonObject(request('{"userId":"0xabc","chainId":1}'))).toEqual({ userId: "0xabc", chainId: 1 });
  });

  it.each([
    ["an empty body", undefined],
    ["malformed JSON", "{"],
    ["JSON null", "null"],
    ["an array", '[{"userId":"0xabc"}]'],
    ["a number", "5"],
    ["a string", '"0xabc"'],
    ["a boolean", "true"],
  ])("reads %s as {}", async (_label, body) => {
    expect(await readJsonObject(request(body))).toEqual({});
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
    [" 42 ", 42],
    ["-5", -5],
    ["007", 7],
    // Only whole decimal integers: trailing garbage is rejected instead of ignored (B3.15).
    ["1abc", null],
    ["1.9", null],
    ["1.0", null],
    ["0x10", null],
    ["1e3", null],
    ["9007199254740993", null],
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
