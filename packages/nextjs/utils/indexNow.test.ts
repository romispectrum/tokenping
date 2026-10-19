import { afterEach, describe, expect, it, vi } from "vitest";
import { INDEXNOW_KEY_PATH, indexNowKey, isIndexNowKey } from "~~/utils/indexNow";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isIndexNowKey", () => {
  it("accepts 8 to 128 letters, digits or dashes", () => {
    expect(isIndexNowKey("abcd1234")).toBe(true);
    expect(isIndexNowKey("a".repeat(128))).toBe(true);
    expect(isIndexNowKey("0f2B-9c3d-AE14-77aa")).toBe(true);
  });

  it("refuses anything shorter, longer or with other characters", () => {
    expect(isIndexNowKey("abc1234")).toBe(false);
    expect(isIndexNowKey("a".repeat(129))).toBe(false);
    expect(isIndexNowKey("abcd_1234")).toBe(false);
    expect(isIndexNowKey("abcd 1234")).toBe(false);
    expect(isIndexNowKey("abcd1234\n")).toBe(false);
    expect(isIndexNowKey("<html>abcd1234</html>")).toBe(false);
  });
});

describe("indexNowKey", () => {
  it("reads INDEXNOW_KEY, trimmed", () => {
    vi.stubEnv("INDEXNOW_KEY", "  abcd1234abcd1234 ");

    expect(indexNowKey()).toBe("abcd1234abcd1234");
  });

  it("is undefined when the variable is unset, empty or not a valid key", () => {
    vi.stubEnv("INDEXNOW_KEY", undefined);
    expect(indexNowKey()).toBeUndefined();
    expect(indexNowKey("")).toBeUndefined();
    expect(indexNowKey("too short")).toBeUndefined();
  });
});

it("keeps the key file at the site root, so the key covers every URL", () => {
  expect(INDEXNOW_KEY_PATH).toMatch(/^\/[^/]+\.txt$/);
});
