-- Closes the server-only tables to the anon and authenticated roles. Their "for local dev" policies were applied in
-- production too, and the anon key is public by design, so anyone holding it could read and rewrite every alert
-- (wallets, email addresses, Signal and Telegram usernames), every Telegram chat id and every test-message slot
-- straight through PostgREST, past the API's paid-access check.
--
-- The Next.js server never needs those roles: it reaches Supabase only with the service-role key
-- (packages/nextjs/services/supabase/supabaseServer.ts), and the service role bypasses RLS. Locally it uses the demo
-- service-role key of `supabase start` when SUPABASE_SERVICE_ROLE_KEY is unset; in production it refuses to run
-- without SUPABASE_SERVICE_ROLE_KEY.
--
--   notification_configs, telegram_chats, notification_test_sends: the "Allow anon read/write for local dev" and
--       "Allow authenticated read/write" policies are dropped and every privilege of anon and authenticated is
--       revoked, as user_attribution already is. RLS stays enabled with no policies, so a later grant would still
--       expose no rows.
--   claim_notification_test_send(): executable by the service role only. Postgres grants EXECUTE on a new function
--       to PUBLIC, and 20261019000000 granted it to anon and authenticated, so the revoke names all three.
--
-- A new table in public gets Supabase's default grants to anon and authenticated: revoke them in its own migration.
-- Idempotent: the policies are dropped only if they exist, and revoking a privilege that is already gone does nothing.

alter table public.notification_configs enable row level security;
alter table public.telegram_chats enable row level security;
alter table public.notification_test_sends enable row level security;

drop policy if exists "Allow anon read/write for local dev" on public.notification_configs;
drop policy if exists "Allow authenticated read/write" on public.notification_configs;
drop policy if exists "Allow anon read/write for local dev" on public.telegram_chats;
drop policy if exists "Allow authenticated read/write" on public.telegram_chats;
drop policy if exists "Allow anon read/write for local dev" on public.notification_test_sends;
drop policy if exists "Allow authenticated read/write" on public.notification_test_sends;

revoke all on public.notification_configs from anon, authenticated;
revoke all on public.telegram_chats from anon, authenticated;
revoke all on public.notification_test_sends from anon, authenticated;

revoke execute on function public.claim_notification_test_send(text, text, integer) from anon, authenticated, public;
grant execute on function public.claim_notification_test_send(text, text, integer) to service_role;
