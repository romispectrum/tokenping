import { describe, expect, it } from "vitest";
import {
  internalError,
  isChainId,
  jsonError,
  parseChainId,
  parseUserId,
  readJsonObject,
  rejectCrossSiteRequest,
  requestOrigin,
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
  const request = (body?: string, contentType: string | null = "application/json") =>
    new Request("http://localhost/api", {
      method: "POST",
      body,
      headers: contentType === null ? {} : { "content-type": contentType },
    });

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

describe("readJsonObject: the Content-Type", () => {
  const BODY = '{"chainId":1}';
  const withType = (contentType?: string) =>
    new Request("http://localhost/api", {
      method: "POST",
      body: BODY,
      headers: contentType === undefined ? {} : { "content-type": contentType },
    });

  it.each(["application/json", "application/json; charset=utf-8", "Application/JSON"])("parses %j", async type => {
    expect(await readJsonObject(withType(type))).toEqual({ chainId: 1 });
  });

  // A cross-site form or a no-cors fetch can send these without a CORS preflight.
  it.each([
    undefined,
    "text/plain",
    "text/plain;charset=UTF-8",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
  ])("reads a JSON body sent as %j as {}", async type => {
    expect(await readJsonObject(withType(type))).toEqual({});
  });
});

describe("requestOrigin", () => {
  const origin = (url: string, headers: Record<string, string> = {}) => requestOrigin(new Request(url, { headers }));

  it("uses the URL without proxy headers", () => {
    expect(origin("http://localhost:3000/api/x")).toBe("http://localhost:3000");
  });

  it("prefers the Host header to the URL's host", () => {
    expect(origin("http://internal/api", { host: "localhost:3000" })).toBe("http://localhost:3000");
  });

  it("uses the public host and scheme a proxy forwards, the first of a list, lowercased", () => {
    expect(
      origin("http://internal/api", {
        host: "internal",
        "x-forwarded-host": "TokenPing.xyz, internal",
        "x-forwarded-proto": "https,http",
      }),
    ).toBe("https://tokenping.xyz");
  });
});

describe("rejectCrossSiteRequest", () => {
  const TARGET = "https://tokenping.xyz/api/notifications/config";
  const request = (headers: Record<string, string>) =>
    new Request(TARGET, { method: "PUT", headers: { "content-type": "application/json", ...headers } });
  const read = async (res: Response | null) => res && { status: res.status, body: await res.json() };
  const CROSS_SITE = { status: 403, body: { error: "Cross-site request refused" } };

  it("lets a request from the site's own origin through", async () => {
    expect(rejectCrossSiteRequest(request({ origin: "https://tokenping.xyz" }))).toBeNull();
    expect(rejectCrossSiteRequest(request({ origin: "HTTPS://TOKENPING.XYZ" }))).toBeNull();
  });

  it.each([
    ["another site", "https://evil.example"],
    ["a subdomain", "https://app.tokenping.xyz"],
    ["the site over plain HTTP", "http://tokenping.xyz"],
    ["another port", "https://tokenping.xyz:8443"],
    ["a lookalike suffix", "https://tokenping.xyz.evil.example"],
    ["an opaque origin", "null"],
  ])("refuses an Origin of %s", async (_label, origin) => {
    expect(await read(rejectCrossSiteRequest(request({ origin })))).toEqual(CROSS_SITE);
  });

  it("without Origin, lets only a same-origin Sec-Fetch-Site through", async () => {
    expect(rejectCrossSiteRequest(request({ "sec-fetch-site": "same-origin" }))).toBeNull();
    for (const site of ["same-site", "cross-site", "none"]) {
      expect(await read(rejectCrossSiteRequest(request({ "sec-fetch-site": site })))).toEqual(CROSS_SITE);
    }
    expect(await read(rejectCrossSiteRequest(request({})))).toEqual(CROSS_SITE);
  });

  it("compares with the public origin behind a proxy", () => {
    const proxied = new Request("http://10.0.0.1/api", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-host": "tokenping.xyz",
        "x-forwarded-proto": "https",
        origin: "https://tokenping.xyz",
      },
    });
    expect(rejectCrossSiteRequest(proxied)).toBeNull();
  });

  it("answers 415 for a same-origin body not declared as JSON, unless json is off", async () => {
    const plain = request({ origin: "https://tokenping.xyz", "content-type": "text/plain" });
    expect(await read(rejectCrossSiteRequest(plain))).toEqual({
      status: 415,
      body: { error: "Content-Type must be application/json" },
    });
    expect(rejectCrossSiteRequest(plain, { json: false })).toBeNull();
  });

  it("checks the origin before the Content-Type", async () => {
    const plain = request({ origin: "https://evil.example", "content-type": "text/plain" });
    expect(await read(rejectCrossSiteRequest(plain))).toEqual(CROSS_SITE);
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
