# Tokenping

Aave V3 and V4 health factor alerts by email, Signal and Telegram.

Tokenping watches the Aave V3 and V4 health factor of the wallet you connect and sends you a message when it drops below a
threshold you choose. Alerts are paid in USDC on Arbitrum One; looking at your positions needs no payment.

- Website: https://tokenping.xyz
- Blog (Aave health factor and liquidation guides): https://tokenping.xyz/blog
- X: https://x.com/tokenping
- Telegram community: https://t.me/tokenping_xyz

Tokenping is in beta. It is an independent tool, not affiliated with Aave Labs or the Aave DAO.

## What it does

- **Dashboard (read-only, no payment).** Connect a wallet to see its collateral, debt and health factor in every Aave V3
  market on a mainnet (24 markets on 21 networks, Ethereum's Core, Prime, EtherFi and Horizon among them) and in every
  Aave V4 Spoke (20 Spokes on Ethereum, Avalanche, Arc and Base). Both lists live in
  `packages/nextjs/config/aaveConfig.ts`. Each V3 market and each V4 Spoke keeps a separate position and health factor,
  so each is its own market; the dashboard lists the markets where the wallet has a position or an alert and folds the
  rest away. Network logos and token icons come from CoinGecko and are served by the site. Positions are read with
  view calls only; the app never asks for an approval or a signature on Aave.
- **Alerts.** One alert per market (a V3 market or a V4 Spoke), for the connected wallet. You pick a threshold from 1.1 to
  10 (default 1.5) and one or more channels:
  - Email, sent through [Resend](https://resend.com).
  - Signal, sent to your Signal username through a self-hosted
    [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) relay behind a token-checking proxy
    ([deploy guide](docs/signal-server-fly.md)).
  - Telegram, sent to your Telegram username through the Bot API. You type your @name into the alert and press Start in
    the bot once, since a bot cannot message someone who never wrote to it. The bot's webhook then links the username
    to your chat (`telegram_chats`). Needs a configured bot (`TELEGRAM_*` and `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`) and
    `yarn next:telegram-webhook` once after deploying; see [docs/telegram-bot-setup.md](docs/telegram-bot-setup.md).
    Site copy names Telegram only while `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is set.
- **Language per channel.** Each channel is sent in English or Czech, chosen next to its recipient. A channel starts in
  the language of the page you added it from.
- **Send test.** Every channel has a "Send test" button that sends the alert as saved, with your position right now.
  The limit is one test per channel every 15 minutes, enforced in the database.
- **Checks every 5 minutes.** A Vercel cron calls `/api/cron/notifications` (`packages/nextjs/vercel.json`), which reads
  each saved alert's health factor and messages every selected channel while it is below the threshold.
- **Wallet sign-in.** Alert settings are tied to a wallet. You sign a Sign-in with Ethereum message once, and an HttpOnly
  session cookie lasts 7 days. The alert API only acts for the signed-in wallet.
- **Paid access on-chain.** `TokenpingPaywall` (an upgradeable UUPS proxy on Arbitrum One) sells access for USDC: an
  approval for exactly the price, then `pay`. No auto-renew; paying again extends the current expiry. The price is read
  from the contract (`plans(token)`), so the site never hard-codes it. The proxy and implementation are verified on
  [Sourcify](https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553).
- **Blog.** MDX articles in `packages/nextjs/content/blog` (English, and Czech in `content/blog/cs`), rendered as Server
  Components with a sitemap, RSS feed and JSON-LD. `yarn next:indexnow` tells Bing, Seznam and Yandex about new and
  changed pages through [IndexNow](#indexnow).
- **Search and AI crawlers.** robots.txt (`utils/robots.ts`) names the search and AI-answer crawlers and the training
  crawlers separately (both allowed, `/api/` closed) and carries a [Content Signal](https://contentsignals.org) of
  `search=yes, ai-input=yes, ai-train=yes`, `/llms.txt` lists the pages and guides for AI tools, both homepages send
  an RFC 8288 `Link` header to it, the RSS feed and the privacy page (`next.config.ts`), `/.well-known/agent-skills/`
  lists one agent skill for assistants that help a borrower with health factor alerts (`utils/agentSkills.ts`, built
  from the same constants as the pages, with its digest taken from the served text), `/.well-known/ard.json` (and the
  older `ai-catalog.json`) lists that skill in an Agentic Resource Discovery manifest (`utils/ard.ts`), and the
  site-wide JSON-LD names the X, Telegram and GitHub profiles. Every page is server-rendered, so crawlers that run no JavaScript
  read the full text. A request for a sitemap page with `text/markdown` in its `Accept` header gets the page as
  markdown (`text/markdown; charset=utf-8`): front matter with its title, description, canonical URL and language,
  then its `<main>` with GFM tables and absolute links. `next.config.ts` rewrites only those requests, and only page
  paths, to `app/md/[[...path]]/route.ts`, which converts the page's own HTML (`utils/markdown.ts`) and answers with
  `Vary: Accept`, a canonical `Link`, the Content Signal and an `x-markdown-tokens` estimate. Every other request,
  browsers and search crawlers included, gets the HTML as before. On a preview behind Vercel Authentication the route
  cannot fetch the page, so markdown requests there answer 502.
- **English and Czech.** The whole site is published in both languages; see [docs/i18n.md](docs/i18n.md).
- **Analytics.** [Vercel Web Analytics](https://vercel.com/docs/analytics) counts page views without cookies. It is
  left out of the IPFS build (`yarn ipfs`). The privacy page lists it.

How the pieces fit together, with a diagram: [docs/architecture.md](docs/architecture.md).

## Limits

- Aave only. Harmony's V3 market is left out: frozen since 2022 with fixed price feeds, so a health factor there never
  moves. A new Aave market or V4 Spoke is read only once it is added to `AAVE_MARKETS` or `AAVE_V4_SPOKES`, then
  `yarn next:token-icons` and `yarn next:network-icons` fetch its icons.
- Scroll, ZKsync, Metis, Soneium and Sonic are being wound down by Aave governance (ARFC of July 2026). Positions
  there are still watched: they can still be liquidated, and the wind-down raises their borrow rates.
- A V4 Spoke counts only collateral and debt, as V3 does: a wallet that only supplies assets that are not collateral
  shows no position there. The dashboard shows no supply APY for V4 reserves.
- Polling, not real time: a fast price move can cross a health factor of 1.0 between two checks. Alerts reduce risk;
  they do not prevent liquidation.
- While a health factor is below its threshold, every check sends another message on each channel. There is no
  cooldown, snooze or "recovered" message, and emails have no unsubscribe link yet.
- Only the connected wallet can be watched: no watch-only addresses, and access is per paying wallet.
- A wallet can hold at most 50 alerts.
- Paid access is checked when an alert is saved, deleted or tested, not when the cron runs. An alert whose access has
  lapsed keeps sending until it is deleted, and deleting needs active access.
- Payment is USDC on Arbitrum One only (you need a little ETH there for gas). The contract has no refund function, and
  its owner can change the price, pause payments, withdraw funds and upgrade it.
- An ordinary wallet's sign-in signature is checked locally; a smart wallet's (ERC-1271, ERC-6492) only through the
  app's own RPC (`NEXT_PUBLIC_ALCHEMY_API_KEY` or `rpcOverrides`), never a public one, so without one smart wallets
  cannot sign in. A copied session cookie stays valid until it expires (7 days), and rotating `SESSION_SECRET` ends
  every session. Sign-in needs the `auth_nonces` table and the Supabase service role key, and has no rate limit of its
  own. Disconnecting the wallet while the site is open clears the cookie.
- Anyone can ask `/api/telegram/status` whether a Telegram username has pressed Start in the bot. It answers yes or no,
  never a chat id.
- Delivery depends on third parties (Resend, the Signal relay, the Telegram Bot API, public RPC providers, Vercel
  cron). There is no published uptime guarantee.

## Repository layout

| Path                        | What it holds                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `packages/nextjs`           | The Next.js 15 App Router app: homepage, dashboard (`/aave`), blog, privacy page, API routes and the cron |
| `packages/hardhat`          | `TokenpingPaywall` and its tests, deploy and upgrade scripts ([README](packages/hardhat/README.md))       |
| `packages/supabase`         | Database migrations and local config ([README](packages/supabase/README.md))                              |
| `packages/tokenping-signal` | Dockerfile, Caddyfile, entrypoint and `fly.toml` of the Signal relay                                      |
| `docs/`                     | The guides listed below                                                                                   |

The project started from [Scaffold-ETH 2](https://scaffoldeth.io) (Hardhat flavor), so its tooling and commands apply
(hardhat-deploy, the `yarn account` and `yarn verify` commands, the `hooks/scaffold-eth` hooks). The Foundry flavor is
not in this repository.

## Documentation

- [docs/architecture.md](docs/architecture.md): how the browser, the Next.js routes, Supabase, the cron, Resend, the
  Signal relay, Telegram and the paywall contract fit together.
- [packages/supabase/README.md](packages/supabase/README.md): the local database, every migration and the deploy order.
- [packages/hardhat/README.md](packages/hardhat/README.md): the contract, deploying, upgrading and verifying it.
- [docs/signal-server-fly.md](docs/signal-server-fly.md): deploying the Signal relay to Fly.io.
- [docs/telegram-bot-setup.md](docs/telegram-bot-setup.md) and
  [docs/telegram-integration-strategy.md](docs/telegram-integration-strategy.md): setting up the bot, and why it links a
  username to a chat.
- [docs/i18n.md](docs/i18n.md): the English and Czech wiring and the Czech voice.
- [docs/design-system.md](docs/design-system.md): tokens, components and the voice for the UI.
- [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md): code conventions and how to contribute.

## Local development

Requirements: [Node](https://nodejs.org/en/download/) 22 (22.12 or later), 24 or 26+ (the `engines` field in
`package.json`), Yarn, Git, and for the database
[Docker](https://docs.docker.com/get-docker/) with the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
yarn install

# 1. Local chain (terminal 1)
yarn chain

# 2. Deploy the paywall with a mock USDC to that chain (terminal 2)
yarn deploy --deploy-mode local

# 3. Local Supabase, then apply the migrations
yarn supabase:start
yarn supabase:reset

# 4. App settings: copy the template and fill in what you need (every variable is documented there)
cp packages/nextjs/.env.example packages/nextjs/.env.local

# 5. Frontend at http://localhost:3000 (terminal 3)
yarn start
```

`yarn deploy` uses the `localhost` network, the node from `yarn chain`. Do not pass `--network hardhat`: that is an
in-memory network that disappears when the command ends. The deploy rewrites
`packages/nextjs/contracts/deployedContracts.ts` and mints MockUSDC to the address set in
`packages/hardhat/deploy/00_deploy_tokenping_paywall_local.ts`; change it to your wallet to pay locally.

`packages/nextjs/scaffold.config.ts` targets Arbitrum One. The app takes payments on the first target network with a
paywall deployment, so to pay with the local mock USDC, put `chains.hardhat` first in `targetNetworks`. The
Scaffold-ETH dev pages (`/debug`, `/blockexplorer`) exist only while hardhat is a target network
and answer 404 otherwise. `/admin` is the owner console for the paywall contract: no page links to it, it is left out
of the sitemap, and its actions are enabled only for the wallet that the contract's `owner()` returns.

With `yarn start` (development), `GET /api/notifications/check` runs one pass of the cron's check at once. It answers
404 in any other mode.

Locally, a random `SESSION_SECRET` stands in when none is set, and the server talks to `supabase start` with its demo
service-role key, so `SUPABASE_SERVICE_ROLE_KEY` can stay empty. `yarn next:serve` (`next start`) on localhost runs a
production build: it needs `SESSION_SECRET` and `NEXT_PUBLIC_APP_URL=http://localhost:3000` before sign-in works, because
a production build accepts sign-in messages only for its configured origins.

### Environment variables

The app reads `packages/nextjs/.env.local` (template: `packages/nextjs/.env.example`, where every variable is
explained). In the table, "production" means a Vercel production deployment. Server-only variables must never carry a
`NEXT_PUBLIC_` prefix.

| Variable                                                                     | Production          | Used for                                                                                                                                                                        |
| ---------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`                                                               | Required            | The Supabase project's API URL. Defaults to `http://localhost:54321` outside production.                                                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`                                                  | Required            | The only key the server uses. Without it the app refuses to reach the database in production or against a hosted project.                                                       |
| `SESSION_SECRET`                                                             | Required            | Signs the session cookie, 32 characters or more (`openssl rand -hex 32`). Use a different one for Production and Preview. Without it, sign-in and every alert route answer 503. |
| `CRON_SECRET`                                                                | Required            | The bearer Vercel sends with each cron run. Without it the cron answers 401 to every run, so no alerts go out, and `/api/send-email` answers 503.                               |
| `NEXT_PUBLIC_ALCHEMY_API_KEY`                                                | Recommended         | Your own Alchemy key for chain reads. Without it the app uses Scaffold-ETH's shared key after public endpoints, and smart wallets cannot sign in.                               |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`                                      | Recommended         | Your WalletConnect project. Defaults to Scaffold-ETH's shared one; set your own in production and list the site's domains in its allowlist.                                     |
| `NEXT_PUBLIC_APP_URL`                                                        | Recommended         | The public origin, e.g. `https://tokenping.xyz`. Server-side API calls use it, and sign-in accepts messages for it.                                                             |
| `NEXT_PUBLIC_SITE_URL`                                                       | Optional            | Origin for canonical URLs, the sitemap, RSS and JSON-LD. Defaults to `https://tokenping.xyz`; read at build time.                                                               |
| `RESEND_API_KEY`                                                             | For email alerts    | Sends email through Resend.                                                                                                                                                     |
| `RESEND_FROM_EMAIL`                                                          | For email alerts    | The sender. Defaults to `Tokenping <onboarding@resend.dev>`, which Resend only lets you send to your own address; use an address on a domain verified in Resend.                |
| `SIGNAL_API_URL`                                                             | For Signal alerts   | Base URL of the Signal relay.                                                                                                                                                   |
| `SIGNAL_SENDER_NUMBER`                                                       | For Signal alerts   | The linked Signal number, in E.164 format.                                                                                                                                      |
| `SIGNAL_API_TOKEN`                                                           | For Signal alerts   | The relay's shared secret; the same value as the Fly secret.                                                                                                                    |
| `TELEGRAM_BOT_TOKEN`                                                         | For Telegram alerts | The bot's token from BotFather.                                                                                                                                                 |
| `TELEGRAM_WEBHOOK_SECRET`                                                    | For Telegram alerts | Checked on every webhook call; the same value registered with `yarn next:telegram-webhook`.                                                                                     |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`                                          | For Telegram alerts | The bot's username without `@`. The site offers Telegram only while this is set.                                                                                                |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional            | Search Console and Bing Webmaster meta-tag tokens; not needed with DNS verification.                                                                                            |
| `INDEXNOW_KEY`                                                               | Optional            | The [IndexNow](#indexnow) key, served at `/indexnow-key.txt` (404 without it); read at build time. Generate one with `openssl rand -hex 16`.                                    |
| `COINGECKO_API_KEY`                                                          | Optional            | A CoinGecko Demo key for `yarn next:token-icons`. The app does not read it.                                                                                                     |

Set by tooling or by Vercel, not in the template: `NEXT_PUBLIC_HARDHAT_RPC_URL` (the local node, default
`http://127.0.0.1:8545`), `NEXT_PUBLIC_IGNORE_BUILD_ERROR` (set by `yarn vercel:yolo`), `NEXT_PUBLIC_IPFS_BUILD` (set by
`yarn ipfs`), and Vercel's own `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL` and `VERCEL_PROJECT_PRODUCTION_URL`. In
production, sign-in accepts messages only for `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` and the deployment's own
Vercel URLs.

The contract tooling has its own template, `packages/hardhat/.env.example`: `ALCHEMY_API_KEY`, `ETHERSCAN_V2_API_KEY`
and `DEPLOYER_PRIVATE_KEY_ENCRYPTED` (see [packages/hardhat/README.md](packages/hardhat/README.md)).

### Checks

```bash
yarn next:check-types   # TypeScript
yarn lint               # ESLint for the app and the contracts
yarn next:test          # Vitest for the app
yarn test               # Hardhat tests for the contracts
yarn format             # Prettier for the app and the contracts
```

CI (`.github/workflows/lint.yaml`) runs the lint and type checks on pushes and pull requests to `main`. It does not run
the tests.

### Token icons

The dashboard shows each Aave reserve's CoinGecko icon. The icons are downloaded once into
`packages/nextjs/public/token-icons` and served by the site, so a visitor's browser never contacts CoinGecko. Refresh
them when Aave lists a new asset:

```bash
yarn next:token-icons
```

It reads every market's reserves on-chain, rewrites the icons and `packages/nextjs/config/tokenIcons.generated.ts`, and
lists the reserves CoinGecko has no logo for (the dashboard shows their first letter). It reads
`packages/nextjs/.env` and `.env.local`, so a CoinGecko Demo key in `COINGECKO_API_KEY` there speeds it up. Look over the
changed icons before committing: a broken CoinGecko image goes in `IMAGE_OVERRIDES` and dark artwork that vanishes on the
dark theme in `WHITE_BACKED_IMAGES`, both in `packages/nextjs/scripts/tokenIconSources.ts`.

Network logos work the same way: `yarn next:network-icons` downloads them into `packages/nextjs/public/network-icons`
and rewrites `config/networkIcons.generated.ts`. Run it when a network is added.

## Deployment

The frontend runs on Vercel, with `packages/nextjs` as the project root (that is where `vercel.json` lives). `yarn vercel`
wraps the Vercel CLI (Corepack on, mutable installs, no telemetry); `yarn vercel:yolo` does the same and also ignores
TypeScript and ESLint errors in the build, so run the checks above first. The 5-minute cron in `vercel.json` needs a
Vercel plan that allows it.

Order for a new deployment:

1. **Database.** Create a Supabase project, link it (`cd packages && supabase link --project-ref <ref>`) and apply every
   migration with `supabase db push`. The migrations, what each does and how to upgrade a live database are in
   [packages/supabase/README.md](packages/supabase/README.md).
2. **Signal relay** (optional). Deploy `packages/tokenping-signal` to Fly.io and link a Signal account:
   [docs/signal-server-fly.md](docs/signal-server-fly.md).
3. **Telegram bot** (optional). Create the bot and pick a webhook secret: [docs/telegram-bot-setup.md](docs/telegram-bot-setup.md).
4. **Environment variables.** Set the variables from the table above in the Vercel project: at least `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` and `CRON_SECRET`, plus the channels you use. The server logs the
   reason when a required one is missing.
5. **Deploy the app.**
6. **Register the Telegram webhook** (only if you use Telegram): `yarn next:telegram-webhook`.
7. **Check the cron.** Vercel runs it every 5 minutes; to run it by hand, call
   `GET /api/cron/notifications` with `Authorization: Bearer <CRON_SECRET>`. It answers with the number of alerts
   checked and messages sent per channel.
8. **Tell search engines** (optional): `yarn next:indexnow`, see [IndexNow](#indexnow).

The app sends security headers on every response (`next.config.ts`, described in
[docs/architecture.md](docs/architecture.md#how-the-server-is-locked-down)). Pages may be framed only by the site itself
and Safe; if you embed Tokenping anywhere else, add that origin to `FRAME_ANCESTORS` there.

When you upgrade a live deployment, apply new migrations before the code that needs them, with one exception: migration
`20261021000000_lock_down_server_only_tables.sql` takes the database away from the anon key, so apply it only once the
running deployment uses `SUPABASE_SERVICE_ROLE_KEY`.

### IndexNow

Bing, Seznam, Yandex and the other engines in [IndexNow](https://www.indexnow.org) share every URL they are told about
and can crawl it within hours instead of waiting to find it. Google does not take part; it reads the sitemap.

1. Generate a key with `openssl rand -hex 16`. It is public by design (the engines fetch it from the site to check that
   whoever submits URLs controls it), but it stays out of the repository.
2. Add it as `INDEXNOW_KEY` to the Vercel project's Production environment and redeploy. Then
   `https://tokenping.xyz/indexnow-key.txt` shows the key alone; without the variable it answers 404.
3. After a deploy that adds or changes pages, run from the repo root:

```bash
yarn next:indexnow --since 2026-10-19
```

`--since` sends only the pages whose sitemap date is on or after that day: posts and the blog indexes. The home,
dashboard and privacy pages have no date in the sitemap, so only a run without `--since` sends them; that run sends every
page in both languages and suits the first submission. `--dry-run` lists the URLs and sends nothing, and `--engine bing`
(or `seznam`, `yandex`, `naver`, `yep`, `amazon`) sends to that engine instead of `api.indexnow.org`.

The script reads the key and the URLs from the live site (`/indexnow-key.txt` and `/sitemap.xml`), so it needs no local
variables and never sends a page that is not deployed yet. It sends only `https://tokenping.xyz/` URLs, in batches of up
to 10,000, prints each batch's HTTP status and exits with 1 when one is refused. 200 means accepted; 202 means received, with
the key still to be checked. `api.indexnow.org` answers 202 even for a key file that does not exist, which is why the
script checks the live key file itself before it sends anything.

It does not run on every build. A build does not know which pages changed, IndexNow asks for changed URLs only and
throttles sites that resend unchanged ones (422 or 429), preview deployments must not submit, and a build runs before
its pages and key file are live.

### Contract

The contract has two deploy modes, selected with `--deploy-mode`:

```bash
# Local node only (yarn chain): deploys TokenpingPaywallLocal with a mock USDC
yarn deploy --deploy-mode local

# Ethereum Mainnet or Arbitrum One: deploys TokenpingPaywallProduction
yarn deploy --network arbitrum --deploy-mode production
```

Production deploys prompt for your password, decrypt `DEPLOYER_PRIVATE_KEY_ENCRYPTED` and use the key only at runtime.
Arbitrum production deploys check that the payment token is Circle's native USDC,
`0xaf88d065e77c8cc2239327c5edb3a432268e5831`. Upgrades and verification: [packages/hardhat/README.md](packages/hardhat/README.md).

## Support

Donations are welcome at **romispectrum.eth** (`0x4f57c97f76E8d1C889eaA74A02E150BE1e0EDe25`). The site's footer shows
the same address with a copy button.
