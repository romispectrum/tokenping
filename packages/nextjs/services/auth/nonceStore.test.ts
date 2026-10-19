import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { createNonce, storeNonce, takeNonce } from "~~/services/auth/nonceStore";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const NONCE = "0123456789abcdef0123456789abcdef";
const NOW = new Date("2026-10-19T12:00:00.000Z");
const SWEEP = `auth_nonces.delete().lt("expires_at","2026-10-19T12:00:00.000Z")`;
const INSERT = `auth_nonces.insert({"nonce":"${NONCE}","expires_at":"2026-10-19T12:05:00.000Z"})`;
const TAKE = `auth_nonces.delete().eq("nonce","${NONCE}").gt("expires_at","2026-10-19T12:00:00.000Z").select("nonce")`;

beforeEach(() => {
  fakeSupabase.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createNonce", () => {
  it("returns 32 random hex characters, alphanumeric as EIP-4361 asks", () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("storeNonce", () => {
  it("stores the nonce for five minutes and sweeps the expired ones", async () => {
    expect(await storeNonce(NONCE, NOW)).toBeNull();
    expect(fakeSupabase.log()).toEqual([SWEEP, INSERT]);
  });

  it("returns the insert's error", async () => {
    fakeSupabase.respondByQuery({ [INSERT]: { error: { message: "permission denied" } } });
    expect(await storeNonce(NONCE, NOW)).toEqual({ message: "permission denied" });
  });

  it("still stores the nonce when the sweep fails, and logs it", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fakeSupabase.respondByQuery({ [SWEEP]: { error: { message: "timeout" } } });
    expect(await storeNonce(NONCE, NOW)).toBeNull();
    expect(errors.mock.calls).toEqual([["storeNonce: sweeping expired nonces failed", { message: "timeout" }]]);
  });
});

describe("takeNonce", () => {
  it("deletes an unexpired nonce in one statement and reports that it took it", async () => {
    fakeSupabase.respondByQuery({ [TAKE]: { data: [{ nonce: NONCE }] } });
    expect(await takeNonce(NONCE, NOW)).toBe(true);
    expect(fakeSupabase.log()).toEqual([TAKE]);
  });

  it("reports false for a nonce that is unknown, expired or already taken", async () => {
    fakeSupabase.respondByQuery({ [TAKE]: { data: [] } });
    expect(await takeNonce(NONCE, NOW)).toBe(false);
  });

  it("throws when the query fails", async () => {
    fakeSupabase.respondByQuery({ [TAKE]: { error: { message: "timeout" } } });
    await expect(takeNonce(NONCE, NOW)).rejects.toThrow("Failed to check the sign-in nonce: timeout");
  });
});
