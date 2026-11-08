# Data snapshot: defi-saver-alternatives

Every tool fact in `content/blog/defi-saver-alternatives.mdx`, checked on 2026-11-08 against the tool's own pages. Third-party handles of individuals are deliberately not named in the guide. The research notes, with the source URL after each fact, follow.

Researched for a tokenping.xyz guide. Every source below was opened on **8 Nov 2026** unless a line says otherwise.
"Unconfirmed" means the page did not say it or I could not open the page. Vendor figures are the vendor's own claims.
The 19 Oct 2026 table (existing-tools-table.md) was used only as a list of leads; every fact here was re-checked today.

---

## 1. DeFi Saver

### What it is

- Says it is a non-custodial DeFi management app. Features: Automation, Loan Shifter, Leverage Management (Boost/Repay), Recipe Creator, lending dashboards, a DEX aggregator, Hyperliquid perps (marked "New"), TxSaver. The homepage says it supports 16 protocols on 5 networks, and marks Aave V4 and Morpho Midnight "New". https://defisaver.com
- Homepage stats (self-reported): 913K+ user transactions, $398M+ total automated, 1K+ positions automated. https://defisaver.com
- October 2026 newsletter (self-reported, September figures): 997 automated positions managing about $461M. https://blog.defisaver.com/defi-saver-newsletter-october-2026/

### Automation strategies and the protocols each supports

From the Compatibility page (it has no per-network table): https://help.defisaver.com/automations/compatibility

- Liquidation Protection: Aave V4, Aave V3 Core, Fluid, MakerDAO, Compound V3 (USDC, USDC.e, USDbC, USDT, ETH and wstETH debt), Spark, Morpho
- Automated Leverage Management (auto Repay plus auto Boost): Aave V4, Aave V3 Core, Aave V2, Fluid, MakerDAO, CurveUSD, Liquity V1, Compound V2, Compound V3, Spark, Morpho
- Collateral Switch: Aave V4, Aave V3 Core
- Take Profit and Stop Loss: Aave V4, Aave V3 Core, MakerDAO, Liquity V1
- Boost on Target Price: Aave V4, Aave V3 Core, Morpho. Repay on Target Price: Aave V4, Aave V3 Core
- Trailing Stop: MakerDAO, Liquity V1. Liquity V1 also has Bonds Liquidation Protection, Savings Protection and Redemption Protection. CurveUSD has Automated Payback. MakerDAO has Savings Liquidation Protection.
- No strategies for Aave V3 Prime, Aave V3 EtherFi, Sky, Euler V2 or LlamaLend.
- Network exceptions: no Compound automations on Optimism, no Aave automations on Linea or Plasma, no Compound USDS automations on Base, no Fluid automations on Plasma.
- Automations are built mainly for positions with one collateral and one debt asset. Only Automated Leverage Management works on multi-collateral or multi-debt positions.

### Liquidation Protection

Source: https://help.defisaver.com/automations/liquidation-protection

- Repays part of the debt (it unwinds collateral to do so) when DeFi Saver's Safety Ratio falls below a fixed per-protocol minimum. Minimums: Aave V3 105%, Aave V4 110%, Compound V3 105%, Spark 105%, Maker 155%, Fluid 119%, Morpho Blue 127%.
- Raises the Safety Ratio "by 5%". The page's example is a 105% trigger restored to 110%, so it reads as 5 percentage points; the page does not say so outright.
- Bots execute it. Gas and fees are charged to the position, not taken from your wallet. It can fire again each time the ratio drops back below the trigger.
- The August 2026 newsletter calls it a new, simpler option alongside the existing Auto-Repay, on Mainnet, Arbitrum, Optimism and Base, for Aave, Morpho, Compound, Fluid, Spark and Maker. https://blog.defisaver.com/defi-saver-newsletter-august-2026/
- The launch date of 10 Aug 2026 comes only from a secondary source, Crypto Briefing (1 Oct 2026). I did not find a dedicated DeFi Saver launch post. https://cryptobriefing.com/defi-saver-aave-v3-liquidation-protection/

### Automated Leverage Management

