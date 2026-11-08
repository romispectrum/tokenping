# Data snapshot: morpho-liquidation-alerts

Every tool fact in `content/blog/morpho-liquidation-alerts.mdx`, checked on 2026-11-08 against the tool's own pages. Third-party handles of individuals are deliberately not named in the guide. The research notes, with the source URL after each fact, follow.

Research for a tokenping.xyz guide. Every source below was opened on **8 Nov 2026** unless a line says otherwise.
"Unconfirmed" means the source I could open does not say it, or I could not open the source.

## 1. Does the Morpho app warn borrowers or send notifications?

- The Morpho app shows the **health factor** and the **liquidation price** on each borrow position: "Health factor is
  visible on users' position in the Morpho interface", and the same sentence for liquidation price. A position is
  liquidatable once the health factor "reaches 1 or less". Article last updated 5 Oct 2026.
  Source: https://help.morpho.org/en/articles/12166252-liquidation
- The same article tells borrowers the health factor and liquidation price "ha[ve] to be carefully monitored"; the
  borrow article says to "regularly monitor your position to avoid liquidation". Neither mentions any notification,
  email or push alert. Sources: https://help.morpho.org/en/articles/12166252-liquidation,
  https://help.morpho.org/en/articles/12166187-borrow-product-variable-rate-markets-morpho-blue
- No help-centre article on notifications or alerts exists in any collection (Morpho 101, Markets, Vaults, App
  features, Troubleshooting). Source: https://help.morpho.org/en/ (collections listed and opened)
- Morpho's list of its own apps names no alerting or notification app. Its apps: Vault App (app.morpho.org: Morpho
  Vaults and Variable Rate Markets, i.e. Blue), Fixed-Rate Markets App (markets.morpho.org/fixed: Midnight), Data
  Dashboard (data.morpho.org), Rewards, Curator apps, Oracle Portal, Liquidation App (liquidation.morpho.org).
  "Morpho Warnings" exist but flag **market and vault** risks (bad debt, oracle unusable, low liquidity, unlisted),
  not a borrower's health. Source: https://docs.morpho.org/get-started/resources/app-ecosystem/
- Scam caution worth quoting: "Morpho does not run any Telegram or mining bot". Source:
  https://docs.morpho.org/get-started/resources/app-ecosystem/
- Morpho's developer docs tell **integrators** (not Morpho's own app) to build alerts: when health factor drops below
  a safe threshold "(e.g., `1.1`), trigger notifications in your UI or via other channels", and to cap borrows at a
  health factor of 1.05 or more. Source: https://docs.morpho.org/developers/borrow/concepts/ltv
- For Midnight, Morpho tells integrations to "Alert users to maturity, deteriorating collateral health, failed quotes,
  exhausted liquidity, or rejected offer payloads". Again integrator guidance, not an app feature. Source:
  https://docs.morpho.org/developers/midnight/get-started/
- Networks: Morpho's API lists 15 chains: Ethereum, Base, Katana, HyperEVM, Arbitrum One, Polygon, Unichain, OP
  Mainnet, World Chain, Monad, Stable, Tempo, Robinhood Chain, Arc and **X Layer**. X Layer has 23 markets in the API
  but **0 listed** ones. Source: `chains` and `markets(where:{chainId_in:[196], listed:true})` queries on
  https://api.morpho.org/graphql. Tokenping's config (25 Oct 2026) names the other 14 as "the 14 chains Morpho's own
  app covers". **Unconfirmed:** whether app.morpho.org now shows X Layer (the app is client-rendered; not checked).
- data.morpho.org lists 13 chains (the 14 above minus Stable). Source: https://data.morpho.org
- Morpho Midnight core contracts exist on 5 chains: Ethereum, Arc, Base, Robinhood Chain, Tempo. Source:
  https://docs.morpho.org/developers/contracts/addresses
- Listed Midnight markets on 8 Nov 2026 are on **Ethereum and Base only** (every listed market in
  `GET /v0/midnight/markets?listed=true` has chain_id 1 or 8453). Source: https://api.morpho.org/v0/midnight/markets?listed=true
