# Data snapshot: private-aave-liquidation-alerts

Fact-check log for `content/blog/private-aave-liquidation-alerts.mdx` (English) and
`content/blog/cs/soukroma-upozorneni-na-likvidaci-aave.mdx` (Czech). Everything below was read or fetched on
2026-10-19. The post states what Tokenping does as of that day, from the repository's `main` branch; it has no
on-chain figures, so `<ScopeNote />` keeps its shared "Figures as of" date and the post dates its own facts in the text.
Working notes and raw page copies were kept outside the repository and are not committed.

Rules the post follows: the privacy page (`packages/nextjs/i18n/messages/privacy.ts`, rendered by
`components/pages/PrivacyPage.tsx`) is the source of truth for what is stored and which processors receive what; the
code is checked against it claim by claim, and where they differ the post follows the code and the difference is listed
in section 4.

## 1. What the post says about Tokenping, and where the code shows it

Paths are relative to `packages/nextjs` unless they start with `packages/`.

| Statement in the post | Read in |
| --- | --- |
| One row per wallet, network and market with address, network, market, threshold, channels, per-channel language, email, Signal username, Telegram username, created and changed times | `services/notifications/configRepository.ts` (`toConfigRow`, `NotificationConfigRow`, `saveConfig`); migrations `20250225120000`, `20260415000000`, `20261016000000`, `20261017000000`, `20261018000000`, `20261020000000` in `packages/supabase/migrations`; `i18n/messages/privacy.ts` (`stored.items`) |
| The write accepts only enabled, services, threshold, email, Signal username, Telegram username and languages (no name, phone number or password field exists) | `services/notifications/configInput.ts` (`ConfigInput`, `parseConfigInput`) |
| Last test time per wallet and channel, one test per channel every 15 minutes | `app/api/notifications/test/route.ts`; migration `20261019000000` (`notification_test_sends`, `claim_notification_test_send`); `constants/notifications.ts` (`TEST_SEND_COOLDOWN_MINUTES`) |
| Pressing Start in the bot stores the chat ID and the time, in a separate table, under the username Telegram reports | `app/api/telegram/webhook/route.ts`, `services/telegram/telegramChats.ts`; migration `20261018000000` (`telegram_chats`: `chat_id`, `username`, `linked_at`) |
| The optional "How did you hear about Tokenping?" answer is stored with the wallet and the time | `app/api/attribution/route.ts`, `services/notifications/attributionRepository.ts`; migration `20261015000000` |
| No positions or health factor history, no log of sent alerts in the database | `services/notifications/runNotificationCheck.ts` writes nothing except deleting a dead Telegram chat; `i18n/messages/privacy.ts` (`notStored.items`) |
| Alert text names the market, health factor, threshold and time, and no wallet address | `i18n/messages/notifications.ts` (`alertText`, `alertHtml`, `testLines`) |
| Sign-in is a Sign-in with Ethereum (EIP-4361) message; no gas, no approval; a one-time code valid 5 minutes, used once, stored without the address | `services/auth/signInMessage.ts` (`SIGN_IN_TTL_SECONDS`, `buildSignInMessage`), `app/api/auth/nonce/route.ts`, `app/api/auth/verify/route.ts`, `services/auth/nonceStore.ts`; migration `20261022000000` (`auth_nonces`: `nonce`, `expires_at` only) |
| Session cookie: HttpOnly, carries the wallet address and an expiry, signed (HMAC), not encrypted, 7 days; a second cookie holds the one-time code during sign-in; the site clears the session when the wallet disconnects | `services/api/server/session.ts` (`setSessionCookie`, `setNonceCookie`), `services/auth/sessionToken.ts` (`SESSION_MAX_AGE_SECONDS`, "Signed, not encrypted"), `app/api/auth/logout/route.ts`, `hooks/custom/useWalletSession.ts` (`useAccountEffect`), `README.md` (Limits) |
| Every alert route acts only for the session wallet; a request naming another wallet is refused | `services/api/server/session.ts` (`requireSessionWallet`: 401 without a session, 403 when a claimed `userId` differs) used by `app/api/notifications/config/route.ts` (GET, PUT, DELETE), `app/api/notifications/test/route.ts` (GET, POST) and `app/api/attribution/route.ts` |
| Tables closed to the public (anon) key; only the server's service-role key reaches them | migrations `20261021000000_lock_down_server_only_tables.sql` and `20261022000000`; `services/supabase/supabaseServer.ts` (service-role key only); `packages/supabase/README.md`; `docs/architecture.md` ("How the server is locked down") |
| Anyone can ask whether a Telegram username has pressed Start (yes or no, no chat ID) | `app/api/telegram/status/route.ts` (unauthenticated by design, its docblock says so); `README.md` (Limits) |
| A failed check or message logs an error that can include the wallet address and the recipient | `services/notifications/runNotificationCheck.ts` (`recordError` logs the full detail and masks recipients only in the response); `i18n/messages/privacy.ts` (`notStored.items`, last item) |
| Who handles what: Vercel, Vercel Web Analytics, Supabase, Resend, the Fly.io Signal relay, Telegram, RPC providers, WalletConnect | `i18n/messages/privacy.ts` (`processors.list`); `services/email/sendEmail.ts` (Resend), `services/signal/sendSignal.ts` (relay), `services/telegram/sendTelegram.ts` (Bot API), `utils/rpc.ts` (PublicNode, Alchemy, public endpoints), `components/RootDocument.tsx` (`<Analytics />`) |
| Each payment is a public event: paying address, token, amount, time, period, new expiry; nothing about the alert is written on-chain | `packages/hardhat/contracts/TokenpingPaywall.sol` (`PaymentReceived`, `pay`); `i18n/messages/privacy.ts` (`onChain`). Sourcify v2 API read for chain 42161: implementation `0x3067f5f1f7A23feFf856fA6CdCb17b7105CdF2b1` is `exact_match` (creation and runtime) and its ABI has `PaymentReceived(address indexed user, address indexed token, uint256 amount, uint256 paidAtTimestamp, uint256 durationSeconds, uint256 newExpiryTimestamp)`; proxy `0x79872d7529cfE1c062838fACDA004Ce4BFB16553` is `exact_match` too; `https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553` answers HTTP 200 |
| Tokenping watches only the connected wallet; access belongs to the wallet that paid, so one wallet cannot pay to watch another's position | `README.md` (Limits: "Only the connected wallet can be watched ... access is per paying wallet"), `services/notifications/runNotificationCheck.ts` (reads the health factor of the alert's own `user_id`), `app/api/notifications/config/route.ts` (`requireActiveAccess` for the session wallet); the existing guide `aave-health-factor-alert-setup` says the same |
| Deleting an alert removes that market's settings, needs active access, and each market is deleted separately; access ending deletes nothing | `app/api/notifications/config/route.ts` (DELETE: `requireActiveAccess`, `deleteConfigs` by wallet, chain and market); `i18n/messages/privacy.ts` (`retention`); `README.md` (Limits: an alert is not removed when access lapses, and deleting needs active access). The post says "stays stored", not that it keeps sending |
| /stop unlinks the Telegram chat | `app/api/telegram/webhook/route.ts` (`handleStop`), `i18n/messages/privacy.ts` (`retention.telegramStop`) |
| Signal username shape `alice.42`; the relay sends to the stored username | `utils/notifications/validation.ts` (`SIGNAL_USERNAME_REGEX`), `services/signal/sendSignal.ts` |
| Telegram username 4 to 32 characters, a-z, 0-9, underscore | `utils/notifications/validation.ts` (`TELEGRAM_USERNAME_REGEX`, `normalizeTelegramUsername`); `i18n/messages/alerts.ts` |
| Telegram is offered on the live site | `https://tokenping.xyz/aave` and `https://tokenping.xyz/privacy` (fetched 2026-10-19) name Telegram as a channel and list it as a processor; in code it is gated by `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` (`constants/notifications.ts`) |
| Button and label names ("Random Alias" is SimpleLogin's; **Send test**, **Edit alert**, **Delete alert**, "Signal username") | `i18n/messages/alerts.ts` (English and Czech: Poslat test, Upravit upozornění, Smazat upozornění) |

## 2. Outside pages fetched

All fetched on 2026-10-19 with WebFetch, except the Signal support pages, which answer 403 to scripted fetches and were
read in a browser; the Telegram FAQ was read in a browser as well, to quote exact wording. Pages were treated as data.

| Page | What the post takes from it |
| --- | --- |
| https://simplelogin.io/ | An alias forwards to the real inbox; the reply goes out from the alias; made by Proton AG; open source |
| https://simplelogin.io/pricing/ | A plan that costs nothing with a limited number of aliases (the post states no number and no price) |
| https://simplelogin.io/docs/getting-started/create-alias/ | "Random Alias" button, random words or UUID for the left part, custom alias, optional note |
| https://duckduckgo.com/duckduckgo-help-pages/email-protection/what-is-duckduckgo-email-protection | Addresses that forward to your own mailbox |
| https://relay.firefox.com/ | Email masks that forward to your address, run by Mozilla |
| https://addy.io/ | Anonymous email forwarding aliases, open source |
| https://support.apple.com/en-us/102548 | Hide My Email forwards to your inbox and is included with iCloud+ (the Sign in with Apple page 105078 is a different page and is not cited) |
| https://support.signal.org/hc/en-us/articles/6712070553754-Phone-Number-Privacy-and-Usernames | Username rules (3 to 32 characters, a-z, 0-9, `_`, at least two digits at the end); Settings, Privacy, Phone Number; "Who can see my number" and "Who can find me by my number"; people with your number saved still see it; what the sender sees before and after a message request is accepted; an old username can be claimed by anyone soon after a change; a username is only a way to start a chat |
| https://support.signal.org/hc/en-us/articles/360007459591-Signal-Profiles-and-Message-Requests | Profile has a required first name (a nickname, one character or an emoji is fine) and an optional photo; accepting a request lets the sender see the profile |
| https://signal.org/legal/ | A phone number is registered to create an account; Signal cannot decrypt or access message content; the policy does not mention usernames |
| https://telegram.org/faq | Usernames are public and make you findable in global search; people who find you can message you without your number; Telegram advises against a username if you are not comfortable with that; default phone-number visibility and Settings, Privacy and Security, Phone Number; finding someone by username does not reveal either number; bots see public name, username and profile pictures, not the phone number unless given |
| https://telegram.org/privacy | Screen name need not be the real name; cloud chats are stored on Telegram's servers, heavily encrypted; Secret Chats are end-to-end encrypted |
| https://core.telegram.org/bots/api | `User` has `id`, `first_name` (required), optional `last_name`, `username`, `language_code`; every incoming `Message` carries `from` and `chat` |
| https://resend.com/legal/dpa | Exhibit A: minimum data is metadata, email address and message content |
| https://www.resend.com/docs/webhooks/how-to-store-webhooks-data | "Resend retains email data for 30 days across all plans (with flexible retention for Enterprise)" |
| https://resend.com/legal/privacy-policy | Read; it covers Resend's own website visitors and says nothing about customers' recipients, so the post does not cite it |
| https://vercel.com/docs/analytics/privacy-policy | Visitors are identified by a hash created from the request, without third-party cookies; the session is discarded after 24 hours; the data points collected |
| https://docs.ens.domains/web/reverse | Any app can look up the primary name of an address |
| https://ethereum.org/en/developers/docs/intro-to-ethereum/ | "A blockchain is a public database ..." (the post quotes three words) |
| https://ethereum.org/en/developers/docs/accounts/ | Read; it does not say addresses are public or pseudonymous, so the post does not cite it |

The post also points readers to the public repository so they can check the storage and access claims themselves:
`https://github.com/romispectrum/tokenping` and its `tree/main` pages for `packages/nextjs/app/api/notifications`,
`packages/nextjs/app/api/auth`, `packages/nextjs/app/api/telegram` and `packages/supabase/migrations` all answered HTTP
200 on 2026-10-19 (the post links the repository and the notifications, auth and migrations pages). It says the code is "public", not "open
source": the README notes that the repository has no LICENSE file, and the content test bans "open-source licensed".

## 3. Production checks (2026-10-19, read-only)

- The live privacy page matches `i18n/messages/privacy.ts`: last updated 19 October 2026, Telegram listed as a
  processor, "Only someone who can sign with your wallet can see the email address, Signal username and Telegram
  username ...".
- At about 07:57 UTC the live `POST /api/auth/nonce` and `GET /api/notifications/config` answered 503 "Sign-in is not
  available on this server", which is the response the code gives when `SESSION_SECRET` is not set. The post describes
  sign-in as it works in the code. Re-check that people can sign in on the live site before publishing.
- `GET /api/telegram/status?username=...` answered 500 "Could not check the Telegram username" at the same time, a
  database or configuration error. Re-check as well.

## 4. Not verified, and differences found

- Whether the database lock-down migration `20261021000000` is applied in the production Supabase project. The post
  states what the code and migrations do ("the tables are closed to the public key"). Confirm it before publishing.
- Differences between the privacy page and the code: none in the facts the post uses. Two stale texts elsewhere: the
  homepage answer "What do you store?" (`i18n/messages/home.ts`) still says anyone who knows an address can read its
  contact details "until wallet signatures are checked", and the comment above `PrivacyPage` in
  `components/pages/PrivacyPage.tsx` says settings are tied to a wallet "without a wallet-ownership check yet". Both
  predate the sign-in routes; the privacy page text itself is correct.
- "The people who run Tokenping, and its database host, can read the rows" is an inference from how a database works,
  not a quoted statement.
- "If you funded the wallet from an exchange where you verified your identity, the exchange usually holds a record of
  that withdrawal" is general knowledge, with no source.
- "Moving a loan to a new wallet usually means closing and reopening the position" is general Aave knowledge, hedged.
- Czech names of the Signal and Telegram privacy menus were not checked in the Czech apps, so the post gives the English
  menu names with a Czech gloss.
- Tokenping's actual Resend plan and its own Resend retention setting are unknown; the post states Resend's documented
  default only.
- Whether a Signal message request must be accepted for alerts to keep arriving is not stated by Signal's pages, so the
  post only says to set the number and profile options before accepting.

## 5. Changes to the content test for this post

- `content/blog/content.test.ts`: internal links may now point to the privacy page (`/privacy`, `/cz/ochrana-soukromi`)
  as well as the home page, the dashboard and the blog. The fixtures that used the privacy page as an example of a
  disallowed link now use `/admin` and `/cz/admin`.
- The test bans naming Signal and Telegram together ("articles name Signal and email only until the Telegram bot is
  live"). The bot is live on tokenping.xyz, so the post covers Telegram in its own section and never lists the two
  side by side. The rule itself looks stale.
- `content/blog/index.test.tsx`: the cluster list has nine posts. `app/(en)/blog/page.test.tsx` and
  `app/(cs)/cz/blog/page.test.tsx` expected every card to show 14 October 2026; they now check each card against its own
  `publishedAt`.
