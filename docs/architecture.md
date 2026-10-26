# Architecture

How the pieces of Tokenping fit together. Tokenping is one Next.js app on Vercel, a Supabase database, a payment
contract on Arbitrum One, and a small Signal relay on Fly.io. Alerts watch Aave V3 and V4 markets and Morpho Blue and
Midnight markets. There is no other backend: every server-side job is a Next.js route.

## The pieces

```
 Browser (wallet, dashboard, alert settings)
   |                |                              |
   | read           | /api/* with the              | approve USDC,
   | positions      | session cookie               | then pay
   | (RPC)          v                              v
   |        +-----------------------+      +--------------------------+
   |        | Next.js on Vercel     | read | TokenpingPaywall         |
   |        | /api/auth/*           | ---> | Arbitrum One, UUPS proxy |
   |        | /api/notifications/*  |      | isActive(wallet)         |
   |        | /api/telegram/*       |      +--------------------------+
   |        +----+-------------+----+
   |             |             ^
   |    service  |             | /api/cron/notifications
   |    role key |             | Authorization: Bearer CRON_SECRET
   |             v             |
   |        +-----------+   +--------------+
   |        | Supabase  |   | Vercel cron  |
   |        | Postgres  |   | every 5 min  |
   |        +-----------+   +--------------+
   |
   v                   The cron run reads Supabase and the chains, then sends:
 RPC providers
 (Aave, Morpho)        Resend ................ email
                       Signal relay on Fly.io  Signal
                       Telegram Bot API ...... Telegram

 Telegram --> POST /api/telegram/webhook --> Supabase (telegram_chats)

 Browser (/morpho) and PUT /api/notifications/config --> Morpho API (which listed markets; never the health factor)
```

| Piece            | Where it lives                        | What it does                                                                                                                                                                     |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser          | `packages/nextjs` (client components) | Connects the wallet (its SDKs start with the connect modal), reads Aave and Morpho positions and the paywall from RPC providers, pays, signs in, edits alerts.                   |
| Next.js routes   | `packages/nextjs/app/api`             | Sign-in, alert storage, test messages, the Telegram webhook and status check, the footer's ETH price (read server-side) and the cron.                                            |
| Supabase         | `packages/supabase`                   | Postgres with six tables: alerts, Morpho maturity reminders, Telegram chats, test-message slots, sign-in nonces and the optional attribution answer. Only the server reaches it. |
| Vercel cron      | `packages/nextjs/vercel.json`         | Calls the check route every 5 minutes.                                                                                                                                           |
| Resend           | external                              | Sends alert emails.                                                                                                                                                              |
| Signal relay     | `packages/tokenping-signal`           | `signal-cli-rest-api` behind a Caddy proxy that requires a bearer token. Sends Signal messages. See [signal-server-fly.md](signal-server-fly.md).                                |
| Telegram         | external                              | The Bot API sends messages; the webhook tells the app which chat belongs to which username. See [telegram-bot-setup.md](telegram-bot-setup.md).                                  |
| Paywall contract | `packages/hardhat`                    | `TokenpingPaywall` sells access for USDC and answers `isActive(wallet)`.                                                                                                         |
| RPC providers    | external                              | Answer every chain read, from the browser (dashboard) and from the server (alert checks, access checks, smart wallet sign-in).                                                   |
| Morpho API       | external (`api.morpho.org`)           | Says which listed Morpho markets a wallet borrows in (the /morpho dashboard) and whether a market is listed (saving a new Morpho alert). No SLA.                                 |

## Flows

**Looking at positions.** Needs no payment and no sign-in. The browser asks RPC providers for the wallet's Aave data in
every V3 market and V4 Spoke listed in `config/aaveConfig.ts`. Nothing is sent to the server or stored.

**Looking at Morpho positions.** The browser asks Morpho's API which listed Blue and
Midnight markets the wallet borrows in, then reads each market and position from the chain with the same readers the
cron uses (`services/morpho`), so the page shows the number alerts are checked against. Markets with a saved alert are
read too, even when the API no longer lists them.

**Connecting a wallet.** Injected wallets and Safe start on load. Every other wallet's SDK (WalletConnect, Base Account,
the MetaMask SDK) starts when the connect modal opens or when something asks it to connect, and on load only for the
wallet this browser connected last (`services/web3/deferWalletSdks.ts`). A visitor who never opens the modal sends those
services nothing. The footer's ETH price comes from `/api/eth-price`, which reads the chain on the server at most every
five minutes.

**Paying for access.** The browser approves exactly the price in USDC, then calls `pay` on the contract. Access runs
for the plan's duration and paying again extends it. The price and plan are read from the contract.

**Signing in.** The alert API only acts for a wallet that proved it holds the key.

1. `POST /api/auth/nonce` stores a random nonce in `auth_nonces` (valid five minutes) and sets it in an HttpOnly cookie.
2. The wallet signs a Sign-in with Ethereum (EIP-4361) message that carries the nonce.
3. `POST /api/auth/verify` checks the message is for this site and fresh, takes the nonce (it works once), checks the
   signature, and sets the session cookie: the wallet address and an expiry, signed with `SESSION_SECRET`, lasting 7
   days. An ordinary wallet's signature is recovered locally. A smart wallet's is checked on chain, only through the
   app's own RPC endpoint.
4. `POST /api/auth/logout` clears the cookie; the app calls it when the wallet disconnects.

