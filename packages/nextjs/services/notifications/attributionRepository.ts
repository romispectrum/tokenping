import "server-only";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import { normalizeAddress } from "~~/utils/address";

/**
 * user_attribution is service-role only (RLS on, no policies, anon and authenticated revoked), but
 * getSupabaseServerClient falls back to the anon key when SUPABASE_SERVICE_ROLE_KEY is unset. Without it every insert
 * fails with "permission denied", so the route checks this first and logs the cause instead.
 */
export const canStoreAttribution = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Stores the wallet's attribution answer unless it already has one: the first answer is kept (INSERT ... ON CONFLICT
 * DO NOTHING), and callers cannot tell a stored answer from a dropped one. That protects answers already given from
 * being overwritten, but not a missing one from being pre-empted: see the accepted risk in the route.
 *
 * Deliberately write-only: nothing in the app reads user_attribution, so no API response can return an answer.
 * Returns the Supabase error, if any.
 */
export async function saveAttributionAnswer(userId: string, answer: string) {
  const { error } = await getSupabaseServerClient()
    .from("user_attribution")
    .upsert({ user_id: normalizeAddress(userId), answer }, { onConflict: "user_id", ignoreDuplicates: true });
  return error;
}
