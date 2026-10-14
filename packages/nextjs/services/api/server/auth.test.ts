import { timingSafeEqual } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasBearerSecret, safeEqual } from "~~/services/api/server/auth";

vi.mock("crypto", async importOriginal => {
  const actual = await importOriginal<typeof import("crypto")>();
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) };
});

const withAuthorization = (value?: string) =>
  new Request("http://localhost/api", { headers: value === undefined ? {} : { authorization: value } });

beforeEach(() => {
  vi.mocked(timingSafeEqual).mockClear();
});

describe("safeEqual", () => {
  it.each([
    ["s3cret", "s3cret", true],
    ["s3cret", "s3creT", false],
    ["s3cret", "s3cret!", false],
    ["", "s3cret", false],
    ["", "", true],
    ["sécret", "sécret", true],
    ["secret", "sécret", false],
  ])("%j vs %j → %s", (provided, expected, result) => {
    expect(safeEqual(provided, expected)).toBe(result);
  });

  it("compares with crypto.timingSafeEqual even when the lengths differ", () => {
    safeEqual("short", "a much longer secret");
    expect(timingSafeEqual).toHaveBeenCalledOnce();
  });
});

describe("hasBearerSecret", () => {
  it.each([
    ["the exact bearer header", "Bearer s3cret", true],
    ["a wrong secret", "Bearer nope", false],
    ["a lowercase scheme", "bearer s3cret", false],
    ["extra whitespace", "Bearer  s3cret", false],
    ["the bare secret", "s3cret", false],
    ["no header", undefined, false],
  ])("accepts %s: %s", (_label, header, expected) => {
    expect(hasBearerSecret(withAuthorization(header), "s3cret")).toBe(expected);
  });

  it("compares in constant time", () => {
    hasBearerSecret(withAuthorization("Bearer s3cret"), "s3cret");
    expect(timingSafeEqual).toHaveBeenCalledOnce();
  });
});
