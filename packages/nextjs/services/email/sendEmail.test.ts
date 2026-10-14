import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildEmailBody, isEmailConfigured, sendEmail } from "~~/services/email/sendEmail";

const resend = vi.hoisted(() => ({ send: vi.fn(), constructedWith: [] as unknown[] }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resend.send };
    constructor(key?: string) {
      resend.constructedWith.push(key);
    }
  },
}));

const DEFAULT_FROM = "Tokenping <onboarding@resend.dev>";

/** The payload passed to Resend, serialized so key order is pinned too. */
const sentPayload = () => JSON.stringify(resend.send.mock.calls[0][0]);
const payload = (body: Record<string, unknown>) =>
  JSON.stringify({ from: DEFAULT_FROM, to: ["a@b.co"], subject: "Alert", ...body });

beforeEach(() => {
  resend.constructedWith.length = 0;
  resend.send.mockReset();
  resend.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_FROM_EMAIL", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildEmailBody", () => {
  // Placeholders fill in only for a missing (null/undefined) part, and only when the other part is falsy.
  it.each([
    [undefined, undefined, { html: "<p>No content.</p>", text: "No content." }],
    [null, null, { html: "<p>No content.</p>", text: "No content." }],
    ["", undefined, { html: "<p>No content.</p>", text: "" }],
    ["", null, { html: "<p>No content.</p>", text: "" }],
    ["hi", undefined, { text: "hi" }],
    ["hi", null, { text: "hi" }],
    [undefined, "<b>hi</b>", { html: "<b>hi</b>" }],
    [null, "<b>hi</b>", { html: "<b>hi</b>" }],
    ["hi", "<b>hi</b>", { html: "<b>hi</b>", text: "hi" }],
    ["", "<b>hi</b>", { html: "<b>hi</b>", text: "" }],
    [undefined, "", { html: "", text: "No content." }],
    [null, "", { html: "", text: "No content." }],
    ["", "", { html: "", text: "" }],
    ["hi", "", { html: "", text: "hi" }],
  ])("text %j and html %j → %j (keys in order)", (text, html, expected) => {
    expect(JSON.stringify(buildEmailBody(text, html))).toBe(JSON.stringify(expected));
  });
});

describe("isEmailConfigured", () => {
  it.each([
    ["re_test", true],
    ["", false],
    [undefined, false],
  ])("is %j → %s", (key, expected) => {
    vi.stubEnv("RESEND_API_KEY", key);
    expect(isEmailConfigured()).toBe(expected);
  });
});

describe("sendEmail", () => {
  it("creates the Resend client at send time with the current key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_rotated");
    await sendEmail({ to: "a@b.co", subject: "Alert", text: "x" });
    expect(resend.constructedWith).toEqual(["re_rotated"]);
  });

  it.each(["", "   ", "not-an-email", "a@b", "a b@c.de"])(
    "rejects the address %j before checking the key",
    async to => {
      vi.stubEnv("RESEND_API_KEY", "");
      expect(await sendEmail({ to, subject: "Alert", text: "x" })).toStrictEqual({
        success: false,
        error: "Invalid email address",
      });
      expect(resend.send).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["empty", ""],
    ["unset", undefined],
  ])("reports an %s API key without creating a client", async (_label, key) => {
    vi.stubEnv("RESEND_API_KEY", key);
    expect(await sendEmail({ to: "a@b.co", subject: "Alert", text: "x" })).toStrictEqual({
      success: false,
      error: "Email service not configured (RESEND_API_KEY missing)",
    });
    expect(resend.constructedWith).toHaveLength(0);
    expect(resend.send).not.toHaveBeenCalled();
  });

  it("sends to the trimmed address from the default sender", async () => {
    expect(await sendEmail({ to: "  a@b.co ", subject: "Alert", text: "hello" })).toStrictEqual({
      success: true,
      id: "email-1",
    });
    expect(sentPayload()).toBe(payload({ text: "hello" }));
  });

  it.each([
    ["a configured sender", "Alerts <alerts@tokenping.xyz>", "Alerts <alerts@tokenping.xyz>"],
    ["an empty sender (kept by ??)", "", ""],
  ])("uses %s", async (_label, envFrom, expectedFrom) => {
    vi.stubEnv("RESEND_FROM_EMAIL", envFrom);
    await sendEmail({ to: "a@b.co", subject: "Alert", text: "hello" });
    expect(resend.send.mock.calls[0][0].from).toBe(expectedFrom);
  });

  it.each([
    ["neither text nor html", {}, { html: "<p>No content.</p>", text: "No content." }],
    ["html only", { html: "<b>hi</b>" }, { html: "<b>hi</b>" }],
    ["text only", { text: "hi" }, { text: "hi" }],
    ["both", { text: "hi", html: "<b>hi</b>" }, { html: "<b>hi</b>", text: "hi" }],
    ["empty html", { html: "" }, { html: "", text: "No content." }],
    ["empty text", { text: "" }, { html: "<p>No content.</p>", text: "" }],
    ["empty html and text", { text: "", html: "" }, { html: "", text: "" }],
    ["empty html with text", { text: "hi", html: "" }, { html: "", text: "hi" }],
    ["null html and text", { text: null, html: null }, { html: "<p>No content.</p>", text: "No content." }],
    ["html with null text", { text: null, html: "<b>hi</b>" }, { html: "<b>hi</b>" }],
    ["text with null html", { text: "hi", html: null }, { text: "hi" }],
  ])("builds the body for %s", async (_label, content, expectedBody) => {
    await sendEmail({ to: "a@b.co", subject: "Alert", ...content });
    expect(sentPayload()).toBe(payload(expectedBody));
  });

  it.each([
    ["the provider message", { message: "Rate limit exceeded" }, "Rate limit exceeded"],
    ["a fallback for a missing message", {}, "Failed to send email"],
    ["an empty message as is", { message: "" }, ""],
  ])("returns %s on error", async (_label, error, expected) => {
    resend.send.mockResolvedValue({ data: null, error });
    expect(await sendEmail({ to: "a@b.co", subject: "Alert", text: "x" })).toStrictEqual({
      success: false,
      error: expected,
    });
  });

  it("returns an undefined id when Resend returns no data", async () => {
    resend.send.mockResolvedValue({ data: null, error: null });
    expect(await sendEmail({ to: "a@b.co", subject: "Alert", text: "x" })).toStrictEqual({
      success: true,
      id: undefined,
    });
  });

  it.each([
    ["the exception message", new Error("boom"), "boom"],
    ["a fallback for a non-Error", "nope", "Failed to send email"],
  ])("returns %s when the SDK throws", async (_label, thrown, expected) => {
    resend.send.mockRejectedValue(thrown);
    expect(await sendEmail({ to: "a@b.co", subject: "Alert", text: "x" })).toStrictEqual({
      success: false,
      error: expected,
    });
  });
});

describe("sendEmail without RESEND_API_KEY (real SDK)", () => {
  // The real Resend constructor throws without a key, so the client must not be created at import time (B3.0).
  it("imports and reports 'not configured' instead of crashing the importing route", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.doUnmock("resend");
    vi.resetModules();
    const { sendEmail: realSendEmail } = await import("~~/services/email/sendEmail");
    expect(await realSendEmail({ to: "a@b.co", subject: "Alert", text: "x" })).toStrictEqual({
      success: false,
      error: "Email service not configured (RESEND_API_KEY missing)",
    });
  });
});
