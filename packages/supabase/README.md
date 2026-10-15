# Supabase (local Docker)

Local Supabase stack for tokenping, used by `packages/nextjs` (e.g. notification_configs).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm i -g supabase` or `brew install supabase/tap/supabase`

## Commands

Run from the **`packages`** directory (so that `./supabase` is this folder):

```bash
cd packages

# Start local Supabase (Docker)
supabase start

# Apply migrations (e.g. after adding new migration files)
supabase db reset

# Stop
supabase stop
```

From repo root you can use:

```bash
yarn supabase:start   # start
yarn supabase:stop    # stop
yarn supabase:reset   # db reset
```

## URLs after `supabase start`

- **API:** http://127.0.0.1:54321  
- **Studio:** http://127.0.0.1:54323  
- **DB (direct):** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`  
- **Inbucket (email):** http://127.0.0.1:54324  

`supabase status` prints the local anon key and service role key. Put the service role key in
`packages/nextjs/.env.local` as `SUPABASE_SERVICE_ROLE_KEY`: Telegram linking and the attribution answer need it locally
too, and production must set it.

## Migrations

- SQL files live in `packages/supabase/migrations/` with names like `YYYYMMDDHHMMSS_description.sql`.
- `notification_configs` is created by `20250225120000_create_notification_configs.sql` (per-wallet, per-chain notification settings for Aave health factor alerts).
- `user_attribution` is created by `20261015000000_create_user_attribution.sql`: the optional "How did you hear about Tokenping?" answer, one row per wallet, first answer kept. It is service-role only (like `telegram_link_tokens`) and nothing in the app reads it back; read answers in Studio. Without `SUPABASE_SERVICE_ROLE_KEY` on the Next.js server, `POST /api/attribution` answers 503.

## Optional seed data

Add `packages/supabase/seed.sql`; it runs after migrations on `supabase db reset`.
