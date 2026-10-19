# Data snapshot: aave-liquidation-alert-tools

Every on-chain, web and product figure used in `content/blog/aave-liquidation-alert-tools.mdx` (and its Czech translation
`content/blog/cs/nastroje-pro-upozorneni-na-likvidaci-aave.mdx`), with the call or URL, the block or fetch time, and what
the source said. All times UTC.

- **First check:** 2026-10-14, 23:19 to 23:40, every row on the vendor's own page.
- **Re-check:** 2026-10-15, 00:20 to 00:31, every source URL fetched again; no row's source text had changed overnight.
  Tokenping's own row was updated on 2026-10-16 when it added Aave V4 and every Aave V3 market.
- **Refresh (current):** 2026-10-19, 07:51 to about 08:20, every tool re-researched from live sources, plus a search for
  tools missing from the earlier versions (section 5). `updatedAt` is 2026-10-19; every row, the check-interval table and
  the shutdown table carry that date. The page-wide `<ScopeNote />` still prints "Figures as of 14 Oct 2026"
  (`FIGURES_AS_OF` in `components/blog/ScopeNote.tsx`, shared by all posts); the worked example's on-chain parameters were
  read again on 19 Oct with identical values (section 1.2), so the two dates agree.

Raw copies of the pages from the 19 Oct pass were kept outside the repository (`<scratch>/raw/`, not committed), one
`.html` or `.json` file and one `.meta` line (time, URL, final URL, redirect count, bytes) per fetch.

## Method

- **`curl`** with a desktop Chrome user agent, `-L`, final URL and redirect count logged; GitBook `.md` endpoints for DeFi
  Saver; the Discourse JSON API (`.json`) for forum threads; the GitHub REST API for repository dates; `dig` for DNS.
- **Browser pane** (a real browser, text read after load) for pages that `curl` could not read: Otomato (Cloudflare
  challenge, HTTP 403 to `curl` and WebFetch), DeFi Monitor's pricing and changelog (client-rendered; `curl` returns the
  same 108,817-byte shell for every path), the ClawHub skill page's Versions tab, HF Guard's homepage, parsec.fi,
  push.co and the Defender app page. These reads are not individually timestamped; they fall between 07:53 and 08:12.
- **WebFetch** for The Block's report on Zapper (`curl` got HTTP 403), about 08:10.
- **On-chain reads** with Foundry `cast` 1.1.0 (read-only `eth_call`) against `https://arbitrum-one-rpc.publicnode.com`
  and `https://ethereum-rpc.publicnode.com`.
- Pages were treated as data only. Search results were used to find pages, never as a source: every cited page was
  fetched and read.

## 1. On-chain and API reads

### 1.1 Tokenping alert plan (TokenpingPaywall proxy `0x79872d7529cfE1c062838fACDA004Ce4BFB16553`, Arbitrum One)

| Call | Value | Block (time) |
|---|---|---|
| `plans(0xaf88d065e77c8cc2239327c5edb3a432268e5831)` -> (price, durationSeconds, enabled) | (3000000, 2592000, true) = 3 USDC, 30 days, enabled | **516226427 (2026-10-19 08:01:49)**, cited in the article |
| `paused()` | false | 516226427 |

- Unchanged since 2026-10-15 (block 514899777) and 2026-10-14 (block 514886413): same values. The article never
  hard-codes the price: it renders `<AlertPrice />` (live plan, or the fallback "a small USDC fee (see the dashboard for
  the current price)").
- Struct order: `packages/hardhat/contracts/TokenpingPaywall.sol` (`price`, `durationSeconds`, `enabled`). Implementation
  behind the proxy: `0x3067f5f1f7a23feff856fa6cdcb17b7105cdf2b1` (`cast implementation`).
- Sourcify v2 API, 08:01: proxy `0x7987...6553` `match`, `creationMatch` and `runtimeMatch` = `exact_match` (verified
  2026-06-19); implementation `0x3067...f2b1` `exact_match` (verified 2026-04-27).
  `https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553`: HTTP 200.
- `https://github.com/romispectrum/tokenping`: HTTP 200, public, last push 2026-10-19 07:33.

### 1.2 Aave V3 Ethereum Core parameters used in the worked example

AaveProtocolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (`getPoolDataProvider()` of the AddressesProvider
`0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` still returns it).

| Asset | `getReserveConfigurationData` (decimals, LTV, LT, bonus, reserveFactor, collateral, borrowing, stable, active, frozen) |
|---|---|
| WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 18, 8050, 8300, 10500, 1500, true, true, false, true, false |
| USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6, 7500, 7800, 10450, 1000, true, true, false, true, false |

- First read at block **26194044** (2026-10-14 23:31:11), the block printed in the article. Read again at block
  **26225316** (2026-10-19 08:05:59): identical configuration for both assets, also printed in the article.
