import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "~~/app/api/telegram/link-token/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { isAccessActive } from "~~/services/payments/checkAccess";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));

const LOWER = `0x${"ef".repeat(20)}`;
const MIXED = `0x${"EF".repeat(20)}`;
const NOW = "2026-10-14T09:05:07.000Z";
const EXPIRES_AT = "2026-10-14T09:15:07.000Z";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/telegram/link-token", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

beforeEach(() => {
  fakeSupabase.reset();
  vi.mocked(isAccessActive).mockReset();
  vi.mocked(isAccessActive).mockResolvedValue(true);
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:secret");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("POST /api/telegram/link-token", () => {
  it.each([
    ["malformed body", "{"],
    ["missing userId", {}],
    ["non-string userId", { userId: 5 }],
    ["blank userId", { userId: " " }],
  ])("returns 400 for a %s", async (_label, body) => {
    expect(await read(await post(body))).toEqual(json(400, { error: "Missing or invalid userId" }));
  });

  it.each([
    ["JSON null", "null"],
    ["an array", JSON.stringify([{ userId: LOWER }])],
    ["a number", "5"],
    ["a string", JSON.stringify(LOWER)],
  ])("returns 400 for a body that is %s, without the access check", async (_label, body) => {
    expect(await read(await post(body))).toEqual(json(400, { error: "Missing or invalid userId" }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("checks access (trimmed raw-case id) before the Telegram configuration", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.mocked(isAccessActive).mockResolvedValue(false);

    expect(await read(await post({ userId: ` ${MIXED} ` }))).toEqual(
      json(403, { error: "Active paid access required to connect Telegram" }),
    );
    expect(isAccessActive).toHaveBeenCalledWith(MIXED);
  });

  it.each([
    ["the bot username", "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME"],
    ["the bot token", "TELEGRAM_BOT_TOKEN"],
  ])("returns 503 when %s is not configured", async (_label, envName) => {
    vi.stubEnv(envName, "");
    expect(await read(await post({ userId: LOWER }))).toEqual(
      json(503, { error: "Telegram is not configured on this server" }),
    );
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("clears the user's unconsumed tokens, stores a fresh one and returns the deep link", async () => {
    const res = await post({ userId: MIXED });

    const { status, text } = await read(res);
    const body = JSON.parse(text);
    expect(status).toBe(200);
    expect(Object.keys(body)).toEqual(["token", "botUsername", "expiresAt", "deepLink"]);
    expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(body).toEqual({
      token: body.token,
      botUsername: "tokenping_bot",
      expiresAt: EXPIRES_AT,
      deepLink: `https://t.me/tokenping_bot?start=${body.token}`,
    });
    expect(fakeSupabase.log()).toEqual([
      `telegram_link_tokens.delete().eq("user_id","${LOWER}").is("consumed_at",null)`,
      `telegram_link_tokens.insert(${JSON.stringify({ token: body.token, user_id: LOWER, expires_at: EXPIRES_AT })})`,
    ]);
  });

  it("issues a different token on every call", async () => {
    const first = JSON.parse(await (await post({ userId: LOWER })).text());
    const second = JSON.parse(await (await post({ userId: LOWER })).text());
    expect(first.token).not.toBe(second.token);
  });

  it("returns 500 when the token insert fails", async () => {
    fakeSupabase.respond((_query, formatted) =>
      formatted.includes(".insert(") ? { error: { message: "permission denied" } } : undefined,
    );
    expect(await read(await post({ userId: LOWER }))).toEqual(
      json(500, { error: "Failed to create link token: permission denied" }),
    );
  });

  it("ignores a failed cleanup of old tokens", async () => {
    fakeSupabase.respond((_query, formatted) =>
      formatted.includes(".delete(") ? { error: { message: "cleanup failed" } } : undefined,
    );
    expect((await post({ userId: LOWER })).status).toBe(200);
  });
});