Source: https://help.defisaver.com/automations/automated-leverage-management

- DeFi Saver calls it its oldest and most popular automation. Repay fires below a ratio you set and Boost fires above one. Under "Advanced" you can set the trigger ratios and the target ratio.
- The page gives no defaults and no required gap between the trigger and target ratios.

### Smart wallet or EOA

- Requirements page: positions must be in a Smart Wallet, except on Aave V3 and Compound V3, which also support EOA wallets. https://help.defisaver.com/automations/requirements-for-using-automation
- EOA features page: Aave and Spark EOA users can use automations except Collateral Switch, and Compound EOA users can too. EOAs cannot use Close, Create, Loan Shifter, Recipe Creator or Tx-Saver. Safe is the default Smart Wallet. https://help.defisaver.com/general/compatibility/wallet-compatibility/what-features-do-eoa-wallets-have-access-to
- **These pages disagree, and so do the Aave V4 pages.** The V4 launch post of 30 Mar 2026 says EOA and smart wallet users can both use the automation tools. https://blog.defisaver.com/aave-v4-is-now-live-on-defi-saver/ The V4 help page lists Automations as "Smart Wallet positions only" and says EOA automations will come "shortly". https://help.defisaver.com/protocols/aave-v4/what-defi-saver-features-are-not-yet-available-on-aave-v4 Treat V4 EOA automation as unconfirmed.
- Loan Shifter V2 (blog post of 2 Nov 2026) now also accepts positions from an EOA; earlier versions accepted only smart wallets. https://blog.defisaver.com/loan-shifter-v2-a-simpler-way-to-shift-your-defi-position/

### Minimum position sizes (debt)

Source: https://help.defisaver.com/automations/requirements-for-using-automation

- Aave V3 and V4: $30,000 on Mainnet. Aave V3 on Arbitrum, Optimism and Base: $500.
- Spark: $30,000 on Mainnet. Morpho: $30,000 on Mainnet, $500 on Base.
- Compound V2 and V3: $30,000 on Mainnet. Compound V3 on Arbitrum and Base: $500.
- Fluid: $30,000 on Mainnet, $500 on Arbitrum and Base.
- MakerDAO: 30,000 DAI (ETH-A, ETH-C, WSTETH-A, WSTETH-B), 40,000 DAI (ETH-B). Liquity V1: $40,000 plus 3,000,000 debt in front. Liquity V2 and CurveUSD: $30,000.
- If repayments push debt below the minimum, the automation stays on. At $5,000 or less on Ethereum, or $500 or less on Arbitrum, Base or Optimism, it stays on but will not execute.

### Fees

- Automation: 0.05% of each triggered automated transaction. Swaps inside it are charged 0.25% (uncorrelated pairs), 0.10% (correlated) or 0.01% (stablecoins). Gas comes out of the position. An Aave flash loan costs 0.09%; other sources are free and are used first. Turning automation on and keeping it on costs nothing. https://help.defisaver.com/automations/fees
- General fee page: the same variable swap fee applies to manual Boost, Repay, Create and Close. Supply, borrow, repay and withdraw are free. No subscription is mentioned. https://help.defisaver.com/general/what-is-defi-saver/defi-saver-fees

### Networks and protocols in the app

Source: https://help.defisaver.com/general/compatibility/supported-chains-and-protocols

- Ethereum: Aave V3, Compound V3, Fluid, Morpho, Liquity V2, Maker, CurveUSD, Sky, Compound V2, Spark, Euler V2, LlamaLend
- Arbitrum: Aave V3, Compound V3, Fluid, Morpho, LlamaLend. Optimism: Aave V3, Compound V3. Base: Aave V3, Compound V3, Fluid, Morpho. Linea: Aave V3. Plasma: Aave V3, Fluid.
- This page does not list Aave V4. The V4 launch post says Ethereum Mainnet only (30 Mar 2026). https://blog.defisaver.com/aave-v4-is-now-live-on-defi-saver/
- Morpho Midnight launched on Base (28 Aug 2026) with a smart wallet required and **no automation yet** ("in the works"). https://blog.defisaver.com/morpho-midnight-is-live-on-defi-saver/ The October 2026 newsletter says it is now also on Ethereum Mainnet. It adds no automation for Midnight. https://blog.defisaver.com/defi-saver-newsletter-october-2026/