- `LiquidationLogic.sol` (aave-v3-origin `main`, raw file fetched 2026-10-19 08:06): `DEFAULT_LIQUIDATION_CLOSE_FACTOR
  = 0.5e4`, `CLOSE_FACTOR_HF_THRESHOLD = 0.95e18`, `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8`, `MIN_LEFTOVER_BASE =
  MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD / 2`; the 50% cap applies when both reserves are at least the threshold and
  `healthFactor > CLOSE_FACTOR_HF_THRESHOLD` (lines 260-265 and 43-64).
- Aave V4 "liquidates toward a target health factor": Aave Pro page ("Target Health Liquidations"), section 4.

### 1.3 Worked arithmetic (unchanged, re-computed)

- HF at ETH $1,420: 10 x 1,420 = 14,200; 14,200 x 0.83 = 11,786; 11,786 / 12,000 = 0.98217 -> **0.982**.
- Close factor: HF 0.982 > 0.95, collateral reserve $14,200 >= $2,000, debt reserve $12,000 >= $2,000 -> 50% of total
  debt = **6,000 USDC**. Anti-dust: leaves $6,000 debt and $7,900 collateral, both >= $1,000.
- Collateral seized: 6,000 x 1.05 = **$6,300**; borrower's cost = **$300**.
- DeFi Saver minimum: $12,000 debt < $30,000 (Ethereum) -> can't be enabled; >= $500 (Arbitrum, Optimism, Base) ->
  clears.
- DeFi Saver fee **rate** illustration: per $1,000 of WETH sold for USDC (not a correlated pair), 0.25% x 1,000 = $2.50
  swap fee + 0.05% x 1,000 = $0.50 automation fee = **$3.00**, plus gas, plus Aave's 0.09% flash-loan fee only when
  zero-fee flash-loan sources lack liquidity (fees page, section 4).
- **Not computed on purpose:** the size of a Liquidation Protection repay. DeFi Saver's ratio page defines Safety Ratio
  with the collateral factor (= LTV), not the liquidation threshold, so the 105% trigger can't be mapped to a health
  factor from DeFi Saver's pages.
- Checks per day: 1,440 / 5 = 288; 1,440 / 60 = 24; 1,440 / 360 = 4.

### 1.4 Aave V4 Spokes (Aave's V4 API, `https://api.v4.aave.com/graphql`, 2026-10-19 08:06)

- `chains(request:{query:{filter: ALL}})` -> Ethereum (1), Avalanche (43114), OP Mainnet (10), Arc (5042), Base (8453).
- `spokes(request:{query:{chainIds:[1,43114,10,5042,8453]}})` -> **20 Spokes**: Ethereum 13, Avalanche 3, Arc 3, Base 1;
  none on OP Mainnet. Names and addresses match `AAVE_V4_SPOKES` in `config/aaveConfig.ts` one for one (Ethereum: Main,
  Bluechip, Ethena Correlated, Ethena Ecosystem, Etherfi, Forex, Gold, Kelp, Lido, Lombard, Maple SyrupUSDG, PAXG Gold,
  USDG Pendle; Avalanche: Main, AVAX Correlated, Forex; Arc: Main, Forex, Maple SyrupUSDC; Base: Coinbase Stocks).

### 1.5 Aave V3 markets (Aave address book, 2026-10-19 08:07)

- GitHub API listing of `src/` in the Aave address book (repository moved to `github.com/aave-dao/aave-address-book`,
  latest release 4.74.2 at 2026-10-19 00:32): 35 `AaveV3*` files. The 24 mainnet entries Tokenping reads (Ethereum, Lido
  = Prime, EtherFi, Horizon, Polygon, Arbitrum, Optimism, Base, Avalanche, Gnosis, Metis, BNB, Scroll, ZkSync, Linea,
  Sonic, Celo, Soneium, Plasma, InkWhitelabel = Ink, MegaEth, Mantle, XLayer, Monad): the `POOL` and
  `AAVE_PROTOCOL_DATA_PROVIDER` addresses in each file equal the addresses in `AAVE_MARKETS` for **24 of 24** markets.
- The listing also holds `AaveV3Harmony` and `AaveV3Fantom`, which Tokenping does not read, plus testnets and
  `AaveV3InkSepolia`, `AaveV3BaseSepolia(Lido)`, `AaveV3FantomTestnet`, `AaveV3Fuji`, `AaveV3Sepolia`, `AaveV3OptimismSepolia`,
  `AaveV3ArbitrumSepolia` (ignored).
