# Data snapshot: liquidation-alert-telegram

Every tool fact in `content/blog/liquidation-alert-telegram.mdx`, checked on 2026-11-08 against the tool's own pages. Third-party handles of individuals are deliberately not named in the guide. The research notes, with the source URL after each fact, follow.

Researched 8 Nov 2026. Every web source below was opened on 8 Nov 2026 (written "fetched 8 Nov 2026"). Facts from the
19 Oct 2026 table were re-checked on their source today; anything not re-checked is left out or marked
**unconfirmed**. Vendor claims are the vendor's own words, not tested. No bot was started, no account created, nothing
signed or submitted.

Note on naming: the repo memory says repository files may only reference romi / romispectrum. The third-party tools and
GitHub accounts below are named for research only; check with the user before a published guide names or links them.

---

## 1. Tools that alert on your own lending position on Telegram

### Otomato

- Status: live. Site lists "Get the app" (App Store, Google Play) and "Or try on Telegram", linking to the bot
  `t.me/otomatobot` with a `?start=` deep-link parameter. Source: https://otomato.xyz/protocols/aave (fetched 8 Nov 2026,
  via browser; WebFetch gets HTTP 403)
- Protocols and networks: Aave V3 on Ethereum, Arbitrum, Base, Polygon, Avalanche and Monad. Source:
  https://otomato.xyz/protocols/aave (fetched 8 Nov 2026). Morpho Blue and MetaMorpho vaults on Ethereum, Arbitrum,
  Base, HyperEVM and Monad. Source: https://otomato.xyz/protocols/morpho (fetched 8 Nov 2026). The App Store listing also
  names Euler. Source: https://apps.apple.com/us/app/otomato-wallet-tracker/id6759802179 (fetched 8 Nov 2026)
- Alerts: health factor below a safety threshold, distance to liquidation in dollars, borrow rate spikes, depegs,
  governance and cap changes. Default health factor alert at 1.2, changeable per position "from the Alert Configuration
  screen in the app". Source: https://otomato.xyz/protocols/aave (FAQ, fetched 8 Nov 2026)
- What it needs: a pasted wallet address only. FAQ: "We never request signatures, we cannot move your funds". Source:
  https://otomato.xyz/protocols/aave (fetched 8 Nov 2026)
- How Telegram is linked: the site links to the bot with a start parameter; the exact steps inside the bot are
  **unconfirmed** (not started, per the rules).
- Check interval: not stated. Positions "are picked up automatically the next time the position state changes". Source:
  https://otomato.xyz/protocols/aave (fetched 8 Nov 2026)
- Cost: "Core monitoring for Aave, including health factor, liquidation risk, and rate alerts, is free"; premium
  features planned for multi-wallet portfolios beyond the free limit and "overnight phone-call escalations". Source:
  https://otomato.xyz/protocols/aave (fetched 8 Nov 2026). The iOS app is free with in-app purchases Otomato Pro $9.00
  and Otomato Pro+ $29.00 (what they include, and the billing period, **unconfirmed**). iOS version 1.0.24, dated Sep 25.
  Source: https://apps.apple.com/us/app/otomato-wallet-tracker/id6759802179 (fetched 8 Nov 2026)
- Limits: free limit on wallets mentioned but not quantified (**unconfirmed**).

### HF Guard

- Status: beta, "best-effort monitoring, alerts may be delayed". Free during beta. Source: https://hfguard.app (fetched
  8 Nov 2026)
- Protocols: Aave V3, Aave V4, Compound V3, Morpho Blue, Fluid Multiply, Euler V2, Jupiter Lend, Kamino Lend. Networks:
  Aave V3 on 23 networks, Aave V4 on Ethereum, Avalanche and Arc, Morpho Blue on 6, Solana for Jupiter and Kamino. Source:
  https://hfguard.app (fetched 8 Nov 2026)
- How Telegram is linked: Telegram bot `t.me/hfguard_bot` (linked with `start=landing`); the web dashboard is the main
  console. No wallet connection: the FAQ answers "Do I need to connect my wallet?" with "No"; a public address is enough.
  Source: https://hfguard.app (fetched 8 Nov 2026)
- Alerts: when a position changes risk level, and optionally when the health factor crosses levels such as 2.0, 1.9,
  1.8, 1.7 and 1.6. Source: https://hfguard.app (fetched 8 Nov 2026)
- Check interval: "checked periodically", no number. Source: https://hfguard.app (fetched 8 Nov 2026)
- Data held: the privacy policy lists "your Telegram user ID" and wallet addresses you add; kept "as long as you use HF
  Guard"; deletion with the bot's `/delete` command or by email. Source: https://hfguard.app/privacy (fetched 8 Nov 2026)
