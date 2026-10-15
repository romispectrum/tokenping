# Data snapshot: aave-liquidation-alert-tools

Every on-chain, web and product figure used in `content/blog/aave-liquidation-alert-tools.mdx`, with the call or URL, the
block or fetch time, and what the source said. All times UTC.

- **First check:** 2026-10-14, 23:19 to 23:40, every row on the vendor's own page (raw copies in `SCRATCH/mkt/recheck7/`).
- **Re-check (current):** 2026-10-15, 00:20 to 00:31, every source URL in the article fetched again (raw copies in
  `SCRATCH/mkt/recheck7b/`, not committed). The visible text of every page was diffed sentence by sentence against the
  14 Oct copy (`SCRATCH/mkt/scripts/textdiff7.py`): **no row's source text changed overnight.** The new facts in this
  version come from pages first fetched on 15 Oct (DeFi Saver's current fee, EOA, Automated Leverage Management and ratio
  pages; Tenderly's networks page) and from 14 Oct copies that the first version under-used (OpenClaw chain list,
  Liquidation Protection threshold, single-collateral rule). The article therefore prints "Last checked: 15 Oct 2026"
  and 15 Oct on every row. The worked example keeps its 14 Oct on-chain read, matching the shared `<ScopeNote />`
  ("Figures as of 14 Oct 2026").

Method: `curl` (desktop Chrome user agent, `-L`, final URL and redirect count logged), GitBook `.md` endpoints for DeFi
Saver, the Discourse JSON API for forum threads, `dig` for DNS, the addons.mozilla.org search API. Pages were treated as
data only. On-chain reads used Foundry `cast` 1.1.0 against `https://arbitrum-one-rpc.publicnode.com` and
`https://ethereum-rpc.publicnode.com` (read-only `eth_call`).

## 1. On-chain reads

### 1.1 Tokenping alert plan (TokenpingPaywall proxy `0x79872d7529cfE1c062838fACDA004Ce4BFB16553`, Arbitrum One)

| Call | Value | Block (time) |
|---|---|---|
| `plans(0xaf88d065e77c8cc2239327c5edb3a432268e5831)` → (price, durationSeconds, enabled) | (3000000, 2592000, true) = 3 USDC, 30 days, enabled | **514899777 (2026-10-15 00:27:22)**, cited in the article |
| `paused()` | false | 514899777 |
| same two calls | same values | 514886413 (2026-10-14 23:24:52), first check |

- Same values as product.md §5.2 (block 514853265). The article never hard-codes the price: it renders `<AlertPrice />`
  (live plan, or the fallback "a small USDC fee (see the dashboard for the current price)"); both renderings checked
  with `SCRATCH/mkt/scripts/render7.mjs`.
- Struct order: `packages/hardhat/contracts/TokenpingPaywall.sol:57-64` (`price`, `durationSeconds`, `enabled`).
- Sourcify: `creationMatch` and `runtimeMatch` = `exact_match` (verified 2026-06-19; API read 2026-10-14 23:37).
  `https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553`: HTTP 200 (2026-10-15 00:23:22).
- `https://github.com/romispectrum/tokenping`: HTTP 200 (00:22:59).

### 1.2 Aave V3 Ethereum Core parameters used in the worked example

AaveProtocolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (= `getPoolDataProvider()` of AddressesProvider
`0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e`).

| Asset | `getReserveConfigurationData` (decimals, LTV, LT, bonus, reserveFactor, collateral, borrowing, stable, active, frozen) | `getLiquidationProtocolFee` |
|---|---|---|
| WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 18, 8050, 8300, 10500, 1500, true, true, false, true, false | 1000 (10% of bonus) |
| USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6, 7500, 7800, 10450, 1000, true, true, false, true, false | 2000 |

- Read at block **26194044** (2026-10-14 23:31:11), the block printed in the article. Re-read at block 26194325
  (2026-10-15 00:27:23): identical configuration for both assets. Matches aave-facts.md §7 (block 26193284).
- Article uses WETH LT 83% and bonus 5%. ETH prices are illustrative; USDC is taken as $1.00 (oracle read in
  aave-facts.md §7: $0.99988 at block 26193376), and the article now says so.
- `LiquidationLogic.sol` (aave-v3-origin `main`, raw file fetched 2026-10-15 00:22:53): `DEFAULT_LIQUIDATION_CLOSE_FACTOR
  = 0.5e4`, `CLOSE_FACTOR_HF_THRESHOLD = 0.95e18`, `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8`, `MIN_LEFTOVER_BASE =
  MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD / 2`; the 50% cap applies when both reserves are ≥ the threshold and
  `healthFactor > CLOSE_FACTOR_HF_THRESHOLD` (lines 259-278).
