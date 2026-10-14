import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.hoisted(() => vi.fn((url: string, key: string) => ({ url, key })));

vi.mock("@supabase/supabase-js", () => ({ createClient }));

const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// The client is a module-level singleton, so every test loads a fresh copy of the module.
const loadClient = async () => {
  const { getSupabaseServerClient } = await import("~~/services/supabase/supabaseServer");
  return getSupabaseServerClient();
};

beforeEach(() => {
  vi.resetModules();
  createClient.mockClear();
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]) vi.stubEnv(name, undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSupabaseServerClient", () => {
  it("defaults to the local Supabase URL and demo anon key", async () => {
    expect(await loadClient()).toEqual({ url: "http://localhost:54321", key: LOCAL_ANON_KEY });
  });

  it("prefers the service role key over the anon key", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    expect(await loadClient()).toEqual({ url: "https://project.supabase.co", key: "service" });
  });

  it("falls back to the anon key, treating empty values as unset", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
    expect(await loadClient()).toEqual({ url: "http://localhost:54321", key: "anon" });
  });

  it("creates the client once and reuses it", async () => {
    const { getSupabaseServerClient } = await import("~~/services/supabase/supabaseServer");
    const first = getSupabaseServerClient();
    vi.stubEnv("SUPABASE_URL", "https://changed.supabase.co");
    expect(getSupabaseServerClient()).toBe(first);
    expect(createClient).toHaveBeenCalledOnce();
  });
});
