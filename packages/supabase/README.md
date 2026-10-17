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
- `notification_configs.locale` is added by `20261016000000_add_locale_to_notification_configs.sql`: the language the alert is sent in (`en` or `cs`, checked by a constraint), the site language the config was saved from. Existing rows get `en`. Apply it before deploying the Next.js code that writes `locale`, or config saves fail on the missing column.
- `notification_configs.market` is added by `20261017000000_add_market_to_notification_configs.sql`: which Aave market the alert is for: `v3` (the chain's main V3 market) or the lowercased address of a V3 Pool (Ethereum's Prime, EtherFi and Horizon) or an Aave V4 Spoke (checked by a constraint). Existing rows get `v3`, and the unique key becomes `(user_id, chain_id, market)`, so one chain can hold one alert per market. Apply it before deploying the Next.js code that filters and writes `market`, or every config read, save and cron run fails on the missing column.
- `telegram_chats` and `notification_configs.telegram_username` come from `20261018000000_telegram_usernames.sql`: an alert names a Telegram username (lowercased, no `@`), and `telegram_chats` maps a username to its chat once that account sends `/start` to the bot. It copies links from the earlier wallet-bound tables (`user_telegram_links`, `telegram_link_tokens`) when they exist, then drops them. Apply it before deploying the Next.js code that reads and writes `telegram_username`.
- `notification_test_sends` and `claim_notification_test_send()` come from `20261019000000_notification_test_sends.sql`: the last test message per wallet and channel, and the one statement that takes a test slot, so the "Send test" buttons allow one test per channel every 15 minutes even across tabs. `POST /api/notifications/test` claims first and deletes its row again when the send fails.
- `user_attribution` is created by `20261015000000_create_user_attribution.sql`: the optional "How did you hear about Tokenping?" answer, one row per wallet, first answer kept. It is service-role only and nothing in the app reads it back; read answers in Studio. Without `SUPABASE_SERVICE_ROLE_KEY` on the Next.js server, `POST /api/attribution` answers 503.

## Optional seed data

Add `packages/supabase/seed.sql`; it runs after migrations on `supabase db reset`.