- Limits: terms say "All alerts are informational only", service "as is", no liability for missed alerts. Source:
  https://hfguard.app/terms (fetched 8 Nov 2026)

### DeFi Saver Notify (yes, it uses Telegram)

- Status: live. Notify alerts when a position's ratio drops below or rises above a level you set, and on automation
  runs. Protocols named: Aave, Liquity, Maker, Compound; works for smart wallet and plain account positions. Networks:
  Ethereum, Arbitrum, Base, Optimism. Source: https://help.defisaver.com/features/notify (fetched 8 Nov 2026)
- Channels: in-app, Telegram, Email, Blockscan chat, chosen under "Manage channels". Source:
  https://help.defisaver.com/features/notify/how-do-i-set-up-notify (fetched 8 Nov 2026)
- How Telegram is linked: the bot `t.me/DeFiSaverBot` gives you a code; you connect your wallet on DeFi Saver, open the
  position, click Notify, "authenticate", choose Manage Channels, enable Telegram and enter the code. The bot then shows
  your positions and lets you add monitors. Source:
  https://help.defisaver.com/features/notify/telegram-bot-for-monitoring-your-position (fetched 8 Nov 2026)
- What it needs: a connected wallet on the DeFi Saver app and an authentication step (whether it is a signature is
  **unconfirmed**; the page only says "authenticate").
- Check interval and cost: not stated on these pages (**unconfirmed**).
- Morpho: not named on the Notify page (**unconfirmed** whether Notify covers Morpho).

### Ava (Ava Protocol)

- Status: live. "Try in Telegram" opens `AvaProtocolBot`; Ava watches the Aave health factor and alerts when liquidation
  risk rises. Source: https://avaprotocol.org/protect/aave-position (fetched 8 Nov 2026)
- Networks: Aave V3 on Ethereum and Base; Arbitrum and Optimism on the roadmap. Source:
  https://avaprotocol.org/docs/start-here/supported-chains (fetched 8 Nov 2026)
- Channels: Email, Discord, Telegram, Slack, each switchable on the Settings page; Telegram `/alerts` settings are
  "coming soon". Source: https://avaprotocol.org/docs/using-ava/risk-alerts (fetched 8 Nov 2026)
- How Telegram is linked: `/start` "sets up Ava and scans your wallet"; whether you paste an address or connect and sign
  is not stated (**unconfirmed**). `/alerts`, `/watch` and `/unwatch` are listed as coming. Source:
  https://avaprotocol.org/docs/using-ava/telegram-commands (fetched 8 Nov 2026)
- What it needs: monitor-only mode needs "no signing, no permissions". Source:
  https://avaprotocol.org/docs/use-cases/watch-aave-positions (fetched 8 Nov 2026). Auto mode needs a funded Ava smart
  wallet and a signed permission that expires after 365 days. Source: https://avaprotocol.org/protect/aave-position
  (fetched 8 Nov 2026)
- Check interval: Auto mode "checks hourly"; read-only monitoring interval not stated. Source:
  https://avaprotocol.org/docs/using-ava/risk-alerts (fetched 8 Nov 2026)
- Cost: "Ava is free today"; usage-based pricing and a fee on value-creating actions are being explored. Source:
  https://avaprotocol.org/docs/start-here/pricing (fetched 8 Nov 2026)

### DeFi Monitor (DeFi Risk Monitor)

- Status: beta. Protocols: Aave V3, Spark, Morpho Blue, Compound V3, Uniswap V3 LP, on Ethereum, Arbitrum and Base.
  Source: https://defi-monitor.com (fetched 8 Nov 2026, via browser)
- Channels: Telegram (bot `t.me/defi_risk_monitor_bot`) and Discord webhooks. Source: https://defi-monitor.com and
  https://defi-monitor.com/changelog (13 Feb 2026 entry) (fetched 8 Nov 2026)
- How Telegram is linked: "Sign up and link Telegram or Discord"; getting started is "Sign in with email, add your
  wallet address, choose a protocol". The exact link step is **unconfirmed**. Source: https://defi-monitor.com (fetched
  8 Nov 2026)
- What it needs: an email account and a wallet address; "never ask for private keys or signing rights". Source:
  https://defi-monitor.com (FAQ, fetched 8 Nov 2026)
- Check interval: "Checks run continuously", no number; since 20 Feb 2026 Aave V3 events trigger checks. Repeated
  same-severity alerts are suppressed by a cooldown (9 Mar 2026). Latest changelog entry: 22 Mar 2026 (Morpho Blue).
  Source: https://defi-monitor.com/changelog (fetched 8 Nov 2026)
