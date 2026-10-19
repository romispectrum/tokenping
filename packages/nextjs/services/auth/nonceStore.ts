import { randomBytes } from "crypto";
import "server-only";
import { SIGN_IN_TTL_SECONDS } from "~~/services/auth/signInMessage";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

// Sign-in nonces, kept in auth_nonces (migration 20261022000000) so each one works once and only for a few minutes,
// on whichever serverless instance the verify request lands. Taking a nonce is one DELETE ... RETURNING, so two
// requests carrying the same signed message can never both sign in.

const TABLE = "auth_nonces";

/** 128 random bits as 32 hex characters: EIP-4361 asks for at least 8 alphanumeric characters. */
export const createNonce = () => randomBytes(16).toString("hex");

/** Stores a fresh nonce, and sweeps the expired ones so the table only ever holds a few minutes of sign-ins. */
export async function storeNonce(nonce: string, now = new Date()) {
  const client = getSupabaseServerClient();
  const [sweep, insert] = await Promise.all([
    client.from(TABLE).delete().lt("expires_at", now.toISOString()),
    client
      .from(TABLE)
      .insert({ nonce, expires_at: new Date(now.getTime() + SIGN_IN_TTL_SECONDS * 1000).toISOString() }),
  ]);
  // A failed sweep only leaves expired rows behind, which can never be taken.
  if (sweep.error) console.error("storeNonce: sweeping expired nonces failed", { message: sweep.error.message });
  return insert.error;
}

/** Deletes the nonce if it exists and has not expired; true when this call took it. Throws when the query fails. */
export async function takeNonce(nonce: string, now = new Date()): Promise<boolean> {
  const { data, error } = await getSupabaseServerClient()
    .from(TABLE)
    .delete()
    .eq("nonce", nonce)
    .gt("expires_at", now.toISOString())
    .select("nonce");
  if (error) throw new Error(`Failed to check the sign-in nonce: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}
