# Data snapshot: safe-aave-health-factor

Post: `content/blog/safe-aave-health-factor.mdx` ("What is a safe health factor on Aave?"), published 2026-10-14.
Every on-chain, API and dated figure the post uses, with the call, the block or fetch time, and the source. Figures come from the
research fact sheet (`aave-facts.md`, read 2026-10-14) and were re-read by the writer on 2026-10-14 between 23:19 and 23:34 UTC
(block times below). All of those reads were read-only `eth_call`s through PublicNode RPCs (`https://ethereum-rpc.publicnode.com`,
`https://arbitrum-one-rpc.publicnode.com`) with Foundry `cast`. On 2026-10-15 at 00:12 UTC the oracle values in §3 were read again
with every call pinned to the original blocks (archive node `https://eth.drpc.org`, because PublicNode refuses historical state) so
that the raw output carries its block number. Nothing in the post depends on a value that changed between reads.

Raw outputs are kept in the marketing scratch folder (`aave-raw/` for the research reads, `w2-safe-hf/` for the writer's re-reads).
Some writer files are named `_2026-10-15` after the local (UTC+2) date; the block timestamps inside them are 2026-10-14 UTC.

## 1. Aave V3 risk parameters (LTV, liquidation threshold)

Call: one Multicall3 `aggregate` (`0xcA11bde05977b3631167028862bE2a173976CA11`) per chain wrapping
`getReserveConfigurationData(asset)`, `getLiquidationProtocolFee(asset)`, `getReserveCaps(asset)` and `getPaused(asset)` on the market's
current PoolDataProvider, so all values in a chain's rows come from one block. Raw units: basis points (bonus 10500 = 105.00%).

- Ethereum Core PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (AddressesProvider `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e`)
  - Research read: block **26193284**, 2026-10-14 20:58:47 UTC (`aave-raw/eth_params_2026-10-14.txt`)
  - Writer re-read: block **26193988**, 2026-10-14 23:19:59 UTC (`w2-safe-hf/eth_params_2026-10-15.txt`)
- Arbitrum PoolDataProvider `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` (AddressesProvider `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb`)
  - Research read: Arbitrum block **514855406** (`ArbSys.arbBlockNumber`), 2026-10-14 20:58:57 UTC (`aave-raw/arb_params_2026-10-14.txt`)
  - Writer re-read: Arbitrum block **514885451**, 2026-10-14 23:20:15 UTC (`w2-safe-hf/arb_params_2026-10-15.txt`)

| Market        | Asset                                                      | LTV  | LT   | Bonus | Protocol fee (of bonus) | Paused | Frozen | Both reads equal? |
| ------------- | ---------------------------------------------------------- | ---- | ---- | ----- | ----------------------- | ------ | ------ | ----------------- |
| Ethereum Core | WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`          | 8050 | 8300 | 10500 | 1000                    | false  | false  | yes               |
| Ethereum Core | WBTC `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`          | 7300 | 7800 | 10500 | 1000                    | false  | false  | yes               |
| Ethereum Core | USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`          | 7500 | 7800 | 10450 | 2000                    | false  | false  | yes               |
| Arbitrum      | WETH `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`          | 8000 | 8400 | 10500 | 1000                    | false  | false  | yes               |
| Arbitrum      | WBTC `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`          | 7300 | 7800 | 10700 | 1000                    | false  | false  | yes               |
| Arbitrum      | USDC (native) `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | 7500 | 7800 | 10500 | 1000                    | false  | false  | yes               |

Used in the post: WETH LT 83% / LTV 80.5% (Ethereum Core), WBTC 78% / 73%, USDC 78% / 75%, Arbitrum WETH 84% / 80%, WBTC and USDC
78% / 73% and 78% / 75%. The post prints block 26193284 next to the WETH and USDC thresholds and both block pairs under the max-borrow
table. The bonus and protocol-fee columns are kept for reference; the post no longer quotes a bonus percentage.
Sources: https://etherscan.io/address/0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD ·
https://arbiscan.io/address/0x243Aa95cAC2a25651eda86e80bEe66114413c43b

## 2. E-Mode "ETH correlated" (LTV 93%, LT 95%)

Calls on the Pool: `getEModeCategoryLabel(uint8)`, `getEModeCategoryCollateralConfig(uint8)` → `(ltv, lt, bonus)`,
`getIsEModeCategoryIsolated(uint8)`; plus `POOL_REVISION()`.

| Market        | Pool                                         | Category              | Result                                                | Research read                                                                 | Writer re-read                                                                    |
| ------------- | -------------------------------------------- | --------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Ethereum Core | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | id 1 "ETH correlated" | (9300, 9500, 10100), isolated false; POOL_REVISION 11 | block 26193288 (start of scan; `aave-raw/eth_emode_2026-10-14.txt`)           | block 26193990, 23:20:23 UTC (`w2-safe-hf/emode_2026-10-14_reread.txt`)           |
| Arbitrum      | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | id 2 "ETH correlated" | (9300, 9500, 10100), isolated false; POOL_REVISION 11 | Arbitrum block 514855561 (start of scan; `aave-raw/arb_emode_2026-10-14.txt`) | Arbitrum block 514885562, 23:20:47 UTC (`w2-safe-hf/emode_2026-10-14_reread.txt`) |

Collateral set of Ethereum Core id 1 (WETH, wstETH, cbETH) and borrowable set (WETH only): from `aave-facts.md` §6.1 (bitmaps read
2026-10-14), not re-read. The post names wstETH and cbETH as collateral with WETH borrowed for that row, and prints block 26193288 in
the E-Mode paragraph and all four blocks under the max-borrow table.
Sources: https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2 ·
https://arbiscan.io/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD

## 3. Oracle prices and the USDC cap (Ethereum Core)

- Research read at Ethereum block **26193376** (2026-10-14 21:17:11 UTC; `aave-facts.md` §7, `aave-raw/oracle_eth_2026-10-14.txt`):
  WETH 241478089323 (8 decimals) = **$2,414.78**; USDC 99987936 = $0.99988; USDC adapter `getPriceCap()` = 104000000 = **$1.04**.
  The post uses ETH = $2,400 as an illustrative round number and prints the $2,414.78 read next to it.
- Writer re-read at Ethereum block **26194054** (2026-10-14 23:33:11 UTC). The first saved output of that read
  (`w2-safe-hf/oracle_reread.txt`) kept only the USDC line, without the block number or the WETH price, so on 2026-10-15 00:12 UTC the
  same calls were run again pinned to `--block 26194054` and to `--block 26193376` (`w2-safe-hf/oracle_reread_block26194054.txt`):
  - `PoolAddressesProvider.getPriceOracle()` = AaveOracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2`
  - `getAssetPrice(WETH)` = 241555715191 ($2,415.56; not used in the post) at 26194054, and 241478089323 at 26193376
  - `getSourceOfAsset(USDC)` = `0x3f73F03aa83B2A48ed27E964eD0fDb590332095B` ("Capped USDC / USD") at both blocks
  - that adapter's `getPriceCap()` = 104000000 (**$1.04**) at both blocks; `getAssetPrice(USDC)` = 99987936 at 26194054
- Prices above the cap are ignored; prices below $1 pass through (`PriceCapAdapterStable.latestAnswer`, `aave-facts.md` §5.4).
  Sources: https://etherscan.io/address/0x54586bE62E3c3580375aE3723C145253060Ca0C2 ·
  https://etherscan.io/address/0x3f73F03aa83B2A48ed27E964eD0fDb590332095B · https://github.com/aave-dao/aave-price-feeds

## 4. Interest rates (Ethereum Core)

Call: `PoolDataProvider.getReserveData(asset)` fields `liquidityRate` and `variableBorrowRate` (ray → % APR).

| Asset                    | Research read, block 26193378 | Writer re-read, block 26194004 (2026-10-14 23:23:11 UTC) |
| ------------------------ | ----------------------------- | -------------------------------------------------------- |
| USDC variable borrow APR | 4.496%                        | 4.496%                                                   |
| USDC supply APR          | 3.800%                        | 3.801%                                                   |
| WETH supply APR          | 1.309%                        | 1.309%                                                   |
| WETH variable borrow APR | 1.943%                        | 1.943%                                                   |

Post: "At 14 Oct 2026 rates on Aave's Ethereum Core market (block 26193378), interest would take roughly 3% a year off the health
factor of a position with WETH collateral and USDC debt", and the reverse position (USDC supplied, WETH borrowed) "drifts up
instead". No rate figure is printed; the full example belongs to `why-aave-health-factor-dropped`.

## 5. Derived arithmetic (computed by the writer; Python, re-run 2026-10-15)

- Price fall to HF 1.00 with one volatile collateral and stablecoin debt: 1 − 1/HF.
  1.1 → 9.09%; 1.2 → 16.67%; 1.3 → 23.08%; 1.5 → 33.33%; 1.66 → 39.76%; 2.0 → 50%; 3.0 → 66.67%.
  ETH price at HF 1.00 from $2,400: 2,400 ÷ HF → $2,181.82, $2,000.00, $1,846.15, $1,600.00, $1,445.78, $1,200.00, $800.00.
- First table row: 83 ÷ 80.5 = 1.031056 (printed as "83 ÷ 80.5 ≈ 1.031"); 2,400 × 80.5 ÷ 83 = **$2,327.71**; fall 1 − 80.5/83 = 3.01%.
  (2,400 ÷ the rounded 1.031 would give $2,327.84, which is why the row shows the exact ratio.)
- Example A (Ethereum Core): 10 WETH × $2,400 = $24,000; HF = 24,000 × 0.83 ÷ 12,000 = **1.66**; liquidation price
  12,000 ÷ (10 × 0.83) = **$1,445.78** (−39.76%).
- Max borrow: 24,000 × 0.805 = $19,320; HF = 19,920 ÷ 19,320 = **1.0311**; liquidation price 19,320 ÷ (10 × 0.83) = **$2,327.71** (−3.01%).
- HF at the borrow limit = LT ÷ LTV; move to HF 1.00 = 1 − LTV/LT (fall) or LT/LTV − 1 (rise):
  ETH Core WETH 1.0311 / 3.01% fall; WBTC 1.0685 / 6.41% fall; USDC 1.04 / 4.0% rise;
  Arbitrum WETH 1.05 / 4.76% fall; WBTC 1.0685 / 6.41%; USDC 1.04 / 4.0% rise; E-Mode 95/93 = 1.0215 / 2.11% fall.
- Volatile debt (Example C): 10,000 × 0.78 ÷ 6,000 = **1.30**; reaches 1.00 after a rise of HF − 1 = 30% → ETH $2,400 × 1.3 = **$3,120**;
  at USDC $0.88: 8,800 × 0.78 ÷ 6,000 = **1.144**. At HF 1.5 the rise is 50%.
- USDC cap: a $1.04 cap means USDC debt is valued at most 4% above $1.
- Threshold choice: HF at ETH $2,000 = 1.66 × 2,000 ÷ 2,400 = **1.3833**; further fall left to $1,445.78 = 1 − 1,445.78 ÷ 2,000 = **27.71%**.
  Threshold leaving a further fall f = 1 ÷ (1 − f): 10% → 1.111; 15% → 1.176; 20% → 1.25; 25% → 1.333; 33.3% → 1.5.
- Interest drift over one year at constant rates and prices, WETH collateral / USDC debt: HF factor = e^(0.01309 − 0.04496) = 0.9686,
  i.e. about **3.1% lower** (simple-interest check 1.01309 ÷ 1.04496 = 0.9695, 3.05% lower). Printed as "roughly 3% a year".
- Reverse drift, USDC collateral / WETH debt: e^(0.03800 − 0.01943) = 1.0187, so HF 1.30 → about 1.32 (matches
  `why-aave-health-factor-dropped`). Printed only as "drifts up instead".

## 6. Dated facts from documents (not chain reads)

| Fact in the post                                                                                                                                                                                                                                | Source                                                                                                                                                                                                                                                                                                                                                                        | Fetched / dated |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| "no universally 'safe' health factor"; depends on volatility and correlation; lower HF may be acceptable for correlated assets; liquidations highly competitive, often custom bots that react to oracle changes with high-priority transactions | https://aave.com/help/borrowing/liquidations (writer fetched it at 2026-10-14 23:19 UTC; HTTP 200; text in `w2-safe-hf/help_liquidations.txt` lines 18, 34-35)                                                                                                                                                                                                                | 2026-10-14      |
| HF formula; liquidation below 1.00; borrows capped by collateral × LTV                                                                                                                                                                          | aave-v3-origin `GenericLogic.sol`, `ValidationLogic.sol` (main) via `aave-facts.md` §2-§3                                                                                                                                                                                                                                                                                     | 2026-10-14      |
| A liquidator repays part or all of the debt; the borrower loses collateral worth the repaid amount plus the liquidation bonus                                                                                                                   | aave-v3-origin `LiquidationLogic.sol` (main) via `aave-facts.md` §4.2-§4.3                                                                                                                                                                                                                                                                                                    | 2026-10-14      |
| On V3 a liquidation threshold cut applies at once to every open position                                                                                                                                                                        | `aave-facts.md` §5.3; https://github.com/aave/aave-v4/blob/main/docs/overview.md (Dynamic Risk Configuration, first paragraph)                                                                                                                                                                                                                                                | 2026-10-14      |
| V4: one collateral factor per collateral, no separate LTV and LT                                                                                                                                                                                | `aave-facts.md` §1.3; https://github.com/aave/aave-v4/blob/main/docs/overview.md (Dynamic Risk Configuration: CF, LB, LF); https://github.com/aave/aave-v4/blob/main/src/spoke/Spoke.sol (HF weighted by `collateralFactor`, no LTV). Not cited to aave.com/docs/aave-v4/positions.md, whose bullets still mention LTV and liquidation thresholds (stale, `aave-facts.md` §9) | 2026-10-14      |
| USDC low of around $0.88 on 2023-03-11 (~08:00 UTC)                                                                                                                                                                                             | Gauntlet, https://governance.aave.com/t/aave-resilient-through-usdc-volatility/12330 (posted 2023-03-17; writer checked the timeline line in `aave-raw/gov_usdc_volatility_2023.json`)                                                                                                                                                                                        | 2026-10-14      |
| CAPO error ~2.85% on Ethereum Core and Prime, enough to liquidate tightly levered E-Mode loops (post-mortem: ~10,938 wstETH across 34 accounts with HF below ~1.0288; the post now prints only the 2.85%)                                       | Chaos Labs, https://governance.aave.com/t/24269 (posted 2026-03-10; writer checked the text in `aave-raw/gov_wsteth_capo_postmortem.json`)                                                                                                                                                                                                                                    | 2026-10-14      |
| Repay at HF 1.01, repeated errors, liquidated (May 2021)                                                                                                                                                                                        | https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067 (post 2021-05-18)                                                                                                                                                                                                                                                                              | 2026-10-14      |
| 1 hour+ of pending repay attempts, then liquidation (December 2024)                                                                                                                                                                             | https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379 (post 2024-12-23)                                                                                                                                                                                                                                                             | 2026-10-14      |

## 7. Tokenping product facts used

| Fact                                                                               | Code reference (packages/nextjs)                                                                                                              |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Check every 5 minutes                                                              | `vercel.json` cron `*/5 * * * *`; `constants/notifications.ts` `NOTIFICATION_CHECK_INTERVAL_MINUTES = 5`                                      |
| Threshold per network, range 1.1-10, default 1.5                                   | `constants/notifications.ts`; one config per (wallet, chain) in `packages/supabase/migrations/20250225120000_create_notification_configs.sql` |
| Message every 5 minutes per channel while below the threshold                      | `services/notifications/runNotificationCheck.ts` (no cooldown or dedupe)                                                                      |
| Channels named in the post: Signal and email only                                  | blog build spec owner decision                                                                                                                |
| Dashboard labels ("Safe", "Risky")                                                 | `constants/notifications.ts`, `components/custom/HealthFactorBadge.tsx`                                                                       |
| Aave V3 only, one Pool per network (Ethereum: Core, not Prime, EtherFi or Horizon) | `config/aaveConfig.ts`; product.md §10.1; `aave-facts.md` §1.2, §11                                                                           |
