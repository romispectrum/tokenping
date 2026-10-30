# Data snapshot: who-needs-health-factor-alerts

Figures behind `content/blog/who-needs-health-factor-alerts.mdx` and its translations. Morpho figures from
https://api.morpho.org/graphql, read on 30 Oct 2026 at 08:36 UTC. Re-read before changing a number.

## 1. Morpho liquidations, 30 Sep 2026 08:36 UTC to 30 Oct 2026 08:36 UTC

Query: `marketTransactions(where: { type_in: [Liquidation], timestamp_gte: 1790757360, timestamp_lte: 1793349360 })`,
paginated 1,000 at a time, every chain Morpho's API covers. `pageInfo.countTotal` = 7,521; 7,460 items came back over
the pages (the rest were added or reordered while paging), and every figure below is over those 7,460.

| Figure | Value |
| --- | --- |
| Liquidations (countTotal) | 7,521 |
| Distinct borrowers liquidated | 5,703 |
| Borrowers liquidated more than once | 932 |
| Debt repaid by liquidators | 21,484,557 USD |
| Bad debt recorded | 3,523,866 USD |
| Median repaid per liquidation | 20.21 USD |
| 75th percentile | 244.04 USD |
| 90th percentile | 2,272 USD |
| Largest | 3,003,921 USD |
| Under 100 USD | 5,001 |
| Under 1,000 USD | 6,363 |
| Over 10,000 USD | 301 |
| Between 00:00 and 06:00 UTC | 36.7% |

USD value: `repaidAssets` and `badDebtAssets` ÷ 10^decimals × the loan asset's `price.usd` at the time of reading (not
at the time of each liquidation), so the dollar totals are approximate for volatile loan assets; most loans are in
stablecoins.

By chain: Base 4,936; World Chain 1,971; Robinhood Chain 203; Ethereum 183; Arbitrum One 53; HyperEVM 39; Polygon 39;
Katana 14 (and fewer on others). Listed markets: 5,021 of 7,460.

Busiest days (UTC): 8 Oct 2026, 1,673; 30 Oct (until 08:36), 1,529; 29 Oct, 1,124; 15 Oct, 546; 24 Oct, 309. By weekday:
Thursday 3,609 (8 and 29 Oct were Thursdays), Friday 1,828, Saturday 526, Wednesday 426, Sunday 382, Tuesday 369,
Monday 320.

Most liquidated pairs (collateral / loan): WLD/USDC 1,696; cbXRP/USDC 1,136; WETH/USDC 1,037; cbETH/USDC 895;
cbBTC/USDC 707; JitoSOL/USDC 344.

## 2. Figures reused from other snapshots

- Aave Labs, "How Aave Liquidations Perform Under Volatile Conditions" (6 Feb 2026): more than 250M USD liquidated on
  Aave on 10 Oct 2025; 4.65B USD across 310,000+ liquidations from 2020 to Feb 2026 (`snapshots/wrapped-bitcoin-aave-collateral.md`).
- Aave froze every DAO-operated V3 and V4 market on 29 Oct 2026 (`snapshots/tokenized-stocks-collateral.md`).
- E-Mode loop at the limit on Ethereum Core: 95 ÷ 93 = 1.0215 (`snapshots/aave-e-mode.md`).
- Tokenized stock feeds pause about 52 hours each weekend (`snapshots/tokenized-stocks-collateral.md`).

## 3. Tokenping product facts used

Checks every 5 minutes; Aave threshold 1.1 to 10 (default 1.5), Morpho 1.02 to 10; a message on every check while below
the threshold, no snooze; Signal, Telegram and email, each in English, Czech, Spanish, Hindi, German or Vietnamese; one
alert per Aave V3 market, V4 Spoke or Morpho market; Midnight reminders 7 days and 1 day before maturity, then at every
check after maturity while debt remains; looking at positions needs no payment; beta, no uptime guarantee.

## 4. Not verified

- Aave's own liquidation count for the same 30 days (no public API query used).
- Why the bad debt was recorded (which markets); the article reports only the total.