- Cost: free tier "for early users"; Pro $4.99/month or $49.99/year (10 addresses, 20 subscriptions); Ultra
  $9.99/month or $99.99/year (30 addresses, 60 subscriptions); auto-renews; no partial refunds. Sources:
  https://defi-monitor.com (FAQ) and https://defi-monitor.com/pricing (fetched 8 Nov 2026)

### Health Factor Watch Bot (open source, also hosted)

- Status: repo public, MIT, last push 6 Oct 2026. Hosted bot `@healthfactor_watch_bot`; send `/watch 0x...`. Source:
- Protocols: Aave V3 on 20 EVM chains and Aave V4 (19 Spokes on Ethereum, Arc, Avalanche, Base). No Morpho. Same source.
- Linking: no website or account; you `/watch` an address in the chat (any address, so no proof you own it). Max 3
  addresses and 30 positions per chat. Same source.
- Check interval: 60 s when health factor < 1.15 or near a level, 120 s when approaching, 300 s otherwise. Default
  levels 1.4, 1.2, 1.1, 1.05; the lowest two repeat every 30 minutes; recovery message above 1.43. Same source.
- Data: stores chat_id, address, market and alert state; "No user names, handles, or message contents are recorded";
  rows deleted on `/delete`, `/remove` or when Telegram reports the bot was blocked. Free, voluntary donations. Same
  source.

### Other open-source, self-hosted options (GitHub)

- **aash**: dashboard plus Telegram alerts when health factor zones change, for Aave V3 and Morpho Blue and Midnight
  positions, with an optional auto-repay "watchdog". You create your own bot with BotFather. No license file reported by
- **aave-portfolio-manager**: Rust service, Aave V3 on Ethereum (L2s on the roadmap), notifies below a lower limit
  (example 1.1) on a cron (example every 5 minutes); "requires a dedicated Telegram bot instance per user"; GPL-3.0; last
- **liquidefi**: Aave liquidation-stats Telegram bot, last push 10 Feb 2021 (stale). Source:

### Tokenping (publisher)

See section 4.

### Not re-checked today (leave out or mark unconfirmed)

- Tenderly Alerts (Telegram among its channels) and the KeeperHub, OpenClaw, Chainlink CRE and Reactive examples from the
  19 Oct table were not re-opened today: **unconfirmed** as of 8 Nov 2026.

---

## 2. How Telegram bots work (privacy and reliability)

- A bot cannot message you first: "Bots can't start conversations with users. A user must either add them to a group or
  send them a message first." Source: https://core.telegram.org/bots (fetched 8 Nov 2026)
- Users see a Start button the first time they open a chat with a bot; `/start` can carry a deep-link parameter
  (`t.me/your_bot?start=...`). Source: https://core.telegram.org/bots/features (fetched 8 Nov 2026)
- `sendMessage` takes a `chat_id` that is a "Unique identifier for the target chat or username of the target bot,
  supergroup or channel in the format @username", so a person's @username alone is not a send target. Source:
  https://core.telegram.org/bots/api#sendmessage (fetched 8 Nov 2026)
- What a bot learns about you, from the `User` object: `id`, `is_bot`, `first_name`, optional `last_name`, `username`,
  `language_code` ("IETF language tag of the user's language") and `is_premium`. Source:
  https://core.telegram.org/bots/api#user (fetched 8 Nov 2026). `getChat` on a private chat can also return fields such
  as bio, birthdate and personal channel when available. Source: https://core.telegram.org/bots/api#chatfullinfo (fetched
  8 Nov 2026)
- Telegram's privacy policy: bot developers "can get your public account data": screen name, username and profile
  pictures; your messages to the bot; possibly your IP if you click a link to a site the bot controls; and your
  interface language. Bots are "completely independent" of Telegram. Source: https://telegram.org/privacy (section 6,
  fetched 8 Nov 2026)
- Bots have limited cloud storage, and no phone number is needed to create one. Source: https://core.telegram.org/bots
  (fetched 8 Nov 2026)
- Rate limits: in one chat avoid more than one message per second (429 errors after bursts); 20 messages per minute in a
  group; bulk broadcasts about 30 messages per second, up to 1000 with paid broadcasts (0.1 Stars per extra message,
  needs 100,000 Stars and 100,000 monthly active users). Source: https://core.telegram.org/bots/faq (fetched 8 Nov 2026).
  Flood-control errors carry `retry_after`, "the number of seconds left to wait". Source:
  https://core.telegram.org/bots/api#responseparameters (fetched 8 Nov 2026)