- **Harmony and Fantom:** Aave governance forum, "Aave V3 Harmony - Freeze Reserves" (2022-07-13, asks the Aave Guardian
  to freeze all reserves; a December 2022 reply describes what a freeze allows) and "[ARC] Aave V3 Fantom - Freeze
  reserves" (2022-08-02; vote closed 2022-08-12; the Aave Guardian confirmed on 2022-09-16 that it approved the freezing
  transaction, "allowing only for withdrawals, repayments, and liquidations"). The README and the comment above
  `AAVE_MARKETS` name only Harmony as left out; Fantom's frozen market is not read either (section 6).

## 2. Tokenping row (product facts)

Source: this repository at commit `1d27695` (main), read 2026-10-19; every item below was checked in code.

- **Markets:** 24 Aave V3 markets on 21 networks (`AAVE_MARKETS`: Ethereum x4 = Core, Prime, EtherFi, Horizon; Polygon,
  Arbitrum, Optimism, Base, Avalanche, Gnosis, Metis, BNB Chain, Scroll, ZKsync, Linea, Sonic, Celo, Soneium, Plasma, Ink,
  MegaETH, Mantle, X Layer, Monad) and 20 Aave V4 Spokes (`AAVE_V4_SPOKES`). One alert per (wallet, chain, market).
- **Check every 5 minutes:** `vercel.json` `"schedule": "*/5 * * * *"`, `NOTIFICATION_CHECK_INTERVAL_MINUTES = 5`. Configs
  are processed one after another (`runNotificationCheck`). It alerts on every run while `healthFactorValue <
  threshold`; there is no stored state, so no "recovered" message and no de-duplication.
- **Threshold:** `HEALTH_FACTOR_THRESHOLD_MIN = 1.1`, `MAX = 10`, default `1.5` (`constants/notifications.ts`).
- **Channels:** `NOTIFICATION_SERVICES = ["email", "signal", "telegram"]`. Telegram: the person types their username into
  the alert and presses Start once in the bot; alerts go to the chat that pressed Start (`getDeliverableChannels`,
  `telegram_chats`). Bot commands: `/start`, `/stop`, `/help` (`app/api/telegram/bot.ts`). A dead chat is removed on
  `bot_blocked` or `chat_not_found`.
- **Send test:** `TestSendButton` per channel in the alert summary; one test per wallet and channel every
  `TEST_SEND_COOLDOWN_MINUTES = 15` (enforced by the database function `claim_notification_test_send`).
- **Language per channel:** `docs/i18n.md`: `email_locale`, `signal_locale`, `telegram_locale`, falling back to `locale`;
  English or Czech.
- **Sign-in:** `app/api/auth/*` and `services/auth/*`: wallet signature (SIWE-style message, no transaction, no gas);
  session cookie `__Host-tokenping-session`, 7 days, plus a five-minute nonce cookie while signing in (`services/api/
  server/session.ts`). The privacy copy (`i18n/messages/privacy.ts`): no tracking or advertising cookies; the two sign-in
  cookies; theme, wallet connection and signed-in wallets in local storage. Alert routes act for the session wallet only
  (`AGENTS.md`, "API routes and the database"), so the row says "watches the signed-in wallet only".
- **Payment:** exact-amount USDC `approve` plus `pay` on Arbitrum; no approvals on Aave; the dashboard needs no payment.
- **Beta:** README line 13; no published uptime figures or user counts.
- **Production site observations (tokenping.xyz, 2026-10-19 08:02):** the homepage, `/aave` and `/privacy` already name
  Signal, Telegram and email, but the homepage FAQ still says "until wallet signatures are checked" and the privacy page
  describes no sign-in cookies, so production was running a build older than main's wallet sign-in. And
  `GET /api/telegram/status?username=alice_example` answered HTTP 500 `{"error":"Could not check the Telegram username"}`
  for a valid username (a malformed one gives the expected 400). The article describes the code on main, which is what
  ships with it; see section 6.

## 3. Competitor and tool rows (checked 2026-10-19)

"Same" means the text matched the 15 Oct row as printed in the earlier version of this log; "changed" is described.

