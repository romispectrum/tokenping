import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import "server-only";

// Defaults for `supabase start`. The key is the public supabase-demo service-role JWT, signed with the local stack's
// demo JWT secret, so it opens a local stack and nothing else.
const LOCAL_SUPABASE_URL = "http://localhost:54321";
const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

const isLocalUrl = (url: string) => {
  try {
    return LOCAL_HOSTNAMES.has(new URL(url).hostname);
  } catch {
    return false;
  }
};

/**
 * Every table is service-role only (RLS on, no policies, anon and authenticated revoked), so the anon key would be
 * refused everywhere. Without SUPABASE_SERVICE_ROLE_KEY only a local stack outside a production deployment gets the
 * demo key; anything else throws instead of connecting with a key that cannot work.
 */
const readConfig = () => {
  const isProductionDeployment = process.env.VERCEL_ENV === "production";
  if (isProductionDeployment && !process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not set. Set it in the Vercel project's production environment variables.");
  }

  const url = process.env.SUPABASE_URL || LOCAL_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key) return { url, key };
  if (isProductionDeployment || !isLocalUrl(url)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The server reaches Supabase only with the service-role key (the anon " +
        "key has no access to any table), so set it next to SUPABASE_URL: in the Vercel project's environment " +
        "variables, or in packages/nextjs/.env.local for a hosted project.",
    );
  }
  return { url, key: LOCAL_SUPABASE_SERVICE_ROLE_KEY };
};

let serverClient: SupabaseClient | null = null;

/** Lazily created singleton; throws (on every call, nothing is cached) while the configuration is incomplete. */
export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    const { url, key } = readConfig();
    serverClient = createClient(url, key);
  }
  return serverClient;
}