- Stopping: "If you don't want a bot to send you messages, feel free to block it"; some clients have a "Stop Bot" button.
  Source: https://telegram.org/faq (fetched 8 Nov 2026). In a private chat the bot gets a `my_chat_member` update "only
  when the bot is blocked or unblocked by the user". Source: https://core.telegram.org/bots/api#update (fetched 8 Nov
  2026). A `/stop` command is not a Telegram feature; it is whatever each bot implements (Tokenping's forgets the chat).
- Bot API 10.0 (8 May 2026) added guest mode: a bot mentioned in a chat gets one update and can issue one reply, without
  access to history. Source: https://core.telegram.org/bots/api#recent-changes and
  https://core.telegram.org/bots/features (fetched 8 Nov 2026). Latest Bot API entry: 10.3, 24 Aug 2026 (same source).

---

## 3. A different thing: exchange and market liquidation feeds

- Binance's public `!forceOrder@arr` stream pushes forced liquidations for every USDⓈ-M futures symbol, at most the
  latest one per symbol per 1000 ms. Market-wide feed bots read this kind of stream; they say nothing about your DeFi
  loan. Source:
  https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/All-Market-Liquidation-Order-Streams
  (fetched 8 Nov 2026)
- Hyperliquid liquidates perp accounts when equity falls below maintenance margin, using the mark price, with a
  liquidator vault inside HLP as backstop. Source: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations
  (fetched 8 Nov 2026). Example bot: hl-notify, a self-hosted, single-user Telegram bot that watches Hyperliquid wallets
  8 Nov 2026)
- Exchange-position alerts: Cryptocurrency Alerting offers liquidation alerts for Bybit, KuCoin, BitMEX and Binance
  Futures positions by Telegram and other channels; paid plans from $3.99/month billed yearly, plus a free tier with a
  notification limit. Source: https://cryptocurrencyalerting.com/guide/liquidation-alerts.html (fetched 8 Nov 2026)
- Public "Binance liquidations" Telegram channels exist, but none found today was from an official or reputable source
  (**unconfirmed**; do not cite).

---

## 4. How Tokenping's Telegram linking works (from the repository)

- You type your Telegram @username into the alert and press Start in the bot once, "since a bot cannot message someone
  who never wrote to it". Source: `README.md` (Alerts) and `docs/telegram-integration-strategy.md` in
  https://github.com/romispectrum/tokenping (read 8 Nov 2026)
- The webhook stores `(chat_id, username)` in `telegram_chats`, taking the username Telegram reports for the sender,
  never one from message text, so only the account that owns a username can link it. The bot replies "Linked @name". The
  table holds `chat_id`, `username`, `linked_at`, `updated_at` only. Sources: `docs/telegram-integration-strategy.md`,
  `packages/supabase/migrations/20261018000000_telegram_usernames.sql` (read 8 Nov 2026)
- The account needs a Telegram username; private chats only. A username change breaks the link until `/start` is sent
  again; each send first checks `getChat`. Source: `docs/telegram-integration-strategy.md` (read 8 Nov 2026)
- `language_code` is read only to pick the reply language (Czech for cs and sk, English otherwise); it is not stored.
  Source: `packages/nextjs/app/api/telegram/webhook/route.ts` (read 8 Nov 2026). The alert itself goes out in the
  language chosen next to the channel (English, Czech, Spanish, Hindi, German or Vietnamese). Source: `README.md`
- Commands: `/start` links, `/stop` forgets the chat, `/help`. Blocking the bot, or a deleted chat, makes the cron delete
  the row. Source: `docs/telegram-integration-strategy.md` (read 8 Nov 2026)
- Plain text, no `parse_mode`, 8-second timeout. Source: `docs/telegram-integration-strategy.md`
- Checks every 5 minutes (Vercel cron `*/5 * * * *`); while below the threshold each channel gets a message every 15
  minutes, starting at once; no snooze and no "recovered" message. Sources: `README.md`,
  `packages/nextjs/vercel.json` (read 8 Nov 2026)
- What it needs: a wallet connection and a Sign-in with Ethereum signature, then paid access in USDC on Arbitrum One;
  only the connected wallet can be watched; thresholds 1.1 to 10 on Aave (default 1.5), down to 1.02 on Morpho; Aave V3,
  V4, Morpho Blue and Midnight. Source: `README.md` (read 8 Nov 2026)
- Limits: recipients are not verified, so a paying wallet can name the username of anyone who pressed Start; `/stop` ends
  it for that chat. Anyone can ask `/api/telegram/status` whether a username has pressed Start (yes or no, never a chat
  id). No uptime guarantee; polling can miss a fast move. Source: `README.md` (Limits, read 8 Nov 2026)
- Doc drift: `docs/telegram-integration-strategy.md` lists `app/api/telegram/webhook/bot.ts`, which does not exist; the
  commands are in `route.ts`. (Observed 8 Nov 2026; not edited.)