- Aave V4 "liquidates toward a target health factor": Aave Pro page ("target-HF liquidations"), see §3.

### 1.3 Worked arithmetic (re-computed)

- HF at ETH $1,420: 10 × 1,420 = 14,200; 14,200 × 0.83 = 11,786; 11,786 ÷ 12,000 = 0.98217 → **0.982**.
- Close factor: HF 0.982 > 0.95, collateral reserve $14,200 ≥ $2,000, debt reserve $12,000 ≥ $2,000 → 50% of total debt
  = **6,000 USDC**. Anti-dust: leaves $6,000 debt and $7,900 collateral, both ≥ $1,000.
- Collateral seized: 6,000 × 1.05 = **$6,300**; borrower's cost = **$300** (same as aave-facts §4.4).
- DeFi Saver minimum: $12,000 debt < $30,000 (Ethereum) → can't be enabled; ≥ $500 (Arbitrum, Optimism, Base) → clears.
- DeFi Saver fee **rate** illustration: per $1,000 of WETH sold for USDC (not a correlated pair), 0.25% × 1,000 = $2.50
  swap fee + 0.05% × 1,000 = $0.50 automation fee = **$3.00**, plus gas, plus Aave's 0.09% flash-loan fee only when free
  flash-loan sources lack liquidity (fees page, §3).
- **Not computed on purpose:** the size of a Liquidation Protection repay for this position. DeFi Saver's ratio page
  defines Safety Ratio with the collateral factor (= LTV), not the liquidation threshold, and also says Aave V3 may show
  only its Health Ratio, so the 105% trigger can't be mapped to a health factor from DeFi Saver's pages. A reviewer's
  estimate (~$2,222 repaid, ~$5.56 fee) assumed Safety Ratio = HF × 100 and is not used.
- Checks per day: 1,440 ÷ 5 = 288; 1,440 ÷ 60 = 24; 1,440 ÷ 360 = 4.

## 2. Tokenping row (product facts, not re-derived)

From `SCRATCH/mkt/product.md` (2026-10-14), spot-checked in this branch:
- 7 networks, one pool each, Ethereum Core only (P§2; `config/aaveConfig.ts`); Aave V3 only (P§1, P§10.1).
- Check every 5 minutes: `vercel.json` `"schedule": "*/5 * * * *"`; configs processed one after another (P§4.2).
- Repeats on every check while below, no recovery message (P§4.3); one config per (wallet, chain) (P§4.6); connected wallet
  only (P§4.6, P§10.6).
