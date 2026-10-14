import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCacheKey,
  getCachedConfig,
  invalidateUserConfigCache,
  setCachedConfig,
} from "~~/services/notifications/configCache";

const TTL_MS = 15 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T09:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("configCache", () => {
  it.each([
    [undefined, "0xabc:all"],
    [8453, "0xabc:8453"],
    [0, "0xabc:0"],
  ])("getCacheKey('0xabc', %j) is %j", (chainId, expected) => {
    expect(getCacheKey("0xabc", chainId)).toBe(expected);
  });

  it("misses for an unknown key", () => {
    expect(getCachedConfig("ttl-miss:all")).toEqual({ hit: false, data: null });
  });

  it("caches null as a hit", () => {
    setCachedConfig("ttl-null:1", null);
    expect(getCachedConfig("ttl-null:1")).toEqual({ hit: true, data: null });
  });

  it("expires entries strictly after 15 minutes", () => {
    setCachedConfig("ttl-user:1", { a: 1 });

    vi.setSystemTime(Date.now() + TTL_MS);
    expect(getCachedConfig("ttl-user:1")).toEqual({ hit: true, data: { a: 1 } });

    vi.setSystemTime(Date.now() + 1);
    expect(getCachedConfig("ttl-user:1")).toEqual({ hit: false, data: null });

    vi.setSystemTime(Date.now() - 10_000);
    expect(getCachedConfig("ttl-user:1")).toEqual({ hit: false, data: null });
  });

  it("invalidates every key with the exact `${userId}:` prefix", () => {
    setCachedConfig("0xab:all", 1);
    setCachedConfig("0xab:1", 2);
    setCachedConfig("0xabc:1", 3);

    invalidateUserConfigCache("0xab");

    expect(getCachedConfig("0xab:all").hit).toBe(false);
    expect(getCachedConfig("0xab:1").hit).toBe(false);
    expect(getCachedConfig("0xabc:1")).toEqual({ hit: true, data: 3 });
  });
});
