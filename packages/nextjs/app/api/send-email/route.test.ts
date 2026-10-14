import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "~~/app/api/send-email/route";
import { hasBearerSecret } from "~~/services/api/server/auth";
import { isEmailConfigured, sendEmail } from "~~/services/email/sendEmail";

vi.mock("~~/services/email/sendEmail", () => ({ isEmailConfigured: vi.fn(), sendEmail: vi.fn() }));
vi.mock("~~/services/api/server/auth", async importOriginal => {
  const actual = await importOriginal<typeof import("~~/services/api/server/auth")>();
  return { ...actual, hasBearerSecret: vi.fn(actual.hasBearerSecret) };
});

const SECRET = "cron-s3cret";
const AUTHORIZED = { authorization: `Bearer ${SECRET}` };

const post = (body: unknown, headers: Record<string, string> = AUTHORIZED) =>
  POST(
    new Request("http://localhost/api/send-email", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

const jsonParseMessage = (raw: string) => {
  try {
    JSON.parse(raw);
    return "";
  } catch (e) {
    return (e as Error).message;
  }
};

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
  vi.mocked(hasBearerSecret).mockClear();
  vi.mocked(isEmailConfigured).mockReset();
  vi.mocked(isEmailConfigured).mockReturnValue(true);
  vi.mocked(sendEmail).mockReset();
  vi.mocked(sendEmail).mockResolvedValue({ success: true, id: "email-1" });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/send-email auth (B3.9)", () => {
  it.each([
    ["no Authorization header", {}],
    ["a wrong secret", { authorization: "Bearer nope" }],
    ["a lowercase scheme", { authorization: `bearer ${SECRET}` }],
    ["the bare secret", { authorization: SECRET }],
  ])("returns 401 for %s without sending", async (_label, headers) => {
    expect(await read(await post({ to: "a@b.co" }, headers))).toEqual(json(401, { error: "Unauthorized" }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
  ])("returns 503 without sending when CRON_SECRET is %s, whatever the header", async (_label, secret) => {
    vi.stubEnv("CRON_SECRET", secret);
    expect(await read(await post({ to: "a@b.co" }, { authorization: "Bearer " }))).toEqual(
      json(503, { error: "Email relay is disabled: CRON_SECRET is not configured" }),
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("checks the secret before reading the body", async () => {
    expect(await read(await post("{", {}))).toEqual(json(401, { error: "Unauthorized" }));
  });

  it("checks the bearer with the constant-time hasBearerSecret", async () => {
    await post({ to: "a@b.co" });
    expect(hasBearerSecret).toHaveBeenCalledExactlyOnceWith(expect.any(Request), SECRET);
  });
});

describe("POST /api/send-email", () => {
  it("returns 500 with the JSON parser message for a malformed body", async () => {
    expect(await read(await post("{"))).toEqual(json(500, { error: jsonParseMessage("{") }));
  });

  it("returns 500 for a JSON null body", async () => {
    expect(await read(await post("null"))).toEqual(
      json(500, { error: "Cannot destructure property 'to' of 'body' as it is null." }),
    );
  });

  it.each([
    ["missing", {}],
    ["empty", { to: "" }],
    ["non-string", { to: 42 }],
  ])("returns 400 for a %s recipient", async (_label, body) => {
    expect(await read(await post(body))).toEqual(json(400, { error: "Missing or invalid 'to' email address" }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 503 when Resend is not configured", async () => {
    vi.mocked(isEmailConfigured).mockReturnValue(false);
    expect(await read(await post({ to: "a@b.co" }))).toEqual(
      json(503, { error: "Email service not configured (RESEND_API_KEY missing)" }),
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("passes the fields through, defaulting the subject", async () => {
    expect(await read(await post({ to: " a@b.co ", text: "hi", html: "<p>hi</p>" }))).toEqual(
      json(200, { success: true, id: "email-1", message: "Email sent successfully" }),
    );
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({
      to: " a@b.co ",
      subject: "Notification",
      text: "hi",
      html: "<p>hi</p>",
    });
  });

  it("keeps an explicit subject and omits a missing id from the body", async () => {
    vi.mocked(sendEmail).mockResolvedValue({ success: true });
    expect(await read(await post({ to: "a@b.co", subject: "Hello" }))).toEqual(
      json(200, { success: true, message: "Email sent successfully" }),
    );
    expect(vi.mocked(sendEmail).mock.calls[0][0]).toMatchObject({ subject: "Hello" });
  });

  it.each([
    ["an empty subject as is", "", ""],
    ["the default for a null subject", null, "Notification"],
  ])("passes %s", async (_label, subject, expected) => {
    await post({ to: "a@b.co", subject });
    expect(vi.mocked(sendEmail).mock.calls[0][0]).toMatchObject({ subject: expected });
  });

  it.each([
    ["503 for a 'not configured' error", "Email service not configured (RESEND_API_KEY missing)", 503],
    ["502 for an invalid address", "Invalid email address", 502],
    ["502 for a provider error", "Rate limit exceeded", 502],
  ])("returns %s", async (_label, error, status) => {
    vi.mocked(sendEmail).mockResolvedValue({ success: false, error });
    expect(await read(await post({ to: "a@b.co" }))).toEqual(json(status, { error }));
  });

  it("returns 500 when sending throws", async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error("socket hang up"));
    expect(await read(await post({ to: "a@b.co" }))).toEqual(json(500, { error: "socket hang up" }));
  });
});
