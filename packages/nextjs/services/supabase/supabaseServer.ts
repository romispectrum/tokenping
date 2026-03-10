import { SupabaseClient, createClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

/**
 * Supabase client for server-side only (API routes, server components).
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY from env.
 * Do not use in client components.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) {
    return serverClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  serverClient = createClient(supabaseUrl, supabaseKey);
  return serverClient;
}
