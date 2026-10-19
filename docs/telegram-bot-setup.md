# Telegram bot setup

End-to-end steps to enable the Telegram notification channel in Tokenping.

Unlike Signal (which requires a self-hosted [signal-cli-rest-api](./signal-server-fly.md)
container), Telegram works over the official Bot API: a plain HTTPS endpoint.
No extra infrastructure is needed. For why the bot links a username to a chat, see
[telegram-integration-strategy.md](./telegram-integration-strategy.md).

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
local `packages/nextjs/.env.local`:

| Variable                            | Value                                             |
| ----------------------------------- | ------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`                | From BotFather (step 1)                           |
| `TELEGRAM_WEBHOOK_SECRET`           | From step 2                                       |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Your bot's username, no `@` (e.g. `TokenpingBot`) |

`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is also the switch: the site offers Telegram in the alert form, and names it in
its copy, only while this variable is set. Redeploy after adding the vars, because `NEXT_PUBLIC_` values are read at
build time.

---

## 4. Apply the database migrations

Telegram needs `telegram_chats` and `notification_configs.telegram_username`, which come from
`packages/supabase/migrations/20261018000000_telegram_usernames.sql`. A new database gets there in order: the earlier
wallet-bound Telegram tables from `20260527000000_add_telegram_integration.sql` are created first and that migration
drops them. Apply every migration rather than a single file:

```bash
cd packages
supabase link --project-ref <ref>   # once
supabase db push
```

Like every table, `telegram_chats` is reachable only with the service-role key, so the deployment needs
`SUPABASE_SERVICE_ROLE_KEY` (local development against `supabase start` does without it). The list of migrations and the
deploy order are in [packages/supabase/README.md](../packages/supabase/README.md).

---

## 5. Register the webhook with Telegram

Once your app is deployed, run from the repo root:

```bash
yarn next:telegram-webhook
```

It reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` from the shell environment, `packages/nextjs/.env.local` or
`packages/nextjs/.env`, registers `https://tokenping.xyz/api/telegram/webhook` (or `NEXT_PUBLIC_SITE_URL` plus the
path) and prints `getWebhookInfo`. It never prints the token or the secret. `yarn next:telegram-webhook info` only
shows the current webhook; `yarn next:telegram-webhook set <url>` registers another URL, such as a tunnel to your
machine. The webhook receives `message` updates only, and registering it drops updates that were waiting.

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

1. Open Tokenping, edit an alert, tick **Telegram** and type your username (`@` optional). A username is 4 to 32 letters,
   digits and underscores, starts with a letter and does not end with an underscore.
2. The field says "Not linked yet: press Start in @YourBot once" with a link. Open it and press **Start**.
3. The bot replies "Linked @yourname", and within a few seconds the field turns to "linked". Save the alert.
4. Press **Send test** next to Telegram in the alert summary. It sends the alert as saved, with your current position,
   and is limited to one test per channel every 15 minutes.
5. To see a real alert, set the threshold above your current health factor and wait for the next 5-minute cron tick (or
   call `/api/cron/notifications` by hand with the `CRON_SECRET` as a bearer token).

The bot answers in Czech when the sender's Telegram app is set to Czech or Slovak, and in English otherwise. The
language of the alerts themselves is chosen per channel in the alert form.

---

## 7. Local development with a tunnel

The webhook needs a public HTTPS URL. For local dev, run the app and open a tunnel to it, for example with ngrok:

```bash
yarn start                       # Next.js on http://localhost:3000
ngrok http 3000                  # in another terminal
```

Register the webhook against the tunnel's URL:

```bash
yarn next:telegram-webhook set https://<your-tunnel-host>/api/telegram/webhook
```

Remember to run `yarn next:telegram-webhook` again to point back to your production URL when you're done.

> **Vercel preview deployments** get unique URLs that won't match the registered
> webhook. Test the link flow on `localhost` with a tunnel or against the prod bot only.
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
`bot_blocked` and `chat_not_found` errors; the user sends `/start` again to get alerts back.

**The test button says the username has not pressed Start**: the alert's username has no row in `telegram_chats` yet.
Press Start in the bot from that account, then try again.

**Group chats**: intentionally rejected in v1. The bot replies with a "DM me
directly" hint and ignores the message. If you need group support later, the
webhook in `packages/nextjs/app/api/telegram/webhook/route.ts` is the place to
relax the check (and re-think the unlink semantics).