### Notify (alerts)

- Ratio monitor (alerts when the ratio goes below or above a level you set), a Liquity-only debt-in-front monitor, an automated-actions monitor (on by default for Automation users) and an Aave V3 supply-cap-increase monitor. In-app by default; email, Blockscan chat and Telegram are optional. https://help.defisaver.com/features/notify/use-case
- Protocols: Aave, Liquity, Maker and Compound, for positions in a Smart Wallet or held directly. Networks: Ethereum, Arbitrum, Base and Optimism. Works without Automation. https://help.defisaver.com/features/notify
- Set up from the Notify tab of each protocol dashboard, with "Manage channels" for delivery. Cost and check interval are not stated. https://help.defisaver.com/features/notify/how-do-i-set-up-notify
- The Telegram bot shows positions, sets health factor and supply-cap alerts, and reports automation triggers, on Mainnet, Base, Arbitrum and Optimism. To link it you connect a wallet on DeFi Saver, authenticate and enter a code from the bot. https://help.defisaver.com/features/notify/telegram-bot-for-monitoring-your-position
- October 2026: a Telegram Mini App "Track mode" follows any address, and automation alerts now carry more detail. https://blog.defisaver.com/defi-saver-newsletter-october-2026/
- Unconfirmed: whether Notify covers Morpho, Spark, Fluid or Aave V4 (the Notify page names only Aave, Liquity, Maker and Compound), and whether a wallet signature is needed.

### Recent changes (2026)

- Took over Summer.fi Pro: Summer Pro became view-only on 12 Feb 2026, and its automations "will stop and must be recreated in DeFi Saver". https://summerfi.beehiiv.com/p/summer-pro-is-moving-to-defi-saver-lazy-summer-protocol-goes-all-in
- Aave V4 support from day one (30 Mar 2026). https://blog.defisaver.com/aave-v4-is-now-live-on-defi-saver/
- Liquidation Protection (August 2026), Morpho Midnight (28 Aug 2026), Compound Institutional Market (17 Sep 2026) and Loan Shifter V2 (2 Nov 2026). https://blog.defisaver.com/
- No shutdown or deprecation is announced in the blog index or the October 2026 newsletter. https://blog.defisaver.com/

### Security record and audits

- Jun 2020: a vulnerability in the DeFi Saver Exchange. About $30k was affected, moved to safety by a white-hat operation and returned. Automation and the dashboards were not affected. https://blog.defisaver.com/disclosing-a-recently-discovered-exchange-vulnerability/
- Jan 2021: a vulnerability in the CompoundImport contracts (AaveImport too, which was already switched off), found by Dedaub. About $3.5M was at risk. DeFi Saver moved affected users' positions into new Smart Wallets they own, and no losses were reported. https://blog.defisaver.com/disclosing-a-recently-discovered-vulnerability/ and https://dedaub.com/blog/static-analysis-5-7m-in-hard-assets-best-i-can-do-is-2-3m/
- Oct 2020 report of 310,000 DAI drained through SaverExchange: unconfirmed. The SlowMist write-up returned 403. https://slowmist.medium.com/slowmist-how-was-the-310-000-dai-of-defi-saver-users-stolen-91de37a4ade2
- Aug 2024: a user lost about $55M in DAI to a phishing signature that handed ownership of their proxy and Maker vault to the attacker. This was user-side phishing, not a contract bug. CryptoSlate calls it a "DeFi Saver Proxy". The Block calls it DSProxy and does not name DeFi Saver. https://cryptoslate.com/crypto-trader-loses-55m-in-dai-to-phishing-attack-using-inferno-drainer-kit/ and https://www.theblock.co/post/312326/hacking-55-million-dai-inferno-drainer
- Audits named by DeFi Saver: Dedaub (Automation, Feb 2021); ConsenSys Diligence and Dedaub (new architecture and Recipe Creator); "Optimism" (2024); another Dedaub audit. https://help.defisaver.com/general/what-is-defi-saver/defi-saver-and-security
- Public audit reports: ConsenSys Diligence (Mar 2021) https://consensys.io/diligence/audits/2021/03/defi-saver/ and Dedaub (v3.1 delta, Feb 2024) https://dedaub.com/audits/defi-saver/defi-saver-v3-1-delta-feb-22-2024/. These come from search results; I did not open the reports.
- Immunefi bug bounty: listed since 21 Apr 2021, up to $350,000 for critical bugs, page updated 7 Nov 2026. https://immunefi.com/bug-bounty/defisaver/
- Prompt-injection note: a search-tool summary said the security help page contains embedded text telling the reader to make an HTTP request. My own fetch of the page did not show it. I did not act on it.

