# Supabase

The database of Tokenping: Postgres on Supabase, used by `packages/nextjs` for alert settings, Morpho maturity
reminders, Telegram chats, test message limits, sign-in nonces and the optional attribution answer. This folder holds the migrations, the local stack's
config and an empty seed file.

## Local stack

Prerequisites: [Docker](https://docs.docker.com/get-docker/) and the
[Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase` or `brew install supabase/tap/supabase`).

Run the CLI from the **`packages`** directory, so that `./supabase` is this folder:

```bash
cd packages

supabase start      # start the local stack (Docker)
supabase db reset   # drop the local database and apply every migration, then seed.sql
supabase stop
```

From the repo root:

```bash
yarn supabase:start    # start
yarn supabase:reset    # db reset
yarn supabase:status   # URLs and keys
yarn supabase:stop     # stop
```

After `supabase start`:

- **API:** http://127.0.0.1:54321
- **Studio:** http://127.0.0.1:54323
- **DB (direct):** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Inbucket (email):** http://127.0.0.1:54324

`seed.sql` runs after the migrations on `supabase db reset`. It only holds comments, so add sample rows there if you
want them.

## How the app reaches it

The Next.js server uses the service-role key only: every table is closed to the `anon` and `authenticated` roles (row
level security on, no policies, privileges revoked), and nothing in the browser talks to Supabase. Against the local
stack the server needs no setting: with `SUPABASE_SERVICE_ROLE_KEY` empty and a local `SUPABASE_URL`, it uses the demo
service-role key that every `supabase start` accepts. A hosted project and every production deployment must set
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; without them the server refuses to connect, the routes that need the
database answer with a generic error (500, or 502 for the cron run) and the server log says what is missing.

## Tables

| Table                             | Holds                                                                                          | Changed by                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `notification_configs`            | One alert per wallet, chain and market: channels, threshold, recipients, language per channel  | `PUT` and `DELETE /api/notifications/config`              |
| `notification_maturity_reminders` | The reminders sent before a Morpho Midnight market matures, one per alert, kind and maturity   | The cron                                                  |
| `telegram_chats`                  | The chat each Telegram username opened by pressing Start in the bot                            | `POST /api/telegram/webhook`, and the cron on a dead chat |
| `notification_test_sends`         | The last test message per wallet and channel, for the one-per-15-minutes limit                 | `POST /api/notifications/test`                            |
| `auth_nonces`                     | Sign-in with Ethereum nonces, valid five minutes, deleted when used                            | `POST /api/auth/nonce` and `POST /api/auth/verify`        |
| `user_attribution`                | The optional "How did you hear about Tokenping?" answer, one row per wallet, first answer kept | `POST /api/attribution`                                   |

`claim_notification_test_send()` is the function behind the test limit: one statement that takes the slot, so two clicks
or two tabs can never both send. Nothing in the app reads `user_attribution` back; read the answers in Studio.

## Migrations

Files live in `packages/supabase/migrations/` and are named `YYYYMMDDHHMMSS_description.sql`. Supabase applies them in
file name order and tracks them by that version. Apply them to a hosted project from `packages`:

```bash
supabase link --project-ref <ref>   # once
supabase db push                    # applies every migration not applied yet
```

Every migration in order:

| Version          | File                                              | What it does                                                                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `20250225120000` | `create_notification_configs`                     | Creates `notification_configs` (per wallet and chain: enabled, services, threshold, email) with an `updated_at` trigger. Its open anon and authenticated policies are removed by `20261021000000`.                                                           |
| `20260415000000` | `add_signal_recipient_to_notification_configs`    | Adds `signal_recipient`: the Signal username, stored without `@`.                                                                                                                                                                                            |
| `20260527000000` | `add_telegram_integration`                        | The first Telegram design: `user_telegram_links` and `telegram_link_tokens`, bound to a wallet. `20261018000000` migrates and drops both.                                                                                                                    |
| `20261014000000` | `ensure_signal_recipient_on_notification_configs` | Repair: adds `signal_recipient` where an earlier version of `20260415000000` (which added a `phone` column) had already been applied. Does nothing elsewhere.                                                                                                |
| `20261015000000` | `create_user_attribution`                         | Creates `user_attribution`, service role only.                                                                                                                                                                                                               |
| `20261016000000` | `add_locale_to_notification_configs`              | Adds `locale` (`en` or `cs`, default `en`): the page language the alert was last saved from.                                                                                                                                                                 |
| `20261017000000` | `add_market_to_notification_configs`              | Adds `market`: `v3` (the chain's main V3 market) or the lowercased address of a V3 Pool or a V4 Spoke. Existing rows get `v3`. The unique key becomes `(user_id, chain_id, market)`.                                                                         |
| `20261018000000` | `telegram_usernames`                              | Creates `telegram_chats` and adds `notification_configs.telegram_username` (lowercased, no `@`). Copies links from the two older Telegram tables when they exist, then drops them.                                                                           |
| `20261019000000` | `notification_test_sends`                         | Creates `notification_test_sends` and `claim_notification_test_send()`.                                                                                                                                                                                      |
| `20261020000000` | `add_channel_locales_to_notification_configs`     | Adds `email_locale`, `signal_locale` and `telegram_locale` (`en`, `cs` or null). Null means the row's `locale`.                                                                                                                                              |
| `20261021000000` | `lock_down_server_only_tables`                    | Drops the "for local dev" policies of `notification_configs`, `telegram_chats` and `notification_test_sends`, revokes every privilege of `anon` and `authenticated` on them, and makes `claim_notification_test_send()` executable by the service role only. |
| `20261022000000` | `create_auth_nonces`                              | Creates `auth_nonces`, service role only.                                                                                                                                                                                                                    |
| `20261025000000` | `add_protocol_to_notification_configs`            | Adds `protocol` (`aave`, `morpho-blue` or `morpho-midnight`, default `aave`) and `market_params` (a Morpho market's fixed parameters, null for Aave), checks `market` per protocol, and creates `notification_maturity_reminders`, service role only.        |
| `20261026000000` | `allow_spanish_alert_locale`                      | Lets `locale`, `email_locale`, `signal_locale` and `telegram_locale` be `es` (Spanish) as well as `en` and `cs`.                                                                                                                                             |

Supabase runs each migration once. All but `20250225120000` and `20260527000000` are also safe to run again. Comments
inside the older migrations describe the app as it was when they were written (for example, before wallet sign-in
existed).

A table created in `public` gets Supabase's default grants to `anon` and `authenticated`, so a migration that adds one
must revoke them in the same file, as `user_attribution` and `auth_nonces` do.

## Deploy order

The order for a deployment is: **migrations first, then environment variables, then the Next.js deploy.**

1. Apply the migrations (`supabase db push`).
2. Set the environment variables in Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`,
   `CRON_SECRET` and the channels you use; the full list is in the [README](../../README.md#environment-variables)).
3. Deploy the app.

Why the code waits for the migration: the new columns and tables are read and written by the new code, so deploying it
first makes these fail.

| Migration        | What fails if the code is deployed without it                                              |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `20261015000000` | Saving the attribution answer.                                                             |
| `20261016000000` | Saving an alert and the cron run (the `locale` column).                                    |
| `20261017000000` | Every alert read, save and cron run (the `market` column).                                 |
| `20261018000000` | Saving an alert, the cron run and the bot's Start (`telegram_username`, `telegram_chats`). |
| `20261019000000` | The "Send test" buttons.                                                                   |
| `20261020000000` | Saving an alert and the cron run (the per-channel language columns).                       |
| `20261022000000` | Signing in, so nobody can open their alert settings.                                       |
| `20261025000000` | Every alert read, save and cron run, Aave included (the `protocol` column).                |
| `20261026000000` | Saving an alert from the Spanish pages, or a channel set to Spanish (the language checks). |

**Upgrading a live deployment.** One migration works the other way round. `20261021000000` closes the tables to the anon
key. Older versions of the app fell back to the anon key when `SUPABASE_SERVICE_ROLE_KEY` was not set, so before
applying it, check that `SUPABASE_SERVICE_ROLE_KEY` is set in the Vercel project and that the running deployment was
built with it. A server still on the anon key loses all database access the moment the migration is applied. The current
code never uses the anon key. `supabase db push` applies every pending migration at once, so on a deployment that has
not yet got `SUPABASE_SERVICE_ROLE_KEY`, set it and redeploy first.
