import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type RequestOptions, requestWithRetry } from "~~/scripts/requestWithRetry";

// Each test queues what the server does for each request it receives, in order.
type Reply = (response: ServerResponse, request: IncomingMessage) => void;

const ok: Reply = response => response.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
const status =
  (code: number, headers: Record<string, string> = {}): Reply =>
  response =>
    response.writeHead(code, headers).end();
const dropConnection: Reply = response => response.socket?.destroy();
const hang: Reply = () => undefined;

let server: Server;
let baseUrl: string;
let replies: Reply[];
let received: IncomingMessage[];

beforeAll(async () => {
  server = createServer((request, response) => {
    received.push(request);
    (replies.shift() ?? status(500))(response, request);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});

beforeEach(() => {
  replies = [];
  received = [];
});

const FAST: RequestOptions = { timeoutMs: 200, networkRetryWaitMs: 1, rateLimitWaitMs: 1, log: () => undefined };
const readJson = (response: Response) => response.json();

describe("requestWithRetry", () => {
  it("reads the body of a successful response", async () => {
    replies = [ok];

    await expect(requestWithRetry(baseUrl, readJson, FAST)).resolves.toEqual({ ok: true });
  });

  it("sends the given headers", async () => {
    replies = [ok];
    await requestWithRetry(baseUrl, readJson, { ...FAST, headers: { "x-cg-demo-api-key": "demo" } });

    expect(received[0].headers["x-cg-demo-api-key"]).toBe("demo");
  });

  it("resolves to null for a gone status: 404 by default, others when the caller names them", async () => {
    replies = [status(404), status(403)];

    await expect(requestWithRetry(baseUrl, readJson, FAST)).resolves.toBeNull();
    await expect(requestWithRetry(baseUrl, readJson, { ...FAST, goneStatuses: [403, 404] })).resolves.toBeNull();
    expect(received).toHaveLength(2);
  });

  it("fails at once on any other client error", async () => {
    replies = [status(403), ok];

    await expect(requestWithRetry(baseUrl, readJson, FAST)).rejects.toThrow("HTTP 403");
    expect(received).toHaveLength(1);
  });

  it.each([
    ["a rate limit", status(429)],
    ["a server error", status(503)],
    ["a dropped connection", dropConnection],
    ["a timeout", hang],
  ])("retries after %s", async (_, failure) => {
    replies = [failure, ok];

    await expect(requestWithRetry(baseUrl, readJson, FAST)).resolves.toEqual({ ok: true });
    expect(received).toHaveLength(2);
  });

  it("gives up after the last attempt and names the last failure", async () => {
    replies = [status(500), status(500), status(429)];

    await expect(requestWithRetry(baseUrl, readJson, { ...FAST, attempts: 3 })).rejects.toThrow(
      "failed 3 times, last with HTTP 429",
    );
    expect(received).toHaveLength(3);
  });

  it("waits as long as Retry-After asks, up to the cap", async () => {
    const waits: string[] = [];
    replies = [status(429, { "retry-after": "86400" }), ok];

    await requestWithRetry(baseUrl, readJson, { ...FAST, maxRateLimitWaitMs: 5, log: message => waits.push(message) });

    expect(waits).toEqual(["  HTTP 429 from 127.0.0.1, retrying in 0.005s"]);
  });

  // A body that stalls part way counts as a timeout: the timeout covers reading it, not just the headers.
  it("retries when the body stops arriving", async () => {
    replies = [response => response.writeHead(200, { "content-type": "application/json" }).write('{"ok":'), ok];

    await expect(requestWithRetry(baseUrl, readJson, FAST)).resolves.toEqual({ ok: true });
    expect(received).toHaveLength(2);
  });

  it("names the network error behind the last failure", async () => {
    replies = [dropConnection, dropConnection];

    await expect(requestWithRetry(baseUrl, readJson, { ...FAST, attempts: 2 })).rejects.toThrow(
      /failed 2 times, last with (UND_ERR_SOCKET|ECONNRESET)/,
    );
  });

  // A TypeError without a cause is a bad argument or a bug in the caller, not the network.
  it("fails at once on a header value fetch refuses to send", async () => {
    await expect(
      requestWithRetry(baseUrl, readJson, { ...FAST, headers: { "x-cg-demo-api-key": "key\u200b" } }),
    ).rejects.toThrow(TypeError);
    expect(received).toHaveLength(0);
  });

  it("fails at once when the caller's read throws a TypeError", async () => {
    replies = [ok, ok];
    const readImage = async (response: Response) =>
      ((await response.json()) as { image: { large: string } }).image.large;

    await expect(requestWithRetry(baseUrl, response => readImage(response), FAST)).rejects.toThrow(TypeError);
    expect(received).toHaveLength(1);
  });

  it("does not retry a body that is not what the caller expects", async () => {
    replies = [response => response.writeHead(200).end("not json"), ok];

    await expect(requestWithRetry(baseUrl, readJson, FAST)).rejects.toThrow(SyntaxError);
    expect(received).toHaveLength(1);
  });
});
