import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.hoisted(() => vi.fn((url: string, key: string) => ({ url, key })));

vi.mock("@supabase/supabase-js", () => ({ createClient }));

const LOCAL_URL = "http://localhost:54321";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const MISSING_KEY = /^SUPABASE_SERVICE_ROLE_KEY is not set\./;

// The client is a module-level singleton, so every test loads a fresh copy of the module.
const loadModule = () => import("~~/services/supabase/supabaseServer");
const loadClient = async () => (await loadModule()).getSupabaseServerClient();

beforeEach(() => {
  vi.resetModules();
  createClient.mockClear();
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "VERCEL_ENV"]) {
    vi.stubEnv(name, undefined);
  }
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseServerClient", () => {
  it("defaults to the local Supabase URL and its demo service-role key", async () => {
    expect(await loadClient()).toEqual({ url: LOCAL_URL, key: LOCAL_SERVICE_ROLE_KEY });
  });

  it("uses the service role key", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    expect(await loadClient()).toEqual({ url: "https://project.supabase.co", key: "service" });
  });

  it("never uses the anon key, which has no access to any table", async () => {
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    expect(await loadClient()).toEqual({ url: LOCAL_URL, key: LOCAL_SERVICE_ROLE_KEY });
  });

  it.each([
    ["an empty URL", ""],
    ["127.0.0.1", "http://127.0.0.1:54321"],
    ["::1", "http://[::1]:54321"],
    ["localhost on another port", "http://localhost:8000"],
  ])("gives a local stack at %s the demo key, treating empty values as unset", async (_label, url) => {
    vi.stubEnv("SUPABASE_URL", url);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(await loadClient()).toEqual({ url: url || LOCAL_URL, key: LOCAL_SERVICE_ROLE_KEY });
  });

  it("gives a local production build (next start against supabase start) the demo key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await loadClient()).toEqual({ url: LOCAL_URL, key: LOCAL_SERVICE_ROLE_KEY });
  });

  it.each([
    ["a hosted project in development", "development", undefined, "https://project.supabase.co"],
    ["a hosted project in a production build", "production", undefined, "https://project.supabase.co"],
    ["a Vercel preview", "production", "preview", "https://project.supabase.co"],
    ["a Vercel production deployment", "production", "production", "https://project.supabase.co"],
    ["a Vercel production deployment on a local URL", "production", "production", LOCAL_URL],
    ["a URL that does not parse", "development", undefined, "not a url"],
  ])("throws without the service role key for %s", async (_label, nodeEnv, vercelEnv, url) => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    vi.stubEnv("VERCEL_ENV", vercelEnv);
    vi.stubEnv("SUPABASE_URL", url);
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    await expect(loadClient()).rejects.toThrow(MISSING_KEY);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("throws in a Vercel production deployment without SUPABASE_URL, even with the key", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    await expect(loadClient()).rejects.toThrow(/^SUPABASE_URL is not set\./);
  });

  it("keeps throwing until the configuration is complete, then creates the client", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    const { getSupabaseServerClient } = await loadModule();
    expect(() => getSupabaseServerClient()).toThrow(MISSING_KEY);
    expect(() => getSupabaseServerClient()).toThrow(MISSING_KEY);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    expect(getSupabaseServerClient()).toEqual({ url: "https://project.supabase.co", key: "service" });
  });

  it("creates the client once and reuses it", async () => {
    const { getSupabaseServerClient } = await loadModule();
    const first = getSupabaseServerClient();
    vi.stubEnv("SUPABASE_URL", "https://changed.supabase.co");
    expect(getSupabaseServerClient()).toBe(first);
    expect(createClient).toHaveBeenCalledOnce();
  });
});
