import { describe, expect, it } from "vitest";
import { ATTRIBUTION_MAX_LENGTH, parseAttributionAnswer } from "~~/services/notifications/attributionInput";

describe("parseAttributionAnswer", () => {
  it("caps answers at 500 characters, matching the database check", () => {
    expect(ATTRIBUTION_MAX_LENGTH).toBe(500);
  });

  it.each([
    ["a short answer", "Reddit", "Reddit"],
    ["surrounding whitespace, trimmed", "  a friend\n", "a friend"],
    ["inner tabs and newlines, kept", "X\tthen\r\nthe blog", "X\tthen\r\nthe blog"],
    ["mixed case and punctuation, kept as typed", "ChatGPT told me!!", "ChatGPT told me!!"],
    ["exactly 500 characters", "a".repeat(500), "a".repeat(500)],
    ["500 emoji (1000 UTF-16 units)", "🔔".repeat(500), "🔔".repeat(500)],
    ["500 characters once trimmed", `  ${"a".repeat(500)}  `, "a".repeat(500)],
    ["an emoji ZWJ sequence", "Family 👨\u200d👩\u200d👧", "Family 👨\u200d👩\u200d👧"],
    ["right-to-left text", "\u0635\u062f\u064a\u0642", "\u0635\u062f\u064a\u0642"],
    ["a no-break space and accents", "caf\u00e9\u00a0cr\u00e8me", "caf\u00e9\u00a0cr\u00e8me"],
  ])("accepts %s", (_label, raw, value) => {
    expect(parseAttributionAnswer(raw)).toEqual({ value });
  });

  it.each([undefined, null, 42, true, {}, ["Reddit"]])("rejects the non-string %j", raw => {
    expect(parseAttributionAnswer(raw)).toEqual({ error: "Invalid answer: expected a string" });
  });

  it.each(["", "   ", "\n\t"])("rejects the blank answer %j", raw => {
    expect(parseAttributionAnswer(raw)).toEqual({ error: "Answer is empty" });
  });

  it.each([
    ["501 characters", "a".repeat(501)],
    ["501 emoji", "🔔".repeat(501)],
    ["a huge body", "a".repeat(1_000_000)],
  ])("rejects %s", (_label, raw) => {
    expect(parseAttributionAnswer(raw)).toEqual({ error: "Answer is longer than 500 characters" });
  });

  it.each([
    ["NUL", "a\u0000b"],
    ["BEL", "a\u0007b"],
    ["ESC", "a\u001bb"],
    ["DEL", "a\u007fb"],
    ["C1 NEL", "a\u0085b"],
    ["C1 CSI", "a\u009bb"],
    ["right-to-left override", "a\u202eb"],
    ["left-to-right embedding", "a\u202ab"],
    ["first strong isolate", "a\u2068b"],
    ["pop directional isolate", "a\u2069b"],
    ["a control after an emoji", "🔔\u202e"],
  ])("rejects the control character %s", (_label, raw) => {
    expect(parseAttributionAnswer(raw)).toEqual({
      error: "Answer contains hidden control characters. Retype it and try again.",
    });
  });

  it.each([
    ["a lone high surrogate", "ok\ud800"],
    ["a lone low surrogate", "\udc00ok"],
    ["a reversed pair", "ok\udc00\ud800"],
  ])("rejects %s, which has no UTF-8 form", (_label, raw) => {
    expect(parseAttributionAnswer(raw)).toEqual({ error: "Answer contains invalid characters" });
  });
});