---

## 2a. Tools that can repay or deleverage for you

### Instadapp Protection Automation

Source: https://guides.instadapp.io/features/protection-automation

- Status unclear. The guide is undated. Instadapp's homepage still lists Instadapp PRO but does not say whether it is live. https://instadapp.io
- Aave V3 only. The guide says Polygon and Avalanche but also lists Mainnet minimums and gas, so Mainnet support is unclear.
- You set a trigger health factor and a target health factor. It repays debt to reach the target; a target of 1000 repays everything. You cannot choose which asset repays.
- Minimum collateral to turn it on: $15,000 on Mainnet, $1,000 on Polygon, $5,000 on Avalanche. Fee: 0.3% to 0.4% per automation event, plus gas paid from collateral on Mainnet.
- Needs an Instadapp DSA (smart account), and turning it on adds an authority to the DSA.

### Ava (Ava Protocol)

- Watches the Aave health factor and prepares a top-up or repay for you to sign (Manual mode). In Auto mode you fund an Ava smart wallet and sign a permission. By default that permission has no spending limit and expires after 365 days; on the web you can narrow it to one token with a limit. https://avaprotocol.org/protect/aave-position
- Auto mode checks hourly. Channels: Email, Discord, Telegram and Slack can be switched on in Settings. Telegram alert settings are "coming soon". https://avaprotocol.org/docs/using-ava/risk-alerts
- Chains: Ethereum and Base. Protocols: Aave V3 (actions), Uniswap V3, Lido (read-only). No Morpho. https://avaprotocol.org/docs/start-here/supported-chains
- Cost: free today. A usage-based fee is being considered, for example when its protection stops a liquidation. https://avaprotocol.org/docs/start-here/pricing

### Morpho: Auto-deleverage and pre-liquidation

- Morpho app Auto-deleverage is being **sunset**. Notice of 13 May 2026: no new positions are accepted and existing users should turn it off. It closed part of a position when LTV passed a threshold, with a fee only on the amount closed. https://help.morpho.org/en/articles/12048871-sunsetting-auto-deleverage
- The pre-liquidation contracts remain a protocol feature. A borrower authorizes partial liquidations by third-party liquidators, who earn an incentive, between a preLLTV and the market's LLTV. The standalone repo was archived on 3 Nov 2026; pre-liquidation now lives in the Morpho Blue repo under `src/periphery/pre-liquidation`. Factory deployed on Ethereum and Base. https://github.com/morpho-org/pre-liquidation
- Pre-liquidation is a softer, earlier liquidation that pays a liquidator. It does not repay with your own funds.
- Morpho's docs URL for pre-liquidation now redirects to the general liquidation page. https://docs.morpho.org/build/borrow/concepts/preliquidation

### Aave-native option (Aave V4 Position Managers)

- Contracts that users authorize, per position, to act for them. Governance must register each one with a Spoke, and custom contracts cannot register themselves. The docs list "automated liquidation protection and position adjustments" as a possible use. The only built-in managers are gateways and delegation, and the page names no live protection manager. https://www.aave.com/docs/aave-v4/positions/managers
- Unconfirmed: whether any third-party protection manager is registered on a V4 Spoke today.

### KeeperHub (workflow automation)

