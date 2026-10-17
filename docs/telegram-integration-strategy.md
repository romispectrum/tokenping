# Telegram Integration Strategy

> **Superseded (October 2026).** The wallet-bound deep-link handshake described below was replaced: an alert now
> names a Telegram username, typed like the Signal username, and the bot links that username's chat when the
> account sends `/start`. See [telegram-bot-setup.md](telegram-bot-setup.md) and
> `packages/supabase/migrations/20261018000000_telegram_usernames.sql`. This page is kept for the reasoning.

Status: proposal, no code yet
Author: senior fullstack
Scope: add Telegram as a third notification channel alongside `email` and `signal`, triggered by the same Aave health-factor cron.

---

## 1. Why Telegram (and why it's easier than Signal)

Signal required us to self-host a stateful Java daemon ([signal-cli-rest-api on Fly.io](./signal-server-fly.md)) because Signal has no official API and Vercel functions can't keep long-lived state.

Telegram is the opposite:

- **Official [Bot API](https://core.telegram.org/bots/api)**: a plain HTTPS endpoint at `https://api.telegram.org/bot<TOKEN>/sendMessage`.
- **Stateless from our side**: each call is independent, perfect for Vercel serverless + cron.
- **No phone number, no daemon, no volume, no Fly.io, no `signal-cli`.**
- **Rate limits are generous**: ~30 msg/sec global, 1 msg/sec per chat. Plenty for our cron.
- **Rich formatting** (HTML / MarkdownV2), inline buttons, link previews: nicer UX than Signal.

Net effect: **no new infrastructure**. Only code + one bot token secret.

---

## 2. Key UX decision: chat_id vs username

This is the one non-obvious part. Everything else is trivial.

**Problem.** The Telegram Bot API cannot send a message using a `@username` on its own. It requires a numeric `chat_id`. A bot only learns a user's `chat_id` **after** that user has initiated a conversation with the bot (by sending `/start` or any message). Bots cannot DM strangers: anti-spam by design.

**This means:** unlike Signal (where the user types their username into our UI and we send to it directly), Telegram requires a **one-time handshake** where the user opens our bot and presses Start. Only then can we store their `chat_id` and send notifications.

### Three ways to do the handshake (picking one)

| Option | Flow | Pros | Cons |
|---|---|---|---|
| **A. Deep-link with signed token** ✅ recommended | User clicks "Connect Telegram" in our UI → opens `https://t.me/TokenpingBot?start=<token>` → bot receives `/start <token>`, we map token → user wallet, store `chat_id`. | Zero typing, zero confusion, secure, no webhook polling loops. Best UX. | Requires a webhook endpoint in Next.js to receive bot updates. |
| **B. User pastes username, we resolve on first send** | User types `@alice`, we call `getChat` → only works if they already messaged the bot. | Mirrors Signal UX. | Fragile: most users haven't messaged the bot yet; `getChat` fails for them with a confusing error. |
| **C. User manually pastes their `chat_id`** | User DMs bot, bot replies with their numeric id, user pastes it in our UI. | Simplest to implement. | Ugly UX: numeric ids, copy/paste, easy to mistype. |

**Recommendation: Option A (deep link + webhook).** Same effort as B/C once written, dramatically better UX, and the webhook also lets us handle `/stop` (unsubscribe), `/help`, etc.

---

## 3. Architecture

```
┌─────────────────┐        click "Connect Telegram"
│  Next.js UI     │ ─────────────────────────────────┐
│  (NotifConfig)  │                                  │
└─────────────────┘                                  ▼
        │                              https://t.me/TokenpingBot?start=<token>
        │                                            │
        │ save config                                ▼
        ▼                                    ┌───────────────┐
┌─────────────────┐                          │   Telegram    │
│    Supabase     │                          │   (user taps  │
│ notification_   │                          │    Start)     │
│   configs       │                          └───────┬───────┘
│ +telegram_chat_ │                                  │
│  id column      │                                  ▼ webhook POST
└─────────────────┘                       ┌────────────────────────┐
        ▲                                 │  /api/telegram/webhook │
        │ update chat_id                  │  (Next.js route)       │
        └─────────────────────────────────┤  - verify secret       │
                                          │  - match start-token   │
                                          │  - store chat_id       │
                                          └────────────────────────┘

┌────────────────────────────────┐
│  Vercel cron every 5 min       │   (already exists)
│  runNotificationCheck()        │
│    for each config w/ telegram │
│      sendTelegramMessage()     │──► https://api.telegram.org/bot<TOKEN>/sendMessage
└────────────────────────────────┘
```

**No new servers.** Everything runs on Vercel and Supabase we already have.

---

## 4. Concrete implementation plan

### 4.1 Telegram side (one-time manual setup)

1. Open [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → pick name + username (e.g. `TokenpingBot`).
2. BotFather returns a **bot token** (`123456:ABC-DEF...`). Store as `TELEGRAM_BOT_TOKEN` in Vercel env vars (all environments).
3. Generate a random secret, store as `TELEGRAM_WEBHOOK_SECRET` in Vercel.
4. After first deploy, register the webhook once:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://tokenping.vercel.app/api/telegram/webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```
5. Optional polish via BotFather: `/setdescription`, `/setuserpic`, `/setcommands` with `start`, `stop`, `help`.

### 4.2 Database (Supabase migration)

New file: `packages/supabase/migrations/<ts>_add_telegram_to_notification_configs.sql`

```sql
alter table public.notification_configs
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_username text;

-- short-lived tokens emitted when the user clicks "Connect Telegram"
create table if not exists public.telegram_link_tokens (
  token        text primary key,
  user_id      text not null,          -- wallet address, matches notification_configs.user_id
  chain_id     integer not null,
  created_at   timestamptz not null default now(),
  consumed_at  timestamptz
);

create index if not exists telegram_link_tokens_user_idx
  on public.telegram_link_tokens(user_id);
```

- `telegram_chat_id`: numeric id as text (can be >2^53, so don't use bigint in JS safely).
- `telegram_username`: cosmetic, shown in the UI as `@alice`.
- `telegram_link_tokens`: one-shot tokens, valid ~10 min, consumed on webhook.

### 4.3 Types & constants

`packages/nextjs/types/notifications.ts`:

```ts
export type NotificationService = "email" | "signal" | "telegram";

export interface NotificationConfig {
  // ...existing fields
  telegramChatId?: string;
  telegramUsername?: string;
}
```

`packages/nextjs/constants/notifications.ts`:

```ts
export const AVAILABLE_SERVICES = [
  { id: "email", name: "Email", icon: "📧" },
  { id: "signal", name: "Signal", icon: "🔒" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
];
```

### 4.4 New service: `packages/nextjs/services/telegram/sendTelegram.ts`

Mirrors the shape of `sendSignal.ts`:

```ts
export interface SendTelegramOptions { chatId: string; message: string; }

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function sendTelegramMessage(
  { chatId, message }: SendTelegramOptions,
): Promise<{ success: true } | { success: false; error: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, error: "TELEGRAM_BOT_TOKEN missing" };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",              // HTML is safer than MarkdownV2 (less escaping)
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { success: false, error: `Telegram API ${res.status}: ${body}` };
  }
  const json = await res.json();
  if (!json.ok) return { success: false, error: json.description ?? "unknown" };
  return { success: true };
}
```

**Error handling to watch:**
- `403 Forbidden: bot was blocked by the user` → user blocked the bot. We should null out their `telegram_chat_id` so future cron runs don't keep erroring.
- `400 chat not found` → `chat_id` stale, same handling.
- `429 Too Many Requests` → respect `retry_after` field in response; with our 5-min cron this is basically unreachable.

### 4.5 New webhook route: `packages/nextjs/app/api/telegram/webhook/route.ts`

```ts
export async function POST(req: Request) {
  // Telegram sends our secret in X-Telegram-Bot-Api-Secret-Token
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  const update = await req.json();
  const msg = update.message;
  if (!msg?.text) return Response.json({ ok: true });

  const chatId = String(msg.chat.id);
  const username = msg.from?.username as string | undefined;
  const text: string = msg.text;

  if (text.startsWith("/start")) {
    const token = text.split(" ")[1]?.trim();
    if (token) {
      // look up unconsumed token, attach chat_id to that user's notification_config
      // reply to user: "✅ Connected. You'll get Aave alerts here."
    } else {
      // no token: reply "Open Tokenping → Notifications → Connect Telegram to link."
    }
  } else if (text.startsWith("/stop")) {
    // null out telegram_chat_id for this chat_id across all configs, confirm.
  }

  return Response.json({ ok: true });
}
```

**Security:**
- The secret header is Telegram's built-in auth for webhooks: always verify.
- The start-token lookup must be: single-use (`consumed_at` = now), time-limited (reject > 10 min old), and scoped to a specific user_id/chain_id.

### 4.6 "Connect Telegram" UI (`NotificationConfig.tsx`)

When the user selects the Telegram service in the edit panel:

1. Show button: **"Connect Telegram"**.
2. Click → POST to a new `/api/telegram/link-token` route (auth'd by wallet signature or existing session) → returns `{ token, botUsername }`.
3. Open `https://t.me/${botUsername}?start=${token}` in a new tab.
4. Poll the config (or use Supabase realtime) for `telegramChatId`: once set, flip the UI to "Connected as @username" with a Disconnect button.
5. Disconnect = clear `telegram_chat_id` locally and (optionally) send `/stop` via the bot.

This is the only UI change that differs meaningfully from the Signal/email flows.

### 4.7 Cron dispatch (`runNotificationCheck.ts`)

Append a third block after the existing Signal block:

```ts
if (services.includes("telegram") && config.telegram_chat_id) {
  const r = await sendTelegramMessage({
    chatId: config.telegram_chat_id,
    message: alertHtml,     // reuse the HTML version for nicer formatting
  });
  if (r.success) telegramSent++;
  else {
    errors.push(`telegram:${config.telegram_chat_id}: ${r.error}`);
    // if r.error matches "bot was blocked" or "chat not found", null out chat_id here
  }
}
```

Extend `NotificationCheckResult` with `telegramSent: number`.

### 4.8 Env vars to add

| Variable | Where | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Vercel (all envs) | Auth Bot API calls |
| `TELEGRAM_WEBHOOK_SECRET` | Vercel (all envs) | Verify incoming webhook POSTs |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Vercel (all envs) | Used by UI to build `t.me/<bot>?start=<token>` link |

Also update `packages/nextjs/.env.example`.

---

## 5. Testing strategy

- **Local:** `ngrok http 3000` → point webhook at the ngrok URL → run through `/start <token>` by hand on a real Telegram account.
- **Unit:** `sendTelegramMessage` with `fetch` mocked (mirror the Signal tests if any).
- **Integration:** small seed script that inserts a notification_config with a known chat_id and calls `runNotificationCheck()` locally.
- **Prod smoke:** after deploy, manually POST to `/api/cron/notifications` (or wait 5 min) and confirm the test wallet receives a message.

---

## 6. Rollout & backward compatibility

1. Land the Supabase migration first: nullable columns, no breaking changes.
2. Ship types + service + webhook + UI behind nothing (no feature flag needed: it's additive; users opt in by selecting the service).
3. Register the webhook via `setWebhook` once after the first prod deploy.
4. Announce on the landing page / README.

Existing email + Signal users are untouched.

---

## 7. Risks & open questions

- **User blocks the bot** → we keep erroring every 5 min. Mitigation: detect `403 bot was blocked` and null the `chat_id`. Low effort, should be in v1.
- **Group chats.** If a user adds the bot to a group, `chat.id` is negative. Decide: do we allow group delivery (useful for trading-desk teams) or reject non-private chats in the webhook? **Recommend allowing it**: costs nothing and is a nice power-user feature.
- **Token lifetime.** 10 min is a guess. Shorter = safer, longer = fewer "token expired" annoyances. 10 min is a reasonable default.
- **Privacy.** `telegram_username` is cosmetic only; truth source is `telegram_chat_id`. Users can change their Telegram username any time and delivery keeps working.
- **MarkdownV2 vs HTML.** HTML is strictly easier (fewer reserved characters to escape). Stick with HTML for the alert body; reuse the email HTML template.
- **Multiple wallets → one Telegram account.** Our schema already scopes configs per `(user_id, chain_id)`, so one Telegram chat can be linked to multiple wallet rows. Fine, no change needed.

---

## 8. Effort estimate

| Task | Size |
|---|---|
| Supabase migration + types + constants | S (30 min) |
| `sendTelegram.ts` service | S (30 min) |
| Webhook route + link-token route | M (2 to 3 h) |
| UI in `NotificationConfig.tsx` | M (2 to 3 h) |
| Wire into `runNotificationCheck.ts` | S (30 min) |
| BotFather setup + webhook registration + env vars | S (30 min) |
| Testing (ngrok + prod smoke) | M (1 to 2 h) |

**Total: ~1 focused day of work.** Much smaller than Signal, which needed a whole Fly.io deploy guide.

---

## 9. Summary for reviewers

- **No new infrastructure**: Bot API is a plain HTTPS endpoint, unlike Signal.
- **One UX wrinkle**: bots can't DM strangers, so users must click a deep link and press Start once. Handled via a signed one-shot token + webhook.
- **Shape mirrors the Signal integration**: same file layout (`services/telegram/sendTelegram.ts`), same cron integration point, same config shape. Easy to review against the existing Signal PR.
- **~1 day of work**, additive, behind no feature flag.
