# Tokenping

Aave V3 and V4 health factor alerts on Signal and email.

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
- **Alerts.** One alert per market (a V3 market or a V4 Spoke), for the connected wallet. You pick a threshold from 1.1 to 10 (default 1.5) and
  one or more channels:
  - Email, sent through [Resend](https://resend.com).
  - Signal, sent to your Signal username through a self-hosted
    [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) relay
    ([deploy guide](docs/signal-server-fly.md)).
  - Telegram, to your Telegram username through the Bot API. The account presses Start in the bot once, since a
    bot cannot message someone who never wrote to it. Needs a configured bot (`TELEGRAM_*` and
    `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`; see [docs/telegram-bot-setup.md](docs/telegram-bot-setup.md)). Site copy
    names Telegram only while `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is set.
- **Checks every 5 minutes.** A Vercel cron calls `/api/cron/notifications` (`vercel.json`), which reads each saved
  alert's health factor and messages every selected channel while it is below the threshold.
- **Paid access on-chain.** `TokenpingPaywall` (an upgradeable UUPS proxy on Arbitrum One) sells access for USDC: an
  approval for exactly the price, then `pay`. No auto-renew; paying again extends the current expiry. The price is read
  from the contract (`plans(token)`), so the site never hard-codes it. The proxy and implementation are verified on
  [Sourcify](https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553).
- **Blog.** MDX articles in `packages/nextjs/content/blog`, rendered as Server Components with a sitemap, RSS feed and
  JSON-LD.

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
- Payment is USDC on Arbitrum One only (you need a little ETH there for gas). The contract has no refund function, and
  its owner can change the price, pause payments, withdraw funds and upgrade it.
- The alert API acts only for a wallet that has signed in with Ethereum (EIP-4361). An ordinary wallet's signature is
  checked locally; a smart wallet's (ERC-1271, ERC-6492) only through the app's own RPC (`NEXT_PUBLIC_ALCHEMY_API_KEY`
  or `rpcOverrides`), never a public one, so without one smart wallets cannot sign in. A session is an HttpOnly cookie
  signed with `SESSION_SECRET` that lasts 7 days; disconnecting the wallet while the site is open clears it, but a
  copied cookie stays valid until it expires, and rotating `SESSION_SECRET` ends every session. Sign-in needs the
  `auth_nonces` table and the Supabase service role key, and has no rate limit of its own.
- Alerts can only be deleted in the app while the wallet's access is active.
- Delivery depends on third parties (Resend, the Signal relay, the Telegram Bot API, public RPC providers, Vercel
  cron). There is no published uptime guarantee.

## Repository layout

| Path                        | What it holds                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/nextjs`           | The Next.js 15 App Router app: homepage, dashboard (`/aave`), blog, API routes and the alert cron |
| `packages/hardhat`          | `TokenpingPaywall` and its deploy and upgrade scripts                                             |
| `packages/supabase`         | Database migrations for alert settings and Telegram chats ([README](packages/supabase/README.md)) |
| `packages/tokenping-signal` | Container config for the Signal relay                                                             |
| `docs/`                     | Signal relay and Telegram bot setup guides                                                        |

The project started from [Scaffold-ETH 2](https://scaffoldeth.io) (Hardhat flavor), so its tooling and commands apply.

## Local development

Requirements: [Node](https://nodejs.org/en/download/) 22 (22.12 or later), 24 or 26+ (the `engines` field in
`package.json`), Yarn, Git, and for the database
[Docker](https://docs.docker.com/get-docker/) with the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
yarn install

# 1. Local chain (terminal 1)
yarn chain

# 2. Deploy the paywall with a mock USDC to the local chain (terminal 2)
yarn deploy --network hardhat --deploy-mode local

# 3. Local Supabase, then apply the migrations
yarn supabase:start
yarn supabase:reset

# 4. App settings: copy the template and fill in what you need (every variable is documented there)
cp packages/nextjs/.env.example packages/nextjs/.env.local

# 5. Frontend at http://localhost:3000 (terminal 3)
yarn start
```

`packages/nextjs/scaffold.config.ts` targets Arbitrum One. The app takes payments on the first target network with a
paywall deployment, so to pay with the local mock USDC, put `chains.hardhat` first in `targetNetworks`. The
Scaffold-ETH dev pages (`/debug`, `/blockexplorer`) exist only while hardhat is a target network
and answer 404 otherwise.

Email needs `RESEND_API_KEY`, Signal needs `SIGNAL_API_URL`, `SIGNAL_SENDER_NUMBER` and `SIGNAL_API_TOKEN`, and
Telegram needs the `TELEGRAM_*` variables. `CRON_SECRET` protects the cron and email routes: without it the cron
refuses every run and no alerts go out. Signing in to the alert settings needs the `auth_nonces` migration; locally a
random `SESSION_SECRET` stands in when none is set, and the server talks to `supabase start` with its demo
service-role key, so `SUPABASE_SERVICE_ROLE_KEY` can stay empty. See `packages/nextjs/.env.example`.

### Checks

```bash
yarn next:check-types   # TypeScript
yarn lint               # ESLint for the app and the contracts
yarn next:test          # Vitest for the app
yarn test               # Hardhat tests for the contracts
yarn format             # Prettier
```

### Token icons

The dashboard shows each Aave reserve's CoinGecko icon. The icons are downloaded once into
`packages/nextjs/public/token-icons` and served by the site, so a visitor's browser never contacts CoinGecko. Refresh
them when Aave lists a new asset:

```bash
yarn next:token-icons
```

It reads every market's reserves on-chain, rewrites the icons and `packages/nextjs/config/tokenIcons.generated.ts`, and
lists the reserves CoinGecko has no logo for (the dashboard shows their first letter). It reads
`packages/nextjs/.env.local`, so a CoinGecko Demo key in `COINGECKO_API_KEY` there speeds it up. Look over the
changed icons before committing: a broken CoinGecko image goes in `IMAGE_OVERRIDES` and dark artwork that vanishes on the
dark theme in `WHITE_BACKED_IMAGES`, both in `packages/nextjs/scripts/tokenIconSources.ts`.

## Deployment

The frontend runs on Vercel (`yarn vercel:yolo --prod`). The 5-minute cron in `vercel.json` needs a Vercel plan that
allows it. Set the variables from `packages/nextjs/.env.example` in the Vercel project, including `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_FROM_EMAIL` and `SESSION_SECRET` (`openssl rand -hex 32`, a
different one for Production and Preview), and apply the Supabase migrations first. Without the service-role key the
API refuses to reach the database, without `CRON_SECRET` the cron refuses to run, and without `SESSION_SECRET`
sign-in and every alert route answer 503; each logs why.

The contract has two deploy modes, selected with `--deploy-mode`:

```bash
# Local Hardhat network only: deploys TokenpingPaywallLocal with a mock USDC
yarn deploy --network hardhat --deploy-mode local

# Ethereum Mainnet or Arbitrum One: deploys TokenpingPaywallProduction
yarn deploy --network arbitrum --deploy-mode production
```

Production deploys prompt for your password, decrypt `DEPLOYER_PRIVATE_KEY_ENCRYPTED` and use the key only at runtime.
Arbitrum production deploys check that the payment token is Circle's native USDC,
`0xaf88d065e77c8cc2239327c5edb3a432268e5831`.
