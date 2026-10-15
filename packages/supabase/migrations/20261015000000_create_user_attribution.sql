-- Self-reported attribution: the optional "How did you hear about Tokenping?" answer, one row per wallet.
-- Written only by POST /api/attribution (packages/nextjs/app/api/attribution/route.ts), which requires the same paid
-- access as config writes.
--
-- Design notes:
-- 1. The FIRST answer is kept. The API inserts with ON CONFLICT (user_id) DO NOTHING, so a later answer for the same
--    wallet (another browser, or a second prompt) is dropped, and the API answers the same either way. The first
--    answer is the one given closest to sign-up.
--    Accepted risk: the API has no wallet-ownership proof (no SIWE yet, same as config writes) and paying wallets are
--    public (PaymentReceived events), so anyone can submit an answer for any wallet with active access. First-wins
--    means a spoofed answer can never replace a real one, but it can pre-empt a wallet that has not answered yet.
--    Treat the answers as indicative marketing input; many rows with near-identical created_at point to bulk spoofing.
-- 2. Write-only from the app: no API route reads this table, and anon/authenticated get no access at all, so answers
--    are never returned by any unauthenticated request. Read them in Supabase Studio or the SQL editor, e.g.
--      select answer, created_at from public.user_attribution order by created_at desc;
--    The answer is free text on purpose: group it at read time (e.g. lower(answer) like '%reddit%'), do not constrain
--    the input.
-- 3. The table is service-role only (like telegram_link_tokens): the Next.js server must run with
--    SUPABASE_SERVICE_ROLE_KEY. Without it the API answers 503 and logs that the key is missing (the server client
--    would otherwise fall back to the anon key, which has no access to this table).

create table if not exists public.user_attribution (
  user_id     text primary key
              check (user_id ~ '^0x[0-9a-f]{40}$'),           -- normalized wallet address (lowercase)
  answer      text not null
              check (char_length(answer) between 1 and 500),  -- trimmed by the API; length in characters
  created_at  timestamptz not null default now()
);

comment on table public.user_attribution is
  'Optional self-reported "How did you hear about Tokenping?" answer per wallet. First answer kept; service role only; never returned by the API.';

----------------------------------------------------------------------
-- RLS: server-only table. RLS with no policies denies anon/authenticated; the revoke also drops the default grants
-- Supabase gives those roles on new public tables. The service role bypasses RLS.
----------------------------------------------------------------------
alter table public.user_attribution enable row level security;

revoke all on public.user_attribution from anon, authenticated;