| Row | URL(s) fetched | Time (UTC) | What the page said (short quotes or close paraphrase) |
|---|---|---|---|
| Aave app / Aave Pro | `https://aave.com/help/borrowing/liquidations`, `https://aave.com/pro`, `https://aave.com/app`, `https://status.aave.com/`, `https://aave.com/push` (404; "Push" in the nav links to push.co) | 07:51:38; 08:03:41; 08:04:07 | Same. Help: "Regular monitoring of this metric is essential"; "Tools for Managing Health Factor (Use at your own risk)": DeFi Simulator, DeFi Saver; no mention of notifications on the help, Pro or App pages. Pro: "Each market maintains its own health factor"; "Target Health Liquidations". The Aave App page is a savings app ("The World's Savings App", early access on iOS). The status page lists "Aave App" and "Aave Push" as services. push.co (read in the browser pane) is Aave Labs' euro to stablecoin on-ramp, not an alert service |
| Otomato | `https://otomato.xyz/protocols/aave`, `https://otomato.xyz` (browser pane); `https://apps.apple.com/us/app/otomato-defi-alerts/id6759802179` (redirects to `.../otomato-wallet-tracker/id6759802179`); `https://play.google.com/store/apps/details?id=com.otomato.app` | about 07:53; 08:04:47 | Aave page same: "supports Aave V3 deployments on Ethereum, Arbitrum, Base, Polygon, Avalanche, and Monad. No wallet connect required, just paste your address"; FAQ: default health factor alert 1.2, per-position override; core Aave monitoring costs nothing (the page's own word, reported as "at no charge"), "Future premium features will cover ... multi-wallet portfolios beyond the [no-cost] limit and overnight phone-call escalations". **New/changed:** homepage FAQ "You can monitor up to three wallets at no cost"; "Via our native mobile app on iOS and Android, or via Telegram"; "We don't ask for KYC, email, or personal data". App Store: "Otomato: Wallet Tracker", version 1.0.24 dated 2026-09-25 (1.0.23 Sep 9, 1.0.22 Sep 1), seller a company. V4 not mentioned on the Aave page |
| HF Guard (new) | `https://hfguard.app/` (curl and browser pane), `/privacy`, `/terms`, `/dashboard` (redirects to `/login`) | 07:59:27 to 07:59:59 | "Beta"; "Continuous Health Factor monitoring across Aave V3/V4, Compound, Morpho, Fluid, Euler, Jupiter Lend and Kamino Lend"; "Aave V3 23 networks Live", "Aave V4 Ethereum + Avalanche + Arc Live"; network sample list includes Gnosis; "Do I need to connect my wallet? No. Just paste your public wallet address"; "HF Guard works in read-only mode"; alerts: "when your position enters a different risk level", "can also notify you when Health Factor crosses ... 2.0, 1.9, 1.8, 1.7 and 1.6", "Alerts are best-effort and may be delayed"; "How often are positions checked? Positions are checked periodically"; "Telegram control loop: ... lightweight wallet actions, refreshes and best-effort risk alerts while web stays the primary console"; cost: the FAQ says it is currently no-charge during the beta (reported as "costs nothing during the beta"). Terms (April 2026): "HF Guard monitors DeFi lending positions and sends Health Factor alerts"; privacy: collects Telegram user ID, wallet addresses and preferences. Login page: email and password, or Connect Wallet. No email channel named |
| DeFi Saver Notify | `https://help.defisaver.com/features/notify.md`, `/features/notify/use-case.md`, `/features/notify/how-do-i-set-up-notify.md`, `/features/notify/telegram-bot-for-monitoring-your-position.md` | 07:51:38 | Same. "available on Ethereum Mainnet, Arbitrum, Base and Optimism"; Aave, Liquity, Maker, Compound, Smart Wallet or EOA; "in-app notifications by default, while email, Blockscan chat and Telegram can be enabled"; ratio monitor both directions; Aave v3 supply-cap monitor; no price. Telegram bot page: "monitor your lending positions through Telegram", "Setting up health-factor alerts through the bot", "Currently available for Mainnet, Base, Arbitrum, and Optimism" |
| DeFi Saver Automation: fees | `https://help.defisaver.com/automations/fees.md`, `/general/what-is-defi-saver/defi-saver-fees.md` | 07:51:38 | Same as 15 Oct. 0.25% / 0.1% (ETH to wstETH) / 0.01% (stablecoin pairs) swap fee, 0.05% per triggered automation, no fee to keep enabled, Aave flash loan 0.09% when zero-fee sources lack liquidity |
| DeFi Saver Automation: requirements | `https://help.defisaver.com/automations/requirements-for-using-automation.md` | 07:51:38 | Same. "Smart Wallet - except for Aave v3 and Compound v3, where automations are available for EOA wallets"; "Minimum $30,000 in debt for Aave v3 and Aave V4 on Mainnet", "Minimum $500 in debt for Aave v3 on Arbitrum, Optimism and Base"; stops executing at "$5,000 and below on Ethereum", "$500 and below on Arbitrum, Base and Optimism". An older page (`/protocols/aave-v3/how-does-aave-automation-work.md`) still says $15,000 on Mainnet and Optimism/Arbitrum only; the article follows the requirements page |
| DeFi Saver Automation: compatibility | `https://help.defisaver.com/automations/compatibility.md`, `/protocols/aave-v3/compatibility-and-automations.md`, `/general/compatibility/supported-chains-and-protocols.md`, `/protocols/aave-v4/what-defi-saver-features-are-not-yet-available-on-aave-v4.md` | 07:51:38; 07:52:17 | **Changed:** compatibility page: "No automations available for Aave on Linea and Plasma"; V3 page's table: Ethereum, Arbitrum, Optimism, Base yes, Linea and Plasma no; supported chains: Ethereum, Arbitrum, Optimism, Base, Linea, Plasma. Liquidation Protection and Automated Leverage Management yes for Aave v4 and v3 Core, no for v3 Prime and EtherFi; "All other automations are **not** available for positions that have more than one collateral or debt asset". V4 page: "Automations (for Smart Wallet poistions)" and "Our goal is to also ensure all of our tools, including Automations, are available for EOA positions shortly" |
| DeFi Saver Automation: Liquidation Protection, Automated Leverage Management, EOA page, ratio definitions | `/automations/liquidation-protection.md`, `/automations/automated-leverage-management.md`, `/general/compatibility/wallet-compatibility/what-features-do-eoa-wallets-have-access-to.md`, `/features/defi-saver-dashboard/health-safety-and-collateral-ratio.md` | 07:51:38 | Same. "Minimum threshold per-protocol: Aave v3 - 105%, Aave v4 - 110%"; "put the Safety Ratio up by 5%"; "maintained at a 110% Safety Ratio no matter how many times it falls below 105%"; Automated Leverage Management "Input the ratio that you'd like to keep your position at"; EOA page: Aave and Spark users on an EOA can use automations except Collateral Switch; Safety Ratio = collateral x collateral factor / debt |
| Ava | `https://avaprotocol.org/protect/aave-position`, `/docs/using-ava/risk-alerts`, `/docs/start-here/pricing`, `/docs/start-here/supported-chains`, `/docs/start-here/faq`, `/docs/using-ava/managing-notifications`, `/docs/safety/permissions-and-limits`, `/docs/use-cases/watch-aave-positions`, `/docs/use-cases/dont-get-liquidated` | 07:51:38 to 08:01:38 | Same. Telegram first; "Start read-only with just a wallet address in Telegram - no signing for analysis"; Email, Discord, Telegram, Slack toggles in Ava Studio; Auto "checks your position every hour"; "Spending limit None by default", "Expires After 365 days"; "After a repay, you get an email summary"; pricing: the page says Ava is at no charge today ("No deposit, no subscription, and nothing is charged"; reported as "nothing is charged today"), "This is the direction we're exploring with early users - not what's live", "A small fee only on value-creating actions", "No fee for monitoring, for warnings"; chains Ethereum and Base, Aave v3; no beta wording found on the pages read |
| DeFi Monitor | `https://defi-monitor.com` (curl), `/pricing` and `/changelog` (browser pane) | 07:51:38; about 07:54 | **Changed:** homepage "Health Factor: Aave V3 & Spark liquidation risk on Ethereum & Arbitrum", "Beta", "Telegram & Discord", "Non-custodial Read-only"; FAQ "Sign in with email, add your wallet address"; "Checks run continuously"; FAQ says there is a no-cost tier for early users. Pricing page lists only paid plans: Pro $4.99/month or $49.99/year, 10 addresses, 20 subscriptions; Ultra $9.99/month or $99.99/year, 30 addresses, 60 subscriptions, advanced notifications. Changelog: latest entry 2026-03-22 (Morpho Blue), 2026-03-09 (Compound V3, notification cooldowns), 2026-02-20 (Aave V3 events trigger checks), 2026-02-13 (Discord), 2026-02-04 (magic-link sign-in), 2026-01-30 (Aave health factor alerts). No Aave V4 entry |
| Aave Monitor | `https://chromewebstore.google.com/detail/aave-monitor/ccifbkellmfcbdngdnjimmfkclagbdii`; `https://governance.aave.com/t/aave-monitor-browser-extension/21223.json`; `https://blog.notrustverify.ch/monitor-aave-onchain-data-with-ios-widgets`; GitHub API `notrustverify/aave-monitor` | 07:51:38; 08:09:04; about 08:13 | **Changed:** store: version 2.11.1, updated **February 24, 2026** (the earlier version printed Feb 25); forum post 2026-02-24 "Added Mantle ... MegaETH"; repository last push 2026-02-24 17:37. Badge colours, multiple markets and addresses, "No wallet connect, no signing". Widgets post: "default refresh interval is set to 60 minutes, but it will be automatically reduced based on Health Factor risk". Not used: a post in the other extension's thread says Aave Monitor returns "Failed to fetch" for many addresses and supports only V3 (an unverified claim by a competitor) |
| Aave DeFi Watcher | `https://chromewebstore.google.com/detail/aave-defi-watcher/cpglkdkkmocpbbndolclhdmghjdcngdj`; `https://aavewatcher.com`; forum thread 25282 `.json` | 07:51:38; 07:56:20 | Store: version 1.0.0, updated July 27, 2026, "Supports Aave V3 and V4 markets", "alerts you only when the risk level worsens". **New from its site:** "Aave V2, V3, and V4 (Main Spoke on Ethereum)"; six chains (Ethereum, Arbitrum, Optimism, Polygon, Base, Avalanche); "Does it support Aave V4? Yes, for the V4 Main Spoke on Ethereum"; "Default polling is every 5 minutes. You can change the interval in Settings"; "OS alerts fire only when risk gets worse - not every poll, not on recovery"; FAQ answers that it costs nothing: "No subscription, no account, no premium tier" |
| Instadapp Protection Automation | `https://guides.instadapp.io/features/protection-automation` | 07:51:38 | Same. "only available for AAVE v.3 on the Polygon and Avalanche Networks"; "Mainnet: a minimum of $15,000", "Polygon: ... $1000", "Avalanche: ... $5000"; "There is a 0.3% - 0.4% fee per automation event"; "Last updated 3 years ago"; losses warning. The Mainnet lines still conflict with the Polygon and Avalanche line |
| Tenderly Alerts | `https://docs.tenderly.co/monitoring/alerts/introduction`, `https://docs.tenderly.co/platform/supported-networks` | 07:51:38 | Same. "Alerts are available on the paid plan. ... contact our sales team"; 8 destination types incl. Email, Slack, Telegram, Discord, Webhooks, Sentry, PagerDuty; State Change and View Function triggers. Networks page (embedded data): `{"slug": "gnosis-chain", ... "isMonitoringEnabled": true}`; 95 networks true, 2 false. `tenderly.co/pricing` answered HTTP 429, not read |
| KeeperHub | `https://docs.keeperhub.com/plugins/aave-v4` | 07:51:38 | Same. "This plugin currently exposes the Lido Spoke"; "Supported chains: Ethereum"; "Read-only actions work without credentials. Write actions require a connected wallet"; example "Schedule (every 5 min) -> Aave V4: Get User Account Data -> ... Condition (< 1.5) -> Discord: Send Message" |
| OpenClaw skill | `https://clawhub.ai/jgramajo4/skills/aave-liquidation-monitor` (curl and browser pane, Versions tab) | 07:51:38; about 07:57 | Aave V3; "runs automatically every 6 hours (configurable)"; Telegram default, or Discord/Slack; read-only address; "Primary: Ethereum mainnet. Also works ...: Polygon, Arbitrum, Optimism, Base, Avalanche, Gnosis"; Versions tab: v1.0.0 and v1.0.1 both 11/02/2026 (11 Feb 2026), "Last updated 5mo ago", license MIT-0; SKILL.md "Last Updated: 2026-02-11" |
| Chainlink CRE template | `https://docs.chain.link/cre-templates/automated-liquidation-protection` | 07:51:38 | Same. "Automatically protect DeFi lending positions"; "Confidential Workflows is in private beta"; an LLM selects defensive actions; no lending protocol or network named |
| Reactive Network (new) | `https://blog.reactive.network/aave-unified-protection-multi-strategy-automated-liquidation-defense-with-reactive-smart-contracts/` | 07:58:36 | Blog post dated Oct 14, 2025: "Aave Unified Protection", collateral deposit, debt repayment or combined strategies, "CRON events" checking subscribed users. All deployment commands use `$SEPOLIA_RPC`; "Supported Assets (Aave V3 Sepolia)". No mainnet deployment found, so the article calls it a developer example for the Sepolia testnet |
| HAL (dead) | `https://github.com/aave/interface/pull/2084`; `dig hal.xyz A/AAAA`, `dig app.hal.xyz`; forum thread 17123 `.json` | 07:55:35; about 08:05; 08:03:41 | PR "chore: remove hal", merged May 30, 2024, "Removes Hal integration since the service is shut down". DNS: `hal.xyz` has Cloudflare name servers but no A or AAAA record; `app.hal.xyz` no record (the article says "no address record in DNS"). Forum thread (2024-03-27): HAL "is shutting down its services on June 1st, 2024" |
| Aave Alarm (dead) | `https://github.com/thegodfatherbeeearth/aavealarm`; GitHub API | 07:55:35; 08:04:47 | README: "Due to Aave Grants shutting down and the developer of this app having issues with Google Play and App Store, it's no longer possible to download the app"; Apple removed the developer account; last commit 2024-11-28 ("Update README.md"); repository not archived |
| Summer.fi (dead) | `https://summer.fi`; `https://summerfi.beehiiv.com/p/whats-better-summer-month-c62a`; ForkLog `https://forklog.com/en/summer-fi-to-shut-down-interface-following-6-million-hack/` | 07:55:35; 08:11:23 | summer.fi: "Summer.fi is winding down. The Summer.fi app has now been deactivated. While the Lazy Summer Protocol is currently in withdraw only mode ..." (its link to a blog post on `blog.summer.fi` fails TLS verification - certificate for another host - so it was not read and is not cited). Newsletter 2024-03-07: "Stop-Loss is also now available on Aave for ALL networks"; Trailing Stop-Loss. ForkLog 2026-07-16: team post of 2026-07-15 "recent exploit on the Lazy Summer Protocol has forced us into the very difficult decision to wind down", $6.04 million, UI "accessible until August 31" |
| DeFi Notifications app (stale) | `https://apps.apple.com/us/app/defi-notifications/id1588243632` | 07:55:35 | Same. Seller Hexa Foundation; listed at no charge, iPhone, "get notified when position health is low"; version 1.1.20 dated Mon Oct 21 2024; 3 ratings |
| OpenZeppelin Defender | `https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender`; `https://defender.openzeppelin.com` (curl and browser pane) | 07:55:35; 08:04:47; about 08:12 | Announcement same: "June 30, 2025: As of today, new user sign-ups have been disabled. July 1, 2026: The Defender platform will officially retire". The app URL returns an empty "Defender" page (HTTP 200, no body text), which neither confirms nor rules out the retirement; a search found no later notice. The article says "scheduled to retire ... has passed ... we found no later notice" |
| Zapper (not an alert tool) | `https://cryptobriefing.com/zapper-shuts-down-defi-dashboard-2026/`; The Block (WebFetch); `https://zapper.xyz` (curl 403 and browser pane Cloudflare challenge) | 07:55:35; about 08:10 | Crypto Briefing (2026-07-08): the CEO announced on July 8, 2026 that the platform will cease operations on August 3, 2026. The Block (2026-07-08 dateline): "The main zapper.xyz website, the mobile apps, and the API services" close; August 3. The company's own site could not be read, so the article attributes the closure to the two news reports. No Aave health factor alert was found for it |
| User-voice threads | `https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067.json`; `https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379.json` | 08:14:48 | Same. Polygon (2021-05-18): repay attempted at HF 1.01, repeated JSON errors, liquidated. Aave forum (2024-12-23): "for one hour+ I've been trying to repay", then liquidated |

## 4. Aave Pro and V4 details used

- Aave Pro page (07:51:38): "Aave V4 organizes lending into eleven markets, grouped under three Hubs" (the interface's markets; Tokenping reads all 20 Spokes that the API lists, section 1.4); "Each market maintains its own health factor"; "Target Health Liquidations: Restore to a target health factor - not a fixed close" (paraphrased with a plain hyphen in the article's wording "toward a target health factor").
- Aave help page: close factor text matches the code constants in section 1.2 ("Up to 50% ... above 0.95 AND both ... at least $2,000").

## 5. Tools searched for and not listed

Searches (WebSearch, standard and extended modes, 07:5x to 08:1x) for Telegram, Discord, email, push and Signal bots and
dashboards for Aave health factor, Aave V4 alert tools, new 2026 launches, and the named candidates. Findings:

| Candidate | What was found | Listed? |
|---|---|---|
| HF Guard | Live beta, Telegram bot and web dashboard, Aave V3 and V4 | Yes (new row) |
| Reactive Network "Aave Unified Protection" | 2025 blog post, Sepolia deployment steps | Yes, in the developer section |
| DeBank | `debank.com` home and docs searches: lending profiles show a "Health Rate"; no documented alert for it; the "stream" notifications are for official accounts | No |
| Zerion | A 2019 blog post on push notifications (CDP liquidation risk for MakerDAO); current pages describe position-change alerts in Premium and transaction webhooks; no Aave health factor alert documented | No |
| Parsec | `parsec.fi` returns "Site not found" (a Netlify error page) in the browser pane; a search result quoted its homepage as offline | No |
| Push Protocol (formerly EPNS) | Blog posts from the EPNS era describe an Aave channel; the blog index's newest entry is the 2024 year in review; no current Aave channel page found | No |
| Notifi | Docs describe alert filters including lending health events for BENQI and Delta Prime; no mention of Aave in the docs pages fetched (`for-users`, `alerts-in-depth`) | No |
| Chaos Labs risk dashboard | 2023 post: live alerts on the Aave V3 risk dashboard to Telegram and Slack for market indicators (prices, liquidations, utilization), not a personal position monitor | No |
| Instadapp / Gelato | Instadapp row stays (guide last updated about 3 years ago). Gelato's Aave protection connector appears in Instadapp's developer docs (DSA connector); the Cono Finance site no longer resolves | No new row |
| Tenderly, Chainlink Automation | Tenderly row stays; the Chainlink Automation result was a hackathon project on a testnet | No new row |
| Aave's own interfaces | No notification feature found on the help, Pro or App pages; Aave Labs "Push" is a fiat on-ramp | Row unchanged |
| Other search hits | An Apify liquidation-event feed (market events, not a position monitor), a hackathon Telegram bot for Aave and Compound, an AI market-risk API (RiskState), calculators (`aavehealth.org`, Otomato's calculators), an MCP server with a V3 risk module | No |

## 6. Corrections against the 15 and 16 Oct version

1. **Fantom:** the 16 Oct text said Tokenping reads every Aave V3 market on a mainnet except Harmony's. The address book
   also lists a Fantom V3 market, frozen by the Aave Guardian in September 2022, which Tokenping does not read. The
   article now says "not the frozen Harmony and Fantom markets". (`README.md` and the comment above `AAVE_MARKETS` in
   `config/aaveConfig.ts` still name only Harmony: left untouched here.)
2. **Telegram:** Tokenping now sends alerts on Signal, Telegram and email. The content lint's rules that banned naming
   Signal together with Telegram, the "[Telegram variant]" placeholder wording and the phrase "Telegram alerts" until the
   bot was live were relaxed (`content/blog/content.test.ts`; the placeholder rule stays). The "better choice" bullet
   "You want alerts on Telegram" and the MDX comment about switching it on were removed.
3. **Gnosis:** the claim that none of Otomato, DeFi Saver Notify, DeFi Monitor or Ava list Gnosis, and so Tokenping
   fits Gnosis borrowers, was removed: HF Guard's network list includes Gnosis.
4. **Aave DeFi Watcher:** interval (5 minutes by default) and V4 scope (Main Spoke on Ethereum only; V2, V3 and V4) from
   its own site; the earlier row said "Aave V3 and V4 markets" and "Not stated" for the interval.
5. **Aave Monitor:** update date 24 Feb 2026 (store and repository), not 25 Feb.
6. **Otomato:** three-wallet allowance; iOS app version and date; listing name.
7. **DeFi Monitor:** pricing page limits; changelog's last entry; no-cost tier not on the pricing page.
8. **DeFi Saver:** no Aave automations on Linea or Plasma; V4 automations for Smart Wallet positions only, EOA support a
   stated goal; Telegram bot page (health-factor alerts through the bot). The "Three tools can repay" sentence now says
   "ready-made services", since KeeperHub's write actions and Reactive's example can also repay.
9. **Shutdowns:** Summer.fi cause and dates (ForkLog); Zapper second source (The Block) and the removal of the earlier
   claim that Zapper "was a portfolio tracker without position-risk alerts" (not verifiable: its site is behind a bot
   check); Defender's 1 Jul 2026 date has passed with no notice found; HAL's DNS wording changed from "no longer
   resolves" to "no address record in DNS"; Aave Alarm's last commit date added.
10. **OpenClaw:** "updated 11 Feb 2026" is now "released 11 Feb 2026" (the page's own "Last updated" line is 2026-02-11
    in SKILL.md, the Versions tab shows 11/02/2026 for both versions, and the page header says "5mo ago").
11. **Method section:** shutdown sources now three (HAL code change, Zapper news, Summer.fi cause news); added the
    statement that some pages were read in a browser, that the Telegram bot was read in code only, and the list of
    candidates searched for without finding documented Aave health factor alerts.

## 7. Not stated by vendors (shown as "Not stated" or "neuvedeno" in the article)

- DeFi Saver Notify price and Aave V4 coverage.
- Check intervals for Otomato, DeFi Saver Notify, DeFi Monitor (only "checks run continuously") and HF Guard ("checked
  periodically").
- Aave Monitor's supported Aave protocol version(s).
- Instadapp channels and current availability.
- Chainlink CRE template's protocols and networks.
- Any minimum position size for Ava.
- HF Guard's price after the beta; whether its Aave V4 coverage reads every Spoke on its three networks.
- DeFi Monitor's Aave V4 support.

## 8. Open items for the owner (found during this pass, not changed here)

- **Production Telegram check:** on 2026-10-19 08:02 `GET https://tokenping.xyz/api/telegram/status?username=alice_example`
  returned HTTP 500 with "Could not check the Telegram username" (the route turns a failed database lookup into a 500).
  The article describes Telegram as working because the code on main does; verify the bot end to end on production
  before promoting the post.
- **Production build is behind main** on wallet sign-in (see section 2). The article's Tokenping row describes main.
- **README and `config/aaveConfig.ts`** say Harmony is the only V3 market left out; Fantom is also left out (section 1.5).
- **Other posts** (`aave-health-factor-alert-setup`, `aave-health-factor`, `how-aave-liquidation-works` and their
  translations) and their snapshots still name Signal and email only.
- **`FIGURES_AS_OF`** (shared scope note) still reads 2026-10-14.
- `blog.summer.fi` serves a TLS certificate for another host; Summer.fi's own announcement could not be read.

Re-check every row within 7 days before any republish, and quarterly (marketing plan section 3.7). Change the visible
dates only when rows are re-checked.
