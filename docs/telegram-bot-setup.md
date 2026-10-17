# Telegram Bot Setup

End-to-end steps to enable the Telegram notification channel in Tokenping.

Unlike Signal (which requires a self-hosted [signal-cli-rest-api](./signal-server-fly.md)
container), Telegram works over the official Bot API: a plain HTTPS endpoint.
No extra infrastructure is needed.

---

## 1. Create the bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot`.
3. Pick a display name (e.g. `Tokenping`).
4. Pick a username ending in `bot` (e.g. `TokenpingBot`). This is the
   `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` you'll set below.
5. BotFather replies with a token like `1234567890:ABC-DEF1234ghIklmZ`. This is
   the `TELEGRAM_BOT_TOKEN`: treat it as a secret.

Optional polish (recommended):
- `/setdescription`: "Get Aave health-factor alerts from Tokenping."
- `/setuserpic`: upload a logo.
- `/setcommands`: paste:
  ```
  start - Link this chat to your Telegram username
  stop - Stop all Tokenping alerts in this chat
  help - Show usage
  ```

---

## 2. Pick a webhook secret

The webhook endpoint at `/api/telegram/webhook` only accepts requests carrying a
secret in the `X-Telegram-Bot-Api-Secret-Token` header. Generate one:

```bash
openssl rand -base64 32 | tr -d '+/=' | head -c 48
```

That's your `TELEGRAM_WEBHOOK_SECRET`. Telegram's rules: 1 to 256 chars from
`A-Za-z0-9_-`.

---

## 3. Set environment variables

Add to Vercel (Settings → Environment Variables, all environments) and to your
local `.env.local`:

| Variable | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | From BotFather (step 1) |
| `TELEGRAM_WEBHOOK_SECRET` | From step 2 |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Your bot's username, no `@` (e.g. `TokenpingBot`) |

Redeploy after adding the vars.

---

## 4. Apply the database migration

From `packages/`, link the hosted project once (`supabase link --project-ref <ref>`), then push every migration that
is not applied yet:

```bash
supabase db push
```

Or paste `packages/supabase/migrations/20260527000000_add_telegram_integration.sql` into the Supabase SQL editor.
Telegram needs two of them: `20260527000000_add_telegram_integration.sql` (the original tables) and
`20261018000000_telegram_usernames.sql`, which replaces them with `telegram_chats` (username to chat id) and adds
`notification_configs.telegram_username`. Neither needs `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Register the webhook with Telegram

Once your app is deployed, run from the repo root:

```bash
yarn next:telegram-webhook
```

It reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` from the shell environment, `packages/nextjs/.env.local` or
`packages/nextjs/.env`, registers `https://tokenping.xyz/api/telegram/webhook` (or `NEXT_PUBLIC_SITE_URL` plus the
path) and prints `getWebhookInfo`. It never prints the token or the secret. `yarn next:telegram-webhook info` only
shows the current webhook; `yarn next:telegram-webhook set <url>` registers another URL, such as an ngrok tunnel.

The same by hand:

```bash
TOKEN='<paste TELEGRAM_BOT_TOKEN>'
SECRET='<paste TELEGRAM_WEBHOOK_SECRET>'
URL='https://<your-deploy>.vercel.app/api/telegram/webhook'

curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -d "url=${URL}" \
  -d "secret_token=${SECRET}" \
  -d "allowed_updates=[\"message\"]" \
  -d "drop_pending_updates=true"
```

Verify:

```bash
curl "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"
# Should show your URL and "pending_update_count": 0
```

---

## 6. Smoke-test

How it works for a user: they type their Telegram username into the alert, like the Signal username, and press
**Start** in the bot once. A bot cannot message someone who never wrote to it, or look a person up by username, so
that one Start is unavoidable; after it, typing the name is all any later alert needs.

1. Open Tokenping, edit an alert, tick **Telegram** and type your username (`@` optional).
2. The field says "Not linked yet: press Start in @YourBot once" with a link. Open it and press **Start**.
3. The bot replies "Linked @yourname", and within a few seconds the field turns to "linked". Save the alert.
4. Force a notification by setting the threshold above your current health factor and waiting for the next
   5-minute cron tick (or trigger `/api/cron/notifications` manually with the `CRON_SECRET`).

---

## 7. Local development with ngrok

The webhook needs a public HTTPS URL. For local dev:

```bash
yarn start                       # Next.js on http://localhost:3000
ngrok http 3000                  # in another terminal
```

Re-register the webhook against the ngrok URL:

```bash
curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -d "url=https://<random>.ngrok-free.app/api/telegram/webhook" \
  -d "secret_token=${SECRET}"
```

Remember to re-point to your prod URL when you're done.

> **Vercel preview deployments** get unique URLs that won't match the registered
> webhook. Test the link flow on `localhost+ngrok` or against the prod bot only.
> For staging, create a second bot and use a per-environment `TELEGRAM_BOT_TOKEN`.

---

## Troubleshooting

**"Your Telegram account has no username yet"**: the bot links by username, so the account needs one (Telegram,
Settings, Username). Set it, type it into the alert, send `/start` again.

**The field still says "not linked" after Start**: the username typed into the alert must be the account's current
one. After a username change, type the new name and send `/start` again: the bot moves the chat to the new name.

**Nothing happens after pressing Start**: check
`curl "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"` for the
`last_error_message` field. Common causes: wrong URL, missing
`TELEGRAM_WEBHOOK_SECRET` on Vercel, server returning 5xx.

**Cron sends but Telegram doesn't deliver**: the user may have blocked the
bot. The cron self-heals by deleting the chat's `telegram_chats` row on the
`bot_blocked` error code; the user sends `/start` again to get alerts back.

**Group chats**: intentionally rejected in v1. The bot replies with a "DM me
directly" hint and ignores the message. If you need group support later, the
webhook in `packages/nextjs/app/api/telegram/webhook/route.ts` is the place to
relax the check (and re-think the unlink semantics).