- The Aave V3 plugin reads health factor and can supply, withdraw, borrow and repay on Ethereum, Base, Arbitrum and Optimism. Its example "Auto-Repay on Low Health Factor" workflow runs every 5 minutes and repays below 1.2. It needs a connected wallet and a token approval. https://docs.keeperhub.com/plugins/aave-v3
- Aave V4 plugin: Lido Spoke on Ethereum only. Its example alerts on Discord below 1.5. There is no auto-repay example. https://docs.keeperhub.com/plugins/aave-v4
- Wallets are Turnkey keys held in secure enclaves, with key export. If no Safe is set as the sender, the workflow spends from that EOA. https://docs.keeperhub.com/wallet-management/turnkey
- Pricing: unconfirmed.

### Gelato

- Gelato Web3 Functions shut down on 31 Mar 2026, which ended the Typescript Functions, Solidity Functions and Automated Transactions products. This is from KeeperHub's migration guide (third-party); I found no Gelato announcement. https://docs.keeperhub.com/guides/gelato-migration
- Gelato's homepage now lists only paymaster/bundler, rollups and Turbo, with no Automate or Functions. https://www.gelato.cloud/
- Gelato's own legacy migration doc failed to load (expired TLS certificate).

### Summer.fi

- Shut down. Summer.fi Pro moved to DeFi Saver on 12 Feb 2026, and its automations stopped. https://summerfi.beehiiv.com/p/summer-pro-is-moving-to-defi-saver-lazy-summer-protocol-goes-all-in
- An exploit of about $6.04M on Lazy Summer USDC vaults on 6 Jul 2026 led to the shutdown. The interface was to stay up until 31 Aug (ForkLog, 16 Jul 2026). https://forklog.com/en/summer-fi-to-shut-down-interface-following-6-million-hack/
- Today the homepage says "The Summer.fi app has now been deactivated" and that Lazy Summer is withdraw-only. https://summer.fi

### Otomato automations

- The current product is alert-only. Its Aave and Morpho pages say it is read-only, never asks for signatures and cannot move funds. https://otomato.xyz/protocols/aave
- A "Builder Mode" ("Create your own on-chain agent") link exists, but builder.otomato.xyz did not open, so whether it can execute transactions is unconfirmed.
- An old v1 GitBook describes session-key automation (deposit, withdraw, swap; no repay listed). I saw it only in search results and did not open it, so its status is unconfirmed. https://otomato.gitbook.io/v1/overview/security-security-and-security

### TriggerX (Aave example)

- A self-hosted setup guide, not a hosted service. It tops up WETH collateral from your Safe when the health factor drops, runs on Optimism Sepolia by default, and needs your key in a local `.env`. It does not repay. https://triggerx.gitbook.io/triggerx-docs/ecosystem/aave-triggerx-automation-system

---

## 2b. Alert-only tools

### Tokenping (publisher)

- Health factor alerts for the connected wallet on Aave V3 and V4 and on Morpho Blue and Midnight. Read-only: never asks for approvals or signatures on Aave or Morpho. Signal, Telegram and email. Checks every 5 minutes. Price 3 USDC per 30 days on Arbitrum One, no auto-renew. Beta. https://tokenping.xyz
- Thresholds 1.1 to 10 on Aave (default 1.5) and down to 1.02 on Morpho. Covers 24 Aave V3 markets on 21 networks and 24 V4 Spokes. Midnight loans also get maturity reminders 7 days and 1 day before. https://github.com/romispectrum/tokenping (README, checked in the local repo at commit 76b7c31, 6 Nov 2026)
- **Inconsistency to fix before publishing:** the live homepage says "Every check below your line sends another message", which means every 5 minutes. The README and the 1b99914 blog commit say alerts repeat every 15 minutes while the health factor is below the threshold. The homepage copy is in `packages/nextjs/i18n/messages/home/en.ts` line 207.

### Otomato

