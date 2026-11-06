import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chatHoldsUsername,
  isTelegramConfigured,
  readTelegramUsernames,
  replyToTelegramChat,
  sendTelegramMessage,
} from "~~/services/telegram/sendTelegram";

const TOKEN = "123456:ABC-secret";
const fetchMock = vi.fn();

const telegramResponse = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(telegramResponse(200, { ok: true, result: {} }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("TELEGRAM_BOT_TOKEN", TOKEN);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isTelegramConfigured", () => {
  it.each([
    [TOKEN, true],
    ["", false],
    [undefined, false],
  ])("is %j → %s", (token, expected) => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", token);
    expect(isTelegramConfigured()).toBe(expected);
  });
});

describe("sendTelegramMessage", () => {
  it("posts plain text to the Bot API with an 8s timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");

    expect(await sendTelegramMessage({ chatId: "42", message: "HF alert" })).toStrictEqual({ success: true });

    expect(timeout).toHaveBeenCalledExactlyOnceWith(8000);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(init).toEqual({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"chat_id":"42","text":"HF alert","disable_web_page_preview":true}',
      signal: timeout.mock.results[0].value,
    });
  });

  it.each([
    ["the token is missing", { chatId: "42", message: "m" }, "", "TELEGRAM_BOT_TOKEN missing", "misconfigured"],
    ["the chat id is blank", { chatId: "  ", message: "m" }, TOKEN, "chatId is required", "api_error"],
    ["the message is blank", { chatId: "42", message: " " }, TOKEN, "message is required", "api_error"],
    [
      "the token is missing even if the chat id is blank",
      { chatId: "", message: "" },
      "",
      "TELEGRAM_BOT_TOKEN missing",
      "misconfigured",
    ],
  ])("fails without fetching when %s", async (_label, options, token, error, code) => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", token);
    expect(await sendTelegramMessage(options)).toStrictEqual({ success: false, error, code });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [403, "Forbidden: bot was blocked by the user", "bot_blocked"],
    [403, "Forbidden: user is deactivated", "bot_blocked"],
    [403, "Forbidden: bot can't initiate conversation", "api_error"],
    [400, "Bad Request: chat not found", "chat_not_found"],
    [400, "Bad Request: PEER_ID_INVALID", "chat_not_found"],
    [400, "Bad Request: message is too long", "api_error"],
    [404, "Not Found: chat not found", "api_error"],
    [429, "Too Many Requests", "rate_limited"],
  ])("classifies %d %j as %s", async (status, description, code) => {
    fetchMock.mockResolvedValue(telegramResponse(status, { ok: false, error_code: status, description }));
    expect(await sendTelegramMessage({ chatId: "42", message: "m" })).toStrictEqual({
      success: false,
      error: description,
      code,
    });
  });

  it("includes retryAfter only when Telegram sends it", async () => {
    fetchMock.mockResolvedValue(
      telegramResponse(429, {
        ok: false,
        description: "Too Many Requests: retry after 30",
        parameters: { retry_after: 30 },
      }),
    );
    expect(await sendTelegramMessage({ chatId: "42", message: "m" })).toStrictEqual({
      success: false,
      error: "Too Many Requests: retry after 30",
      code: "rate_limited",
      retryAfter: 30,
    });
  });

  it("fails when the HTTP status is OK but the body is not", async () => {
    fetchMock.mockResolvedValue(telegramResponse(200, { ok: false }));
    expect(await sendTelegramMessage({ chatId: "42", message: "m" })).toStrictEqual({
      success: false,
      error: "Telegram API 200",
      code: "api_error",
    });
  });

  it("falls back to the status for a non-JSON body", async () => {
    fetchMock.mockResolvedValue(telegramResponse(502, "<html>Bad Gateway</html>"));
    expect(await sendTelegramMessage({ chatId: "42", message: "m" })).toStrictEqual({
      success: false,
      error: "Telegram API 502",
      code: "api_error",
    });
  });

  it("redacts the bot token from API descriptions", async () => {
    fetchMock.mockResolvedValue(
      telegramResponse(400, { ok: false, description: `bad url /bot${TOKEN}/x and ${TOKEN}` }),
    );
    const result = await sendTelegramMessage({ chatId: "42", message: "m" });
    expect(result).toMatchObject({ error: "bad url /bot<redacted>/x and <redacted>" });
  });

  it.each([
    [
      "a redacted error message",
      new Error(`request to https://api.telegram.org/bot${TOKEN}/sendMessage failed`),
      "request to https://api.telegram.org/bot<redacted>/sendMessage failed",
    ],
    ["a fallback for a non-Error", "nope", "Unknown error calling Telegram API"],
  ])("maps fetch failures to code network with %s", async (_label, thrown, error) => {
    fetchMock.mockRejectedValue(thrown);
    expect(await sendTelegramMessage({ chatId: "42", message: "m" })).toStrictEqual({
      success: false,
      error,
      code: "network",
    });
  });
});

describe("replyToTelegramChat", () => {
  it("sends the message and resolves to undefined", async () => {
    expect(await replyToTelegramChat("42", "hi")).toBeUndefined();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      chat_id: "42",
      text: "hi",
      disable_web_page_preview: true,
    });
  });

  it("swallows failures", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(replyToTelegramChat("42", "hi")).resolves.toBeUndefined();
  });
});

describe("readTelegramUsernames", () => {
  it("answers the chat's usernames, lowercased, its bought ones included", async () => {
    fetchMock.mockResolvedValue(
      telegramResponse(200, { ok: true, result: { username: "Alice", active_usernames: ["Alice", "bought_name"] } }),
    );
    expect(await readTelegramUsernames("555")).toEqual(["alice", "alice", "bought_name"]);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.telegram.org/bot${TOKEN}/getChat?chat_id=555`);
  });

  it("answers an empty list for a chat with no username left", async () => {
    fetchMock.mockResolvedValue(telegramResponse(200, { ok: true, result: {} }));
    expect(await readTelegramUsernames("555")).toEqual([]);
  });

  it("answers null when Telegram cannot say", async () => {
    fetchMock.mockResolvedValueOnce(telegramResponse(400, { ok: false, description: "chat not found" }));
    expect(await readTelegramUsernames("555")).toBe(null);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await readTelegramUsernames("555")).toBe(null);
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    expect(await readTelegramUsernames("555")).toBe(null);
  });
});

describe("chatHoldsUsername", () => {
  it("is false once the chat holds another username or none", async () => {
    fetchMock.mockResolvedValue(telegramResponse(200, { ok: true, result: { username: "renamed" } }));
    expect(await chatHoldsUsername("555", "alice")).toBe(false);
    expect(await chatHoldsUsername("555", "renamed")).toBe(true);
    fetchMock.mockResolvedValue(telegramResponse(200, { ok: true, result: {} }));
    expect(await chatHoldsUsername("555", "alice")).toBe(false);
  });

  it("is true when Telegram cannot say, so a safety alert still goes out", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await chatHoldsUsername("555", "alice")).toBe(true);
  });
});