**Saving an alert.** `PUT /api/notifications/config` takes the wallet from the session cookie, never from the request.
It checks the request came from the site's own pages and is JSON, validates the market, threshold, recipients and
languages, asks the contract whether the wallet has active access, enforces the limit of 50 alerts per wallet, and
writes the row to `notification_configs`. Reading alerts needs the session but not active access. A new Morpho alert
(`protocol` `morpho-blue` or `morpho-midnight`) also needs a market Morpho's API lists; its fixed
parameters (tokens, oracles, LLTVs, a Midnight maturity, a Blue market's pre-liquidation contracts) are read from the
chain and stored in `market_params`, and an API outage answers 503 rather than saving an unverified market. Editing or
deleting an existing Morpho alert never depends on the API.

**The 5-minute check.** Vercel calls `GET /api/cron/notifications` with `Authorization: Bearer <CRON_SECRET>`. The route
loads every enabled alert and every linked Telegram chat, then for each alert reads the wallet's health factor in the
alert's market (a V3 Pool or a V4 Spoke) over RPC. When the health factor is below the threshold it sends one message
on each selected channel, in that channel's language. A Telegram chat that has blocked the bot is deleted from
`telegram_chats`. The run does not look at paid access: a saved alert keeps firing after access lapses.

Morpho alerts are read first, from the chain only, with their stored market parameters: chains side by side, four
positions at a time on each, within 20 seconds per run. A Blue position, or a Midnight one before maturity, alerts
below its threshold, measured against a pre-liquidation line when the borrower opted into one. A Midnight loan also
gets a reminder in its last 7 days and in its last day, each claimed in `notification_maturity_reminders` before it is
sent (and given back when no channel took it), then an alert at every check after maturity while debt remains.

**Linking Telegram.** A bot cannot message someone who never wrote to it, so the person types their `@username` into the
alert and presses Start in the bot once. Telegram posts that update to `POST /api/telegram/webhook`, which checks the
secret header and stores the chat under the username Telegram reports for the sender. `GET /api/telegram/status` tells the
form whether a username has pressed Start.

**Sending a test.** The "Send test" button calls `POST /api/notifications/test`. The recipient always comes from the
saved alert. The route first claims the wallet's slot for that channel in the database
(`claim_notification_test_send`), which allows one test per channel every 15 minutes even across tabs, then sends the
alert as saved with the live position, and gives the slot back if the provider refuses the message.

## Where state lives

| State              | Where                             | Notes                                                                                                                                                                                 |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paid access        | The paywall contract              | Read with `isActive(wallet)` on every alert write; fails closed on any read error.                                                                                                    |
| Alerts             | `notification_configs`            | One row per wallet, chain and market. Each channel has its own language column, and `locale` is the fallback. `protocol` and, for Morpho, `market_params` say what the alert watches. |
| Maturity reminders | `notification_maturity_reminders` | One row per Morpho Midnight alert, reminder (7 days or 1 day) and maturity, so each goes out once.                                                                                    |
| Telegram links     | `telegram_chats`                  | Chat id and lowercase username, written by the webhook.                                                                                                                               |
| Test limit         | `notification_test_sends`         | Last test per wallet and channel.                                                                                                                                                     |
| Sign-in nonces     | `auth_nonces`                     | Deleted when used; expired ones are swept when a new one is issued.                                                                                                                   |
| Sessions           | A signed cookie                   | Nothing is stored on the server, so rotating `SESSION_SECRET` ends every session.                                                                                                     |
| Attribution answer | `user_attribution`                | The optional "How did you hear about Tokenping?" answer. Nothing in the app reads it back.                                                                                            |

## How the server is locked down

- Every table is reachable only with the Supabase service-role key. Row-level security is on with no policies, and the
  `anon` and `authenticated` roles have no privileges. In production the app refuses to reach the database without
  `SUPABASE_SERVICE_ROLE_KEY`.
- The alert routes act only for the signed-in wallet. The routes that change state (`PUT`, `POST`, `DELETE`) refuse
  cross-site requests and bodies that are not JSON.
- Error responses are generic. The reason (a database or provider message) goes to the server log only, and recipients
  are masked in what the cron returns.
- The cron answers 401 to every run when `CRON_SECRET` is not set, and `/api/send-email` answers 503. Vercel's own cron
  headers are never trusted.
- Production without `SESSION_SECRET` (32 characters or more) answers 503 on sign-in and on every alert route.
- A wallet can hold at most 50 alerts.
- `/api/send-email` is a server-to-server route behind the same bearer secret. Nothing in the app calls it.
- Every response carries `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a `Permissions-Policy` that turns off
  camera, microphone, geolocation and payment, and `Content-Security-Policy: frame-ancestors` naming only the site itself
  and Safe, so another site cannot frame the dashboard (`next.config.ts`; Vercel adds HSTS). `X-Frame-Options` is not used,
  because it cannot name Safe's origin and the "safe" wallet connector only works inside Safe's iframe. There is no full
  Content-Security-Policy yet: Next's inline scripts and the wallet SDKs' hosts would need a policy of their own.

## Where to look in the code

| Topic                        | Path                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| Routes                       | `packages/nextjs/app/api`                                         |
| Sign-in, sessions, nonces    | `packages/nextjs/services/auth`, `services/api/server/session.ts` |
| Alert storage and validation | `packages/nextjs/services/notifications`                          |
| The cron pass                | `packages/nextjs/services/notifications/runNotificationCheck.ts`  |
| Channel senders              | `services/email`, `services/signal`, `services/telegram`          |
| Aave markets and Spokes      | `packages/nextjs/config/aaveConfig.ts`                            |
| Morpho chains                | `packages/nextjs/config/morpho.ts`, `config/protocols.ts`         |
| Morpho readers and API       | `packages/nextjs/services/morpho`                                 |
| Morpho alerts in the cron    | `services/notifications/morphoAlerts.ts`, `morphoMessages.ts`     |
| RPC endpoints                | `packages/nextjs/utils/rpc.ts`                                    |
| Contract and deploy scripts  | `packages/hardhat`                                                |
| Migrations                   | `packages/supabase/migrations`                                    |