- **Unconfirmed:** what the Fixed-Rate Markets App (markets.morpho.org/fixed) shows for a Midnight borrower (health,
  liquidation price, maturity warning). No help article covers it.
- Minor discrepancy to avoid: the help article says the liquidation incentive at 86% LLTV is "about 5%"; the contract
  formula gives 4.38% (Tokenping's how-morpho-liquidation-works guide). Source:
  https://help.morpho.org/en/articles/12166252-liquidation

## 2. Tools that alert on a Morpho position

| Tool                                | Status (8 Nov 2026)                                          | Blue / Midnight                                              | Networks for Morpho                                                                               | Channels                                                                                                                        | Cost                                                                                                                            | Check frequency                                       | Notes and limits                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tokenping**                       | Live, beta                                                   | Blue and Midnight                                            | 14 (see section 5); Midnight alerts on chains where Morpho lists Midnight markets                 | Signal, Telegram, email                                                                                                         | 3 USDC per 30 days on Arbitrum (read on-chain)                                                                                  | Every 5 minutes; repeats every 15 minutes while below | Connected wallet only, listed markets only; see section 5                                                                                                                                                                                                                             |
| **Otomato**                         | Live                                                         | Blue (and MetaMorpho vault deposits). Midnight not mentioned | Ethereum, Arbitrum, Base, HyperEVM, Monad                                                         | iOS and Android app (push), Telegram bot                                                                                        | Core Morpho monitoring free; premium "will cover" multi-wallet and overnight phone-call escalations                             | Not stated                                            | Paste an address, read-only. Alerts on health factor approaching LLTV, liquidation distance in dollars, rate changes, oracle or parameter events, vault reallocations. Smart defaults, overridable per position (Aave page gives 1.2 as the default; the Morpho page gives no number) |
| **HF Guard**                        | Live, beta                                                   | Morpho Blue only                                             | "6 networks, including Arc" (the other 5 not named)                                               | Telegram bot, web dashboard                                                                                                     | Free during beta                                                                                                                | "Positions are checked periodically"                  | Alerts when a position changes risk level, and at crossings such as 2.0, 1.9, 1.8, 1.7, 1.6. "Alerts are best-effort and may be delayed"                                                                                                                                              |
| **DeFi Monitor**                    | Live, beta                                                   | Morpho Blue only                                             | Ethereum, Base, Arbitrum                                                                          | Telegram, Discord                                                                                                               | Free tier for early users; Pro $4.99/month (10 addresses, 20 subscriptions), Ultra $9.99/month (30 addresses, 60 subscriptions) | "Checks run continuously" (no number)                 | Morpho Blue added 22 Mar 2026: health factor, utilization, rate spikes and "pre-liquidation warnings". Sign in with email. Severity-aware cooldown suppresses repeats of the same severity                                                                                            |
| **DeFi Saver Notify**               | Live                                                         | Morpho (Blue); Midnight not stated                           | Morpho on Ethereum, Arbitrum, Base (Arbitrum added Nov 2025 "with position health notifications") | Unconfirmed for Morpho; the Aave tools table (checked 19 Oct 2026, not re-opened) lists in-app, email, Blockscan chat, Telegram | Not stated                                                                                                                      | Not stated                                            | The Notify page itself names Aave, Liquity, Maker and Compound, not Morpho; Morpho Notify support comes from the Dec 2025 newsletter                                                                                                                                                  |
| **aash** (open source, self-hosted) | Repo active (last push 3 Nov 2026), 0 stars, no licence file | Blue and Midnight (and vault deposits)                       | Not stated                                                                                        | Telegram bot you run yourself                                                                                                   | Free, self-hosted                                                                                                               | Polling; interval not stated in README                | Alerts on health factor zone changes. Optional "watchdog" can repay stablecoin debt through a rescue contract; it "does not rescue Midnight loans"                                                                                                                                    |
| **Ava**                             | Live                                                         | **No Morpho support found**                                  | n/a                                                                                               | n/a                                                                                                                             | n/a                                                                                                                             | n/a                                                   | Its risk-alert docs watch "Aave health factor" only                                                                                                                                                                                                                                   |
| **Hypernative**                     | Live                                                         | Morpho ecosystem                                             | Not stated                                                                                        | Not stated                                                                                                                      | Not stated                                                                                                                      | Not stated                                            | Aimed at curators, asset managers, fintechs and institutions (alerts on oracle, health factor, utilization, bad debt). Not a retail borrower tool                                                                                                                                     |
| **Hal**                             | Not live                                                     | (Morpho Optimizers era)                                      | n/a                                                                                               | n/a                                                                                                                             | n/a                                                                                                                             | n/a                                                   | Morpho's March 2023 post advertised Hal triggers; hal.xyz did not answer (connection failed) on 8 Nov 2026. Treat as gone                                                                                                                                                             |

Sources:

- Tokenping: section 5.
- Otomato: https://otomato.xyz/protocols/morpho (page text and its FAQ), https://docs.otomato.xyz/product/getting-started/otomato-for-morpho/im-borrowing-against-my-assets (last updated "9 months ago"), https://otomato.xyz/protocols/aave (1.2 default)
- HF Guard: https://hfguard.app (homepage and FAQ)
- DeFi Monitor: https://defi-monitor.com (FAQ), https://defi-monitor.com/pricing, https://defi-monitor.com/changelog
- DeFi Saver Notify: https://help.defisaver.com/features/notify, https://blog.defisaver.com/defi-saver-newsletter-december-2025/ (newsletter of 5 Dec 2025), https://help.defisaver.com/general/compatibility/supported-chains-and-protocols
- Ava: https://avaprotocol.org/docs/using-ava/risk-alerts, https://avaprotocol.org/protect, https://avaprotocol.org/docs/start-here/supported-chains (no "Morpho" anywhere on these pages)
- Hypernative: https://www.hypernative.io/blog/morpho-integrates-hypernative-to-secure-onchain-lending-for-professional-investors (15 Jul 2025)
- Hal: https://x.com/Morpho/status/1633135529880612865 (seen in search results only, not opened); https://hal.xyz (no response)

Not included: an ETHGlobal "Morpho Loan Bot" hackathon project (its author said it was never deployed) and an Apify
scraper actor; neither is a live service for borrowers.

## 3. Protection rather than alerts

### Morpho pre-liquidation

- What it is: contracts that carry out liquidations "with specific parameters chosen by the borrower": a market, a
  `preLltv` below the LLTV, two close factors and two incentive factors that rise linearly with LTV between preLltv and
  LLTV, and an oracle. Source: https://github.com/morpho-org/pre-liquidation (README)
- Who creates it: anyone. `PreLiquidationFactory.createPreLiquidation(id, params)` has no caller restriction and
  deploys the contract with CREATE2. Morpho's launch post: "any application built on Morpho" can deploy them through
  an open-source factory. Sources: https://github.com/morpho-org/morpho-blue/blob/main/src/periphery/pre-liquidation/PreLiquidationFactory.sol,
  https://morpho.org/blog/introducing-pre-liquidations-enhanced-loan-management-on-morpho
- What the borrower authorises: "pre-liquidation must be authorized on Morpho", i.e. the borrower calls
  `setAuthorization(contract, true)` on Morpho Blue, which lets that address "manage `msg.sender`'s positions". The
  contract then repays the borrower's debt and withdraws their collateral to the liquidator when LTV is above preLltv
  and at or below LLTV. Sources: https://github.com/morpho-org/pre-liquidation,
  https://github.com/morpho-org/morpho-blue/blob/main/src/interfaces/IMorpho.sol,
  https://github.com/morpho-org/morpho-blue/blob/main/src/periphery/pre-liquidation/PreLiquidation.sol
- Two uses named by Morpho: Auto-deleverage (close only enough to restore health) and Auto-close (close the whole
  position earlier for a lower penalty). If no liquidator acts, normal Morpho liquidation still applies. Source:
  https://morpho.org/blog/introducing-pre-liquidations-enhanced-loan-management-on-morpho (post date not on the page)
- New since Tokenping's pre-liquidation guide (26 Oct): the `morpho-org/pre-liquidation` repository is now **archived**
  with a notice that pre-liquidation "now lives in Morpho Blue, under `src/periphery/pre-liquidation`" and "The source
  and compiled code is unchanged". Last push 3 Nov 2026 (GitHub API). Source: https://github.com/morpho-org/pre-liquidation
- Morpho's SDK deprecated all pre-liquidation logic in PR 1132 ("chore: deprecate all pre-liquidation logic"), merged
  22 Sep 2026. Source: https://github.com/morpho-org/sdks/pull/1132
- The old docs URL https://docs.morpho.org/build/borrow/concepts/preliquidation now redirects to the general liquidation
  page; https://docs.morpho.org/learn/concepts/preliquidation/ answers 404.

### Auto-deleverage (sunset)

- "Auto-Deleverage was a feature designed to reduce the risk of full liquidation"; it partly closed a position when
  LTV passed a set threshold. "The Auto-deleverage feature is being sunset and is no longer accepting new positions."
  "Users with an existing Auto-deleverage position should disable it", with the manage button on the position or market
  page. Page dated 13 May 2026. Source: https://help.morpho.org/en/articles/12048871-sunsetting-auto-deleverage

### Automation that can repay a Morpho loan

- **DeFi Saver Automation** on Morpho:
  - The automation compatibility table marks Morpho: Liquidation Protection yes, Automated Leverage Management yes,
    Boost on Target Price yes; Stop Loss, Take Profit, Repay on Target Price, Collateral Switch, Trailing Stop no.
    Source: https://help.defisaver.com/automations/compatibility
  - Liquidation Protection repays "enough debt to put the Safety Ratio up by 5%" once the Safety Ratio falls below a
    fixed minimum: **127% for Morpho Blue** (105% Aave V3, 110% Aave V4). Source:
    https://help.defisaver.com/automations/liquidation-protection
  - Conflict: the Morpho-specific page (last updated "1 year ago") lists only Ethereum and Base, with Automated Leverage
    Management and Boost on Target Price, and no Liquidation Protection; the supported-chains page and the Dec 2025
    newsletter add Arbitrum. Treat the newer pages as current, and say "Ethereum, Base and Arbitrum" with care.
    Sources: https://help.defisaver.com/protocols/morpho/compatibility-and-automations,
    https://help.defisaver.com/general/compatibility/supported-chains-and-protocols,
    https://blog.defisaver.com/defi-saver-newsletter-december-2025/
  - Smart wallet required: "The automations are only available for positions that are on a Smart Wallet" (only Aave V3
    and Compound V3 work from an EOA). Sources: https://help.defisaver.com/protocols/morpho/compatibility-and-automations,
    https://help.defisaver.com/automations/requirements-for-using-automation
  - Minimum debt: Morpho $30,000 on Mainnet, $500 on Base (Arbitrum not listed). An automation will not execute if debt
    falls to $5,000 or less on Ethereum, $500 or less on Arbitrum, Base or Optimism. Source:
    https://help.defisaver.com/automations/requirements-for-using-automation
  - Fees: 0.05% per automated transaction, plus swap fees (0.25% uncorrelated, 0.1% correlated, 0.01% stablecoins);
    gas is charged to the position. Source: https://help.defisaver.com/automations/fees
  - Only Automated Leverage Management works with multi-collateral or multi-debt positions. Source:
    https://help.defisaver.com/automations/compatibility
  - Midnight: DeFi Saver supports Morpho Midnight positions ("currently only available on Base") with manual Pay back,
    Pay back via orderbook, Boost and Repay; **no Midnight automation is mentioned**. Source:
    https://help.defisaver.com/protocols/morpho-midnight/dashboard-walkthrough.md
- **Ratehopper** (Base): an agent product that opens positions on Aave, Compound, Morpho and others through a Safe;
  its Auto-Exit makes partial exits when LTV reaches a trigger you set. It protects positions run through Ratehopper's
  agent, not an existing Morpho loan. Email does not send liquidation alerts. Sources:
  https://docs.ratehopper.ai/llms-full.txt, https://docs.ratehopper.ai/features/notifications
- **aash** watchdog (self-hosted, see section 2) can repay stablecoin debt on configured Morpho Blue markets through a
- **Summer.fi** is no longer an option: "Summer.fi is winding down. The Summer.fi app has now been deactivated." Source:
  https://summer.fi
- **Ava**'s Auto mode is Aave only (see section 2).

## 4. What people mean by "Morpho liquidation bot", "dashboard", "heatmap", "calculator"

### Liquidator bots (they liquidate others; they do not protect you)

- Morpho's docs now list Morpho-maintained bots in `morpho-org/morpho-bots`: a **Blue liquidation bot** ("Ecosystem-backstop
  liquidator for Morpho Blue") and a **Midnight liquidation bot**, plus community liquidators in Rust
  (etherhood/Liquidator-Morpho) and Go (zach030/morpho-liquidator-bot). "These bots are provided as-is, without any
  warranty." Source: https://docs.morpho.org/developers/ecosystem/bots-and-automations/
- `morpho-bots`: Apache-2.0, created 16 Sep 2026, last push 6 Nov 2026. The Blue bot is "A non-competitive,
  ecosystem-backstop liquidator for Morpho Blue on Base and Robinhood", status v0, needs a Morpho partner API key. The
  Midnight bot runs on Base and Ethereum, one process per chain, and only touches listed markets. Sources:
  https://github.com/morpho-org/morpho-bots, https://github.com/morpho-org/morpho-bots/tree/main/bots/blue-liquidation,
  https://github.com/morpho-org/morpho-bots/tree/main/bots/midnight-liquidation
- The older `morpho-org/morpho-blue-liquidation-bot` (MIT, "Easily configurable liquidation bot for Morpho Blue") is
  **archived**; last release v4.0.0 on 16 Mar 2026, last push 13 Jul 2026. Source:
  https://github.com/morpho-org/morpho-blue-liquidation-bot (and the GitHub API)
- Morpho also runs a manual **Liquidation App** at liquidation.morpho.org: "Monitor liquidation opportunities in Morpho
  markets", a table of borrowers with health factor and "Estimated profit". Morpho's docs: "Production use requires
  supplemental automation". Sources: https://liquidation.morpho.org, https://docs.morpho.org/get-started/resources/app-ecosystem/
- Morpho itself does not liquidate positions; `liquidate` is open to anyone, typically "an automated bot". Source:
  https://docs.morpho.org/developers/borrow/concepts/liquidation

### Dashboards of Morpho liquidations

- **Dune, "Morpho Liquidations"** by the morpho team: "a comprehensive snapshot of liquidations and bad debt events
  happening on Morpho" (counters, unrealized bad debt per market, bad debt events). Listed among Morpho's open source
  Dune dashboards. Sources: https://dune.com/morpho/morpho-liquidation,
  https://docs.morpho.org/developers/ecosystem/data-dashboards/
- **data.morpho.org** has a Liquidations section (data from Dune): e.g. liquidated amount for the week of 2 Nov 2026,
  across chains, $13,823,805; realized bad debt that week $0. Source: https://data.morpho.org
- **DefiLlama** has a Morpho Blue liquidations page, but "Liquidations need a subscription" ("See positions, prices and
  liquidation levels by protocol and chain"). Source: https://defillama.com/liquidations/morpho-blue (opened in a
  browser; plain fetch gets 403)

### "Heatmap"

- No liquidation heatmap for Morpho **lending** positions found. Searches for "morpho liquidation heatmap" mostly
  return pages about liquidations of **MORPHO token futures** on exchanges, e.g. CoinGlass "MORPHO Liquidations: Morpho
  Futures Long & Short", which explains liquidation as a trader's margin account being closed by an exchange. That is
  unrelated to a Morpho loan. Source: https://www.coinglass.com/liquidations/MORPHO
- The nearest thing for lending is DefiLlama's liquidation levels by price (paywalled, above). Unconfirmed: whether it
  shows Morpho as a price distribution chart.

### "Calculator"

- The Morpho app shows each position's liquidation price itself (section 1).
- Otomato's free Liquidation Calculator (titled "... (Aave, Morpho)"): inputs collateral value, debt, liquidation
  threshold % and collateral price; outputs health factor, how far collateral can fall and liquidation price. For Morpho
  the "liquidation threshold" is the market's LLTV. Source: https://otomato.xyz/tools/liquidation-calculator
- HF Guard lists an "HF simulator" in its dashboard. Source: https://hfguard.app

## 5. Tokenping's Morpho coverage (from the repository, read-only)

- Watches "Aave V3 and V4 and ... Morpho Blue and Midnight"; `/morpho` lists the wallet's borrow positions "in the
  markets the Morpho app lists, on its 14 networks": Morpho Blue (variable rate) and Morpho Midnight (fixed rate).
  Source: README.md
- The 14 networks, in Morpho's app order: Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Unichain, World Chain,
  HyperEVM, Katana, Monad, Arc, Robinhood Chain, Stable, Tempo. Source: packages/nextjs/config/morpho.ts
- Midnight contracts configured on Ethereum, Base, Arc, Robinhood Chain and Tempo; Midnight alerts are offered where
  Morpho's API lists Midnight markets (`midnightListed`: Ethereum, Base, Arc, Robinhood Chain; not Tempo). On 8 Nov
  2026 the API lists Midnight markets on Ethereum and Base only (section 1). Sources: packages/nextjs/config/morpho.ts,
  README.md
- Health factors are computed from the chain with Morpho's own math, in the browser and in the cron, "so checks never
  depend on the API". Saving a new alert needs the market to be listed (checked through the API; 503 while it is down).
  Source: README.md
- Threshold range 1.02 to 10 on Morpho (`MORPHO_HEALTH_FACTOR_THRESHOLD_MIN = 1.02`, `HEALTH_FACTOR_THRESHOLD_MAX = 10`),
  default 1.5 (`DEFAULT_HEALTH_FACTOR_THRESHOLD`). Aave's minimum is 1.1. The Morpho slider moves in hundredths below 2. Sources: packages/nextjs/constants/notifications.ts, packages/nextjs/utils/notifications/threshold.ts
- Checks every 5 minutes: Vercel cron `*/5 * * * *` on `/api/cron/notifications`. Source: packages/nextjs/vercel.json
- Alerts repeat every 15 minutes per channel while below the threshold (`ALERT_REPEAT_MINUTES = 15`), starting at once;
  no snooze and no "recovered" message. Sources: packages/nextjs/constants/notifications.ts, README.md
- Pre-liquidation: a borrower who authorised a Blue market's pre-liquidation contract is measured against that earlier
  line; contracts are read when an alert is saved or edited. Source: README.md
- Maturity reminders for Midnight: one reminder within 7 days of maturity and one within 1 day, then an alert every 15
  minutes after maturity while debt remains (`morphoNotices` in services/notifications/morphoAlerts.ts; stored in
  `notification_maturity_reminders`). Sources: README.md, packages/nextjs/services/notifications/morphoAlerts.ts
- Channels: Signal, Telegram, email. Send test per channel, one per 15 minutes. Source: README.md
- Limits: only the connected wallet (no watch-only addresses); at most 50 alerts per wallet, Aave and Morpho together;
  amounts in the loan token with no USD prices; the cron spends at most 20 seconds per run on Morpho positions, the rest
  next run; polling, not real time. Source: README.md
- Cost: same paid access as Aave. Plan read on-chain: `plans(USDC)` on TokenpingPaywall
  (0x79872d7529cfE1c062838fACDA004Ce4BFB16553, Arbitrum) returns price 3,000,000 (3 USDC), duration 2,592,000 s (30
  days), enabled, at Arbitrum block 522,346,455 on 8 Nov 2026. Viewing positions needs no payment. Source: README.md,
  on-chain read via https://arb1.arbitrum.io/rpc

## Could not confirm

- Whether app.morpho.org shows X Layer (API lists it, with no listed markets).
- What the Midnight app (markets.morpho.org/fixed) shows a borrower, and whether it warns before maturity.
- Check intervals for Otomato, HF Guard, DeFi Monitor and DeFi Saver Notify (none publish a number).
- HF Guard's 5 Morpho networks other than Arc; Otomato and HF Guard support for Midnight (neither mentions it).
- DeFi Saver Notify channels for Morpho specifically, and whether DeFi Saver Liquidation Protection really runs on
  Morpho (two of its own pages disagree).
- DefiLlama's Morpho liquidation data (behind a subscription).
- Hal's current status beyond hal.xyz not responding.