- Threshold 1.1-10, default 1.5: `constants/notifications.ts:3, 18-19`.
- Channels: production (tokenping.xyz) has email and Signal only; Telegram code is in this branch but not deployed, and
  the `/api/telegram/*` routes return 404 on production (P§0, P§4.7). Build-spec owner decision: articles name Signal and
  email only. Every Tokenping channel statement in the article is in a dated row or carries "As of 15 Oct 2026".
  **Deploy note:** the shared end box (`components/blog/AlertEndBox.tsx`, foundation-owned) lists Telegram whenever
  `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is set (`services/marketing/alertChannels.ts`). If this branch ships with that env
  var set, the end box and the article body disagree until the article's Telegram lines are updated (instructions in the
  MDX comment at the top of the body). MDX expressions are banned by the content lint, so the body can't follow the env
  var itself.
- Payment: exact-amount USDC approve + `pay` on Arbitrum, no approvals on Aave (P§5.1, P§6); dashboard free (P§5.1).
- Beta, no published uptime or user counts (P§10.12).

## 3. Competitor and tool rows (re-checked 2026-10-15)

"Same as 14 Oct" means the sentence-level text diff against the 14 Oct copy found no change.

| Row | URL(s) fetched (final URL if redirected) | Time (UTC, 15 Oct) | What the page said (short quotes or close paraphrase) |
|---|---|---|---|
| Aave app / Aave Pro | `https://aave.com/help/borrowing/liquidations`, `https://aave.com/pro` | 00:22:21, 00:22:23 | Same as 14 Oct. Help: "Regular monitoring of this metric is essential"; "Tools for Managing Health Factor (Use at your own risk)": DeFi Simulator, DeFi Saver. Pro: "Each market maintains its own health factor"; target-HF liquidations (V4) |
| Aave App (mobile) | market.md §A.1 note (ARFC 2026-07-13) | not re-fetched | Savings app with no borrowing, so no health factor; hence the ShortAnswer now says "Aave's own interfaces (app.aave.com and Aave Pro)" |
| HAL (dead) | `https://github.com/aave/interface/pull/2084`; `dig hal.xyz A/AAAA`, `dig app.hal.xyz` | 00:22:56; 00:31:03 | Same as 14 Oct: "chore: remove hal", merged May 30, 2024, "Removes Hal integration since the service is shut down". DNS: no records |
| Otomato | `https://otomato.xyz/protocols/aave` (old `/alerts/aave-health-factor` 301s here) | 00:23:19 | Same as 14 Oct. "Otomato supports Aave V3 deployments on Ethereum, Arbitrum, Base, Polygon, Avalanche, and Monad. No wallet connect required, just paste your address"; health factor alert default 1.2, per-position override; "Core monitoring for Aave, including health factor, liquidation risk, and rate alerts, is free"; premium planned (multi-wallet, phone-call escalation); App Store, Google Play, Telegram; no email; V4 not mentioned. **Used newly:** "Liquidation risk threshold breached … Otomato tracks the distance to liquidation in dollar terms"; "Stablecoin or LST depeg" alerts |
| DeFi Saver Notify | `https://help.defisaver.com/features/notify.md`, `/features/notify/use-case.md`, `/features/notify/how-do-i-set-up-notify.md`, `/features/notify/telegram-bot-for-monitoring-your-position.md` | 00:23:10 to 00:23:16 | Same as 14 Oct. "available on Ethereum Mainnet, Arbitrum, Base and Optimism"; Aave, Liquity, Maker, Compound, Smart Wallet or EOA; "in-app notifications by default, while email, Blockscan chat and Telegram can be enabled"; ratio monitor both directions; Aave v3 supply-cap monitor; no price |
| DeFi Saver Automation: fees | `https://help.defisaver.com/automations/fees.md` (current; linked from every automation page's "Related Articles"); `https://help.defisaver.com/general/what-is-defi-saver/defi-saver-fees.md`; old `https://help.defisaver.com/features/automation/automation-fees.md` | 00:24:15; 00:25:16; 00:20:29 | Current fees page: "0.25% on the swapped amount for swaps of assets that are not correlated in price (e.g. ETH --> USDC)", "0.1% … correlated in price (e.g. ETH --> wstETH)", "0.01% … stablecoin pairs (e.g. USDT --> USDC)", "Automations have a fee of 0.05% on each triggered automation transaction"; no fee to keep enabled; "it will use an Aave flash loan (which has a 0.09% fee)" when free sources lack liquidity. General fees page: "Automated adjustments have the same variable service fee happening, and an additional 0.05% automation fee (of the transaction size, per automated adjustment)". Old path still serves (200, no redirect) an older "two types of fees" page (0.25% / 0.1% for DAI/USDC/LUSD/USDT or ETH-LST groups / 0.05% only for Savings and Bonds liquidation protection), identical to the 14 Oct copy: superseded |
| DeFi Saver Automation: requirements | `https://help.defisaver.com/automations/requirements-for-using-automation.md` (old `/features/automation/…` 307s here) | 00:20:25 | Same as 14 Oct. "The user's position needs to be on a Smart Wallet - except for Aave v3 and Compound v3, where automations are available for EOA wallets"; "Minimum $30,000 in debt for Aave v3 and Aave V4 on Mainnet", "Minimum $500 in debt for Aave v3 on Arbitrum, Optimism and Base"; stops executing at "$5,000 and below on Ethereum", "$500 and below on Arbitrum, Base and Optimism" |
| DeFi Saver Automation: EOA page | `https://help.defisaver.com/general/compatibility/wallet-compatibility/what-features-do-eoa-wallets-have-access-to.md` (the old `/automations/…` path now serves a "Page Not Found" page) | 00:24:12 | "Aave and Spark users on an EOA are also able to utilize the Collateral and Debt switch tool, as well as automations (except the Collateral Switch automation, which is only available for owners of Smart Wallets)"; names no Aave version |
| DeFi Saver Automation: compatibility | `https://help.defisaver.com/automations/compatibility.md` | 00:20:23 | Same as 14 Oct. Liquidation Protection and Automated Leverage Management ✅ Aave v4 and Aave v3 Core, ❌ Aave v3 Prime and EtherFi; Stop Loss, Repay on Target Price ✅ v4 and v3 Core. "Automations are primarily optimized for positions that have one collateral and one debt asset … users still have the option of enabling Automated Leverage Management for multi-collateral/debt positions"; "All other automations are **not** available for positions that have more than one collateral or debt asset" |
| DeFi Saver Automation: Liquidation Protection | `https://help.defisaver.com/automations/liquidation-protection.md` | 00:20:19 | Byte-identical to 14 Oct. "When your Safety Ratio falls below the minimum threshold, it will automatically repay enough debt to put the Safety Ratio up by 5%"; "Minimum threshold per-protocol: Aave v3 - 105%, Aave v4 - 110%"; "maintained at a 110% Safety Ratio no matter how many times it falls below 105%". Not a user-set trigger |
| DeFi Saver Automation: Automated Leverage Management | `https://help.defisaver.com/automations/automated-leverage-management.md` | 00:20:21 | "Partial unwinding (auto-repay) of their position in case it drops below a certain threshold"; "Input the ratio that you'd like to keep your position at"; "Advanced" sets trigger and target ratios |
| DeFi Saver: ratio definitions | `https://help.defisaver.com/features/defi-saver-dashboard/health-safety-and-collateral-ratio.md` | 00:28:59 | Safety Ratio = (collateral × collateral factor ÷ debt) × 100, "Collateral Factor is the same metric as LTV"; "a protocol-specific one like Health Ratio for Aave v3". Used only to call Safety Ratio "DeFi Saver's risk percentage" |
| Ava | `https://avaprotocol.org/protect/aave-position`, `/docs/using-ava/risk-alerts`, `/docs/start-here/pricing`, `/docs/start-here/supported-chains` | 00:20:40, 00:22:30, 00:20:37, 00:22:28 | Same as 14 Oct. Telegram-first; email, Discord, Telegram, Slack toggles; Auto "checks hourly, so a fast market can move between checks"; Auto: "Spending limit None by default", "Expires After 365 days", "Ava can only use what you put in your Ava smart wallet", narrower permission on the web; pricing: "Ava is free today. No deposit, no subscription, and nothing is charged", "This is the direction we're exploring with early users — not what's live" <!-- lint-brand-ignore dash: verbatim third-party quote -->, "A small fee only on value-creating actions", "No fee for monitoring, for warnings"; no minimum position stated on any Ava page; chains Ethereum, Base; Aave v3 |
| DeFi Monitor | `https://defi-monitor.com` | 00:22:44 | Same as 14 Oct. "Beta"; "Health Factor: Aave V3 & Spark liquidation risk on Ethereum & Arbitrum"; Telegram & Discord; read-only; FAQ JSON-LD: email sign-in, "There is a free tier for early users", "Checks run continuously"; offers Free $0, Pro $4.99/MONTH, Ultra $9.99/MONTH |
| Aave Monitor | `https://chromewebstore.google.com/detail/aave-monitor/ccifbkellmfcbdngdnjimmfkclagbdii` (the slug-less URL redirects here); `https://governance.aave.com/t/aave-monitor-browser-extension/21223.json`; `https://blog.notrustverify.ch/monitor-aave-onchain-data-with-ios-widgets`; addons.mozilla.org search API `q=aave monitor` | 00:22:39, 00:23:07, 00:22:33, 00:28:01 | Same as 14 Oct. Store: version 2.11.1, updated February 25, 2026; badge colours; multiple addresses. Forum: "No wallet connect, no signing"; "Aave Monitor now supports all Aave Markets" (2025-03-08); later posts add networks on the Chrome Web Store only. Launch post (2025-03-01): "Available on Chrome and Firefox", but the Firefox Add-ons search found no Aave Monitor listing on 15 Oct, so the article now says "Chrome Web Store" only. Blog: Scriptable iOS widgets, display only, 60-minute default refresh |
| Aave DeFi Watcher | `https://chromewebstore.google.com/detail/aave-defi-watcher/cpglkdkkmocpbbndolclhdmghjdcngdj`; forum thread 25282 `.json` | 00:22:36, 00:23:04 | Same as 14 Oct. Version 1.0.0, updated July 27, 2026, no price; "Supports Aave V3 and V4 markets"; "alerts you only when the risk level worsens"; forum: Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche |
| Instadapp Protection Automation | `https://guides.instadapp.io/features/protection-automation` | 00:20:42 | Same as 14 Oct. "Protection Automation is only available for AAVE v.3 on the Polygon and Avalanche Networks"; activation minimums "Mainnet: a minimum of $15,000", "Polygon: a minimum of $1000", "Avalanche: a minimum of $5000" (collateral); "Automation Gas Fees (Mainnet only)"; "There is a 0.3% - 0.4% fee per automation event. For Mainnet only: You also pay the gas fee"; "difficult market conditions and other unforeseen factors can cause losses. Please use at your own risk! You should continue to monitor your positions even if you set automation"; "Last updated 3 years ago". The Mainnet lines conflict with the Polygon/Avalanche-only line; the article says so |
| Tenderly Alerts | `https://docs.tenderly.co/monitoring/alerts/introduction` (old `/alerts/intro-to-alerts` redirects here); `https://docs.tenderly.co/platform/supported-networks` (old `/supported-networks` redirects here) | 00:20:49; 00:25:55 | Alerts page same as 14 Oct: triggers incl. "View Function", "State Change", events; destinations Email, Slack, Telegram, Discord, Web3 Actions, Webhooks, Sentry, PagerDuty; "Alerts are available on the paid plan … contact our sales team". Networks page (table loads client-side; embedded data): `{"slug": "gnosis-chain", "name": "Gnosis Chain", "chainId": 100, … "isMonitoringEnabled": true}` (96 networks true, 2 false). No Signal destination |
| KeeperHub | `https://docs.keeperhub.com/plugins/aave-v4` | 00:20:46 | Same as 14 Oct. "This plugin currently exposes the Lido Spoke"; "Supported chains: Ethereum"; "Read-only actions work without credentials. Write actions require a connected wallet"; example workflow every 5 minutes, HF below 1.5 → Discord. Notification plugins listed: Discord, Slack, Telegram, PagerDuty, SendGrid, Webhook (no Signal) |
| OpenClaw skill | `https://clawhub.ai/jgramajo4/skills/aave-liquidation-monitor` | 00:20:35 | Same as 14 Oct. Aave V3; "runs automatically every 6 hours (configurable)"; Telegram default, or Discord/Slack; read-only address; "Chains Supported Primary: Ethereum mainnet Also works (with same config address where applicable): Polygon Arbitrum Optimism Base Avalanche Gnosis"; v1.0.1, "Last Updated: 2026-02-11" |
| Chainlink CRE template | `https://docs.chain.link/cre-templates/automated-liquidation-protection` | 00:22:46 | Same as 14 Oct. "Automatically protect DeFi lending positions"; "Confidential Workflows is in private beta"; LLM selects defensive actions and executes them. The page names no lending protocol (no "Aave") and no network, so the article calls it a generic lending template |
| Aave Alarm (dead) | `https://github.com/thegodfatherbeeearth/aavealarm` (old `github.com/nebolax/aavealarm` redirects here) | 00:23:02 | Same README as 14 Oct: "Due to Aave Grants shutting down and the developer of this app having issues with Google Play and App Store, it's no longer possible to download the app" |
| Summer.fi (dead) | `https://summer.fi`; `https://summerfi.beehiiv.com/p/whats-better-summer-month-c62a` | 00:23:24; 00:23:28 | Same as 14 Oct: "Summer.fi is winding down. The Summer.fi app has now been deactivated." Newsletter 2024-03-07: "Stop-Loss is also now available on Aave for ALL networks"; Trailing Stop-Loss on all Aave positions |
| DeFi Notifications app (stale) | `https://apps.apple.com/us/app/defi-notifications/id1588243632` (the id-only URL redirects here) | 00:22:27 | Same as 14 Oct. Free, iPhone, Hexa Foundation; "get notified when position health is low"; 1.1.20 on 10/21/2024 |
| OpenZeppelin Defender (scheduled retirement) | `https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender`; `https://defender.openzeppelin.com` | 00:23:30; 00:23:32 | Same as 14 Oct: "June 30, 2025: As of today, new user sign-ups have been disabled. July 1, 2026: The Defender platform will officially retire"; announces the open-source Relayer and Monitor and a migration path. The app URL serves only a "Defender" app shell, which neither confirms nor rules out the shutdown, so the article says "scheduled to retire" |
| Zapper (not an alert tool) | `https://cryptobriefing.com/zapper-shuts-down-defi-dashboard-2026/`; `https://zapper.xyz` | 00:22:41; 00:23:34 | Crypto Briefing (2026-07-08, third-party news): CEO Seb Audet "announced on July 8, 2026, that the platform will officially cease operations on August 3, 2026". zapper.xyz: HTTP 403 Cloudflare challenge, so it doesn't confirm the shutdown. The article says "announced it would shut down" and the method section names this as a non-vendor source |
| User-voice threads | `https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067.json`; `https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379.json` | 00:22:51; 00:23:08 | Same as 14 Oct. Polygon (2021-05-18): repay attempted at HF 1.01, repeated JSON errors, liquidated. Aave forum (2024-12-23): "for one hour+ I've been trying to repay", then liquidated |

## 4. Corrections against market.md §A.1 and against the first version of this article

1. **DeFi Saver fees (new on 15 Oct):** DeFi Saver's current fee pages add a 0.05% automation fee per triggered action on
   top of the swap fee, put stablecoin pairs at 0.01% and give ETH→wstETH as the correlated (0.1%) example. The first
   version cited the superseded `/features/automation/automation-fees` page ("0.1% between correlated assets such as
   USDC and USDT", no automation fee). Article now: 0.05% automation fee + 0.25% (0.1% correlated, 0.01% stablecoins),
   plus gas; Aave's 0.09% flash-loan fee noted in the worked example.
2. **DeFi Saver wallets:** the requirements page lists EOA support only for Aave v3 and Compound v3; the EOA page says
   Aave automations work from an EOA except the Collateral Switch automation, without naming an Aave version. The article
   attributes the V4 Smart Wallet requirement to the requirements page instead of stating it as fact.
3. **DeFi Saver Liquidation Protection** uses a fixed per-protocol minimum (105% Aave V3, 110% V4) and lifts the ratio 5
   points; the user-set repay trigger belongs to Automated Leverage Management. Both described.
4. **DeFi Saver single-collateral rule:** all automations except Automated Leverage Management need one collateral and one
   debt asset. Added to the best-for bullet, table row, automation section and Summer.fi replacement line.
5. **Gnosis uniqueness narrowed:** Tenderly (Gnosis Chain, monitoring enabled) and the OpenClaw skill (page says it also
   works on Gnosis) cover Gnosis, and Aave Monitor says it supports all markets. The claim is now limited to the
   ready-made alert services (Otomato, DeFi Saver Notify, DeFi Monitor, Ava), and the alternatives on Gnosis are named.
6. **Ava pricing** is now described as a direction Ava is exploring, not a plan; the automation overgeneralization
   ("needs … a minimum position size and a fee each time it acts") is scoped to DeFi Saver and Instadapp.
7. **Shutdowns:** Zapper "announced it would shut down on 3 Aug 2026"; Defender "scheduled to retire on 1 Jul 2026".
   "Once a common place" removed (unsourced).
8. **Instadapp:** the guide's Mainnet minimum and gas lines conflict with its Polygon/Avalanche-only line; stated.
9. **Aave Monitor:** "Chrome and Firefox" changed to the Chrome Web Store listing (no Firefox Add-ons listing found).
10. **Chainlink CRE:** generic lending template; no protocol or network named.
11. **Canonical URLs:** Aave Alarm README, Tenderly alerts and networks, DeFi Saver requirements, fees and EOA pages,
    Chrome Web Store (Aave Monitor) and App Store links now point at their current final URLs.
12. From the first check, still valid: Otomato URL 301; DeFi Monitor pricing readable from JSON-LD; Aave DeFi Watcher
    store listing (V3 and V4, alerts only when risk worsens); Instadapp "Last updated 3 years ago"; Summer.fi stop-loss
    sourced to its own newsletter.

## 5. Facts used from the research files without a new read

- Anti-dust rule and the close-factor discussion: aave-facts.md §4.2 (constants re-read in §1.2 above).
- `getUserAccountData` health factor has 18 decimals and returns max uint256 with no debt: aave-facts.md §2, §11.
- Aave V4 live (Ethereum, Avalanche, Arc, Base) and V3.7 on the seven Tokenping networks: aave-facts.md §1.1-1.2 (used by
  the shared `<ScopeNote />` and the V4 lines).
- Ethereum's other V3 markets (Prime/Lido, EtherFi, Horizon): aave-facts.md §1.2.

## 6. Not stated by vendors (shown as "Not stated" in the article)

- DeFi Saver Notify price.
- Check intervals for Otomato, DeFi Saver Notify, DeFi Monitor (only "checks run continuously") and Aave DeFi Watcher.
- Aave Monitor's supported Aave protocol version(s).
- Instadapp channels and current availability.
- Chainlink CRE template's protocols and networks.
- Any minimum position size for Ava.

Re-check every row within 7 days before any republish, and quarterly (marketing plan §3.7). Change the visible dates only
when rows are re-checked.
