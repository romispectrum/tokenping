# Telegram Bot Setup

End-to-end steps to enable the Telegram notification channel in Tokenping.

Unlike Signal (which requires a self-hosted [signal-cli-rest-api](./signal-server-fly.md)
container), Telegram works over the official Bot API — a plain HTTPS endpoint.
No extra infrastructure is needed.

---

## 1. Create the bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot`.
3. Pick a display name (e.g. `Tokenping`).
4. Pick a username ending in `bot` (e.g. `TokenpingBot`). This is the
   `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` you'll set below.
5. BotFather replies with a token like `1234567890:ABC-DEF1234ghIklmZ`. This is
   the `TELEGRAM_BOT_TOKEN` — treat it as a secret.

Optional polish (recommended):
- `/setdescription` — "Get Aave health-factor alerts from Tokenping."
- `/setuserpic` — upload a logo.
- `/setcommands` — paste:
  ```
  start - Link this chat to your wallet (use the Tokenping app)
  stop - Unsubscribe from alerts
  help - Show usage
  ```

---

## 2. Pick a webhook secret

The webhook endpoint at `/api/telegram/webhook` only accepts requests carrying a
secret in the `X-Telegram-Bot-Api-Secret-Token` header. Generate one:

```bash
openssl rand -base64 32 | tr -d '+/=' | head -c 48
```

That's your `TELEGRAM_WEBHOOK_SECRET`. Telegram's rules: 1–256 chars from
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

```bash
yarn workspace @se-2/supabase migrate   # or however migrations are applied
```

This creates `user_telegram_links` and `telegram_link_tokens`.

---

## 5. Register the webhook with Telegram

Once your app is deployed (or running on a public URL via ngrok for local dev):

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

1. Open Tokenping → Notification Settings → tick **Telegram** → press
   **Connect Telegram**.
2. Telegram opens to your bot. Press **Start**.
3. Within a couple of seconds the UI shows "✅ Connected as @yourhandle".
4. Force a notification by lowering the Health Factor threshold above your
   current HF and waiting for the next 5-minute cron tick (or trigger
   `/api/cron/notifications` manually with the `CRON_SECRET`).

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

**"This link has expired or was already used"** — tokens are valid for 10
minutes and single-use. Generate a new one from the app.

**Nothing happens after pressing Start** — check
`curl "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"` for the
`last_error_message` field. Common causes: wrong URL, missing
`TELEGRAM_WEBHOOK_SECRET` on Vercel, server returning 5xx.

**Cron sends but Telegram doesn't deliver** — the user may have blocked the
bot. The cron self-heals by deleting the `user_telegram_links` row on the
`bot_blocked` error code; the user can simply re-link.

**Group chats** — intentionally rejected in v1. The bot replies with a "DM me
directly" hint and ignores the message. If you need group support later, the
webhook in `packages/nextjs/app/api/telegram/webhook/route.ts` is the place to
relax the check (and re-think the unlink semantics).
