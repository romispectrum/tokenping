import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import "server-only";

// Defaults for `supabase start`; the key is the public supabase-demo anon JWT, not a secret.
const LOCAL_SUPABASE_URL = "http://localhost:54321";
const LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

let serverClient: SupabaseClient | null = null;

/**
 * Lazily created singleton. Prefers the service role key: the Telegram token table is not readable or writable
 * with the anon key.
 */
export function getSupabaseServerClient(): SupabaseClient {
  serverClient ??= createClient(
    process.env.SUPABASE_URL || LOCAL_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || LOCAL_SUPABASE_ANON_KEY,
  );
  return serverClient;
}
