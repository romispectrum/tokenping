# Telegram design notes

Why Telegram works the way it does in Tokenping, and where each part lives. For the setup steps, see
[telegram-bot-setup.md](telegram-bot-setup.md).

## Why it is simpler than Signal

Signal has no official API, so Tokenping runs a stateful [signal-cli-rest-api relay on Fly.io](./signal-server-fly.md).
Telegram has an official [Bot API](https://core.telegram.org/bots/api): a plain HTTPS endpoint at
`https://api.telegram.org/bot<TOKEN>/sendMessage`. Every call stands on its own, which suits Vercel functions and the
cron. There is no phone number, daemon or volume. The app needs one bot token and one webhook secret.

## The one constraint

The Bot API cannot send to a `@username`. It needs a numeric chat id, and a bot learns a chat id only after that person
has written to the bot. Bots cannot message strangers. So unlike Signal, where the alert names a username and the relay
sends to it, Telegram needs a one-time handshake: the person presses Start in the bot.

## The design: a username, then Start once

An alert names a Telegram username, typed the way a Signal username is. The bot links the username to a chat when that
account sends `/start`.

1. The person types their `@name` into the alert and saves it. It is stored lowercased, without `@`, in
   `notification_configs.telegram_username`.
2. The form asks `GET /api/telegram/status?username=...` every 3 seconds, for up to 5 minutes, and shows "Not linked
   yet: press Start in @bot once" with a link to the bot.
3. The person presses Start. Telegram posts the update to `POST /api/telegram/webhook`.
4. The webhook checks the `X-Telegram-Bot-Api-Secret-Token` header with a timing-safe comparison, takes the username
   Telegram reports for the sender, and stores `(chat_id, username)` in `telegram_chats`. Other chats that held the
   username are dropped first, so a username points at one chat.
5. The bot replies "Linked @name", and the form turns to "linked".
6. From then on the cron (and the "Send test" button) look the username up in `telegram_chats` and send to the chat.

Commands: `/start` links, `/stop` forgets the chat (no alert reaches it until the next `/start`), `/help` explains.
Replies are in Czech for Czech and Slovak Telegram apps and in English otherwise.

An earlier version bound a chat to a wallet through a one-shot deep-link token (`user_telegram_links` and
`telegram_link_tokens`). `20261018000000_telegram_usernames.sql` replaced it: it carried the links with a username over
into `telegram_chats` and dropped the old tables.

## What follows from it

- The account needs a Telegram username. Without one, the bot says so and does not link.
- Only the account that owns a username can link it, because the chat is stored under the username Telegram reports for
  the sender, never one taken from the message text.
- A username change breaks the link until the person types the new name and sends `/start` again, which moves the chat.
- `GET /api/telegram/status` is public and answers yes or no, never a chat id. Anyone can ask whether a username has
  pressed Start in the bot.
- Several wallets' alerts can name the same username; they all reach the one chat.
- Private chats only. In a group the bot answers that it only supports private chats and ignores the message.

## Delivery

`services/telegram/sendTelegram.ts` sends plain text, with no `parse_mode`, so reserved characters can never abort a send.
It times out after 8 seconds, removes the bot token from any error text, and classifies Telegram's errors. When the bot
was blocked (`bot_blocked`) or the chat is gone (`chat_not_found`), the cron deletes that chat's `telegram_chats` row so it
stops failing on every run; the person gets alerts again by sending `/start`. A username with no linked chat is skipped
by the cron without an error.

## Where things live

| Part                         | Path                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Webhook route and commands   | `packages/nextjs/app/api/telegram/webhook/route.ts`, `bot.ts`                |
| Status route                 | `packages/nextjs/app/api/telegram/status/route.ts`                           |
| Chat lookups                 | `packages/nextjs/services/telegram/telegramChats.ts`                         |
| Sender                       | `packages/nextjs/services/telegram/sendTelegram.ts`                          |
| Bot replies (English, Czech) | `packages/nextjs/i18n/messages/telegram.ts`                                  |
| Alert form field             | `packages/nextjs/components/custom/notifications/TelegramUsernameField.tsx`  |
| Webhook registration script  | `packages/nextjs/scripts/telegram-webhook.sh` (`yarn next:telegram-webhook`) |
| Tables                       | `telegram_chats`, `notification_configs.telegram_username`                   |