- Finds Aave V3 positions from a pasted address (no wallet connection) on Ethereum, Arbitrum, Base, Polygon, Avalanche and Monad. Alerts on health factor (default 1.2, adjustable per position), distance to liquidation, rate spikes, depegs, governance and cap changes. Core monitoring is free; premium is planned for multi-wallet use and overnight phone-call escalation. https://otomato.xyz/protocols/aave
- Morpho Blue and MetaMorpho on Ethereum, Arbitrum, Base, HyperEVM and Monad, also read-only and free at the core. https://otomato.xyz/protocols/morpho
- Channels: iOS and Android apps, Telegram. The iOS app is version 1.0.24 dated "Sep 25", free, with Pro $9 and Pro+ $29 in-app purchases. https://apps.apple.com/us/app/otomato-wallet-tracker/id6759802179
- Check interval: not stated.

### HF Guard

- Beta and free during beta. Read-only from a pasted address, with no signatures. Covers Aave V3 (23 networks), Aave V4, Compound V3, Morpho Blue, Fluid Multiply, Euler V2, Jupiter Lend and Kamino Lend. Alerts when the risk level changes or the health factor crosses 2.0, 1.9, 1.8, 1.7 or 1.6. Telegram bot and web dashboard. "Checked periodically", and alerts are best-effort and may be delayed. https://hfguard.app
- Terms last updated April 2026: in beta, provided "as is", no liability for missed alerts. https://hfguard.app/terms

### DeFi Monitor (DeFi Risk Monitor)

- Beta. Covers Aave V3 and Spark (health factor), Morpho Blue (health factor, utilization, rates, pre-liquidation warnings), Compound V3 and Uniswap V3 LP. Networks: Ethereum, Arbitrum and Base. Telegram and Discord. Non-custodial and read-only. "Checks run continuously"; no interval is given. A free tier for early users. https://defi-monitor.com
- Paid plans: Pro $4.99 a month or $49.99 a year (10 addresses, 20 subscriptions); Ultra $9.99 a month or $99.99 a year (30 addresses, 60 subscriptions). https://defi-monitor.com/pricing
- Latest changelog entry: 22 Mar 2026 (Morpho Blue). Aave V3 checks triggered by on-chain events since 20 Feb 2026. https://defi-monitor.com/changelog

### Aave DeFi Watcher (Chrome extension)

- Version 1.0.0, updated 27 Jul 2026. Multiple addresses; Aave V3 and V4. Desktop notifications only when risk worsens. Stored locally, with no wallet connection. https://chromewebstore.google.com/detail/aave-defi-watcher/cpglkdkkmocpbbndolclhdmghjdcngdj
- Polls every 5 minutes by default (changeable). Aave V2, V3 and V4; V4 only on the Main Spoke on Ethereum. Six chains: Ethereum, Arbitrum, Optimism, Polygon, Base and Avalanche. Free and open source. https://aavewatcher.com

### Aave Monitor (Chrome extension, by No Trust Verify)

- Version 2.11.1, updated 24 Feb 2026. The toolbar badge shows a starred address's health factor: green above 2, orange 1 to 2, red below 1. Thresholds can be changed. Multiple Aave markets. Badge only, no push messages. https://chromewebstore.google.com/detail/aave-monitor/ccifbkellmfcbdngdnjimmfkclagbdii

### DeFi Saver Notify

- See section 1. It is an alert-only option inside DeFi Saver, with no automation needed.

### Ava (read-only mode)

- See 2a. Ava also works as an alert-only tool if you never turn on Auto mode.

---

## Could not confirm (8 Nov 2026)

- DeFi Saver: Aave V4 automation for EOAs (its own pages disagree); Aave V4 networks beyond Ethereum; whether Notify covers Morpho, Spark or Aave V4; Notify's cost and check interval.
- DeFi Saver: the Oct 2020 310k DAI incident (SlowMist page returned 403); whether the 10 Aug 2026 Liquidation Protection launch date appears in a DeFi Saver post (only a secondary source has it).
- Instadapp Protection Automation: whether it is still live, and on which networks.
- Aave V4: whether any protection Position Manager is registered.
- Gelato: a first-party shutdown notice for Web3 Functions.
- Otomato: what Builder Mode does, and its check interval. HF Guard and DeFi Monitor: check intervals. KeeperHub: pricing.
