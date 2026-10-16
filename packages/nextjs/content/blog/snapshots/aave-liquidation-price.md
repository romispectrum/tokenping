# Data snapshot: aave-liquidation-price

Every on-chain, API and source figure used in `content/blog/aave-liquidation-price.mdx`, with the call, block or timestamp,
and source. Figures were first read on 2026-10-14 for the Aave fact sheet (`SCRATCH/mkt/aave-facts.md` §2, §5, §6, §7),
re-read by the writer the same evening, and read a third time just after midnight UTC (2026-10-15) while fixing review
findings. All times UTC.

RPCs: `https://ethereum-rpc.publicnode.com`, `https://arbitrum-one-rpc.publicnode.com` (read-only `eth_call` with Foundry
`cast` 1.1.0). Scripts: `SCRATCH/mkt/scripts/aave_params_mc.sh` (one Multicall3 `aggregate` call per chain, so all values in
a chain's rows share one block), `aave_rates.sh` and `SCRATCH/mkt/writer-liqprice-scripts/reread_fix.sh` (third read; every
call pinned with `--block`). Raw outputs: `SCRATCH/mkt/aave-raw/*_2026-10-14.txt` (first read),
`SCRATCH/mkt/writer-liqprice-raw/*_recheck.txt` (second read) and `writer-liqprice-raw/reread_fix_{eth,arb}.txt`,
`usdc_rates_series.txt` (third read).

## 1. Aave V3 risk parameters (PoolDataProvider `getReserveConfigurationData(address)`)

Ethereum Core PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (registered in AddressesProvider
`0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e`; confirmed by `getPoolDataProvider()` at block 26194004).
Arbitrum PoolDataProvider `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` (AddressesProvider `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb`).

| Market        | Asset (address)                                          | LTV (bps) | LT (bps) | Bonus (bps) | Status                         | First read                                           | Re-read                                                        |
| ------------- | -------------------------------------------------------- | --------- | -------- | ----------- | ------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| Ethereum Core | WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`        | 8050      | 8300     | 10500 (5%)  | active, not frozen, not paused | block 26193284 (ts 1792011527 = 2026-10-14 20:58:47) | block 26194002 (ts 1792020167 = 23:22:47), unchanged           |
| Ethereum Core | WBTC `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`        | 7300      | 7800     | 10500       | active, not frozen, not paused | 26193284                                             | 26194002, unchanged                                            |
| Ethereum Core | USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`        | 7500      | 7800     | 10450       | active, not frozen, not paused | 26193284                                             | 26194002, unchanged                                            |
| Arbitrum      | WETH `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`        | 8000      | 8400     | 10500       | active, not frozen, not paused | Arbitrum block 514855406 (ts 1792011537 = 20:58:57)  | Arbitrum block 514886024 (ts 1792020180 = 23:23:00), unchanged |
| Arbitrum      | WBTC `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`        | 7300      | 7800     | 10700       | active, not frozen, not paused | 514855406                                            | 514886024, unchanged                                           |
| Arbitrum      | USDC native `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | 7500      | 7800     | 10500       | active, not frozen, not paused | 514855406                                            | 514886024, unchanged                                           |

Third read, all six rows unchanged (same LTV, LT, bonus, reserve factor and flags): Ethereum block 26194239
(ts 1792023011 = 2026-10-15 00:10:11) and Arbitrum block 514896811 (ts 1792023220 = 2026-10-15 00:13:40).

Used in the article: LT/LTV table; WETH LT 83% and LTV 80.5% (Ethereum Core examples); WBTC LT 78% (two-collateral example);
USDC LT 78% (volatile-debt example); WETH LT 84% on Arbitrum (own-position example); WETH bonus 5% (Ethereum Core).

## 2. E-Mode category 1, Ethereum Core Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`

| Call                                                    | Value                                                                                                                                                                                                                                                                                                                                                         | First read                                                       | Re-read                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| `getEModeCategoryLabel(1)`                              | "ETH correlated"                                                                                                                                                                                                                                                                                                                                              | block 26193288 (start of `aave_emode.sh` run)                    | blocks 26194004 and 26194239, same  |
| `getEModeCategoryCollateralConfig(1)` (ltv, lt, bonus)  | (9300, 9500, 10100) → LTV 93%, LT 95%, bonus 1%                                                                                                                                                                                                                                                                                                               | 26193288                                                         | 26194004 and 26194239, same         |
| `getIsEModeCategoryIsolated(1)`                         | false                                                                                                                                                                                                                                                                                                                                                         | 26193288                                                         | 26194004 and 26194239, same         |
| `getEModeCategoryCollateralBitmap(1)`                   | 2952790659 = bits 0, 1, 7, 9, 28, 29, 31 → WETH `0xC02a…6Cc2`, wstETH `0x7f39…2Ca0`, cbETH `0xBe98…9704`, rETH `0xae78…6393`, weETH `0xCd5f…b7ee`, osETH `0xf1C9…0E38`, ETHx `0xA35b…A15b` (ids mapped with `getReserveAddressById`, symbols from each token's `symbol()` at block 26194239; ids match `getReservesList` in `aave-raw/eth_reserves_list.txt`) | 26193288 (`aave-raw/eth_emode_2026-10-14.txt`)                   | 26194239, same                      |
| `getEModeCategoryBorrowableBitmap(1)`                   | 1 = bit 0 → WETH only                                                                                                                                                                                                                                                                                                                                         | 26193288                                                         | 26194239, same                      |
| `getEModeCategoryLtvzeroBitmap(1)`                      | 2147483648 = bit 31 → ETHx has LTV 0 inside the category (its LT stays 95%)                                                                                                                                                                                                                                                                                   | not read on 2026-10-14                                           | 26194239 (first read of this value) |
| `POOL_REVISION()`                                       | 11 (v3.7)                                                                                                                                                                                                                                                                                                                                                     | aave-facts §1.2, block 26193328                                  | 26194004 and 26194239, 11           |
| E-Mode LT applies only to the category's collateral set | `GenericLogic.calculateUserAccountData`: `eModeLiqThreshold` is used only when `userEModeCategory != 0 && isReserveEnabledOnBitmap(eModeCollateralBitmap, i)`; otherwise the asset's own LT                                                                                                                                                                   | aave-v3-origin `main`, `aave-raw/GenericLogic.sol` lines 126-133 | n/a                                 |

The article's earlier wording "in E-Mode the category's threshold replaces the asset's own" was too broad and was corrected
to "only for assets in the category's collateral set; any other collateral keeps its own threshold" (review fix).

## 3. Oracle prices and the USDC price cap (AaveOracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2`, 8 decimals USD)

Oracle address from `AddressesProvider.getPriceOracle()` at blocks 26194004 and 26194239.

| Call                     | First read, block 26193376 (ts 1792012631 = 21:17:11)                      | Re-read, block 26194004 (ts 1792020191 = 23:23:11) | Third read, block 26194239 (2026-10-15 00:10:11)          |
| ------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `getAssetPrice(WETH)`    | 241478089323 → $2,414.78 (quoted in the article)                           | 241555715191 → $2,415.56                           | 241555715191 → $2,415.56                                  |
| `getAssetPrice(WBTC)`    | 8152844111893 → $81,528.44 (quoted in the article)                         | 8143954806976 → $81,439.55                         | 8137326673500 → $81,373.27                                |
| `getAssetPrice(USDC)`    | 99987936 → $0.99988                                                        | 99987936 → $0.99988                                | 99987936 → $0.99988                                       |
| `getSourceOfAsset(USDC)` | not recorded                                                               | not read                                           | `0x3f73F03aa83B2A48ed27E964eD0fDb590332095B`              |
| adapter `description()`  | not recorded                                                               | not read                                           | "Capped USDC / USD"                                       |
| adapter `getPriceCap()`  | 104000000 → $1.04 (`aave-raw/oracle_eth_2026-10-14.txt`; block not pinned) | not read                                           | 104000000 → $1.04 (quoted in the article with this block) |
| adapter `latestAnswer()` | not recorded                                                               | not read                                           | 99987936 → $0.99988                                       |

The article uses **illustrative** prices ($2,400 ETH, $81,500 WBTC, USDC $1.00) and prints the oracle reads next to them. With
the oracle's USDC price ($0.99988) instead of $1.00, the headline example's liquidation price is 12,000 × 0.99987936 ÷ 8.3 =
$1,445.61 rather than $1,445.78; the short answer now says "counting USDC at $1.00".

## 4. Interest rates, Ethereum Core (PoolDataProvider `getReserveData(address)`, ray → % APR)

| Block (time)                        | USDC variable borrow / supply | USDC utilisation (variable debt ÷ aToken supply) | WETH variable borrow / supply | Used in the article                    |
| ----------------------------------- | ----------------------------- | ------------------------------------------------ | ----------------------------- | -------------------------------------- |
| 26193378 (2026-10-14 21:17)         | 4.496% / 3.800%               | not recorded                                     | 1.943% / 1.309%               | yes: the one-year interest example     |
| 26194007 (23:23:47)                 | 4.496% / 3.801%               | not recorded                                     | 1.943% / 1.309%               | bounds the spike below                 |
| 26194180 (ts 1792022303 = 23:58:23) | 14.101% / 12.660%             | 2,243.2M ÷ 2,248.5M = 99.77%                     | not read                      | yes: "hit 14.1% for less than an hour" |
| 26194239 (2026-10-15 00:10:11)      | 4.762% / 4.035%               | 2,243.3M ÷ 2,382.4M = 94.16%                     | 1.943% / 1.309%               | bounds the spike above                 |

The spike lies inside the 46-minute window between the 23:23:47 and 00:10:11 reads, hence "less than an hour". A reviewer also
reported 4.496% at block 26194050 and 14.17% / 14.11% at blocks 26194100 and 26194131; the public RPC no longer served state for
those blocks when the writer tried to re-read them (pruned node, about 128 blocks of history), so the article relies only on
the writer's own reads above. Raw: `writer-liqprice-raw/usdc_rates_series.txt`, `reread_fix_eth.txt`, `rates_recheck.txt`.

## 5. Aave V4 (API; Tokenping monitors V4 Spokes since 2026-10-16)

| Figure                                        | Value                                                                                                          | Endpoint / source                                                                                       | As of              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------ |
| WETH collateral factor per Spoke, Ethereum    | Main 0.8300 (max liquidation bonus 0.0555); Bluechip 0.8600; Kelp, Lido, Etherfi 0.0000 (not collateral there) | `https://api.v4.aave.com/graphql` `reserves` query, snapshot `aave-raw/v4_eth_reserves_2026-10-14.json` | 2026-10-14         |
| V4 live networks                              | Ethereum (2026-03-30), Avalanche (2026-07-15), Arc (2026-09-16), Base (2026-10-07)                             | https://aave.com/docs/resources/changelog.md                                                            | fetched 2026-10-14 |
| Liquidation eligibility                       | "Below 1.0: The position becomes eligible for liquidation"                                                     | https://aave.com/docs/aave-v4/positions.md (aave-raw/aave-v4_positions.md)                              | fetched 2026-10-14 |
| Dynamic risk configuration; User Risk Premium | as described in aave-facts §1.3                                                                                | https://github.com/aave/aave-v4/blob/main/docs/overview.md                                              | fetched 2026-10-14 |

The per-Spoke values back the article's "a single collateral factor for each asset in each Spoke".

## 6. Incidents and documents

| Figure                                | Value                                                                                                                                                   | Source                                                                                                                                                                                                                                            | Fetched    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| wstETH CAPO error                     | ~2.85% cut to the effective exchange rate; ~10,938 wstETH of E-Mode liquidations; 34 accounts; positions with HF below ~1.0288; Ethereum Core and Prime | Chaos Labs post-mortem, posted 2026-03-10T19:50:36Z, https://governance.aave.com/t/post-mortem-exchange-rate-misallignment-on-wsteth-core-and-prime-instances/24269 (aave-raw/gov_wsteth_capo_postmortem.json; quotes checked)                    | 2026-10-14 |
| USDC depeg, March 2023                | "2023-03-11 ~8:00 UTC: The price of USDC reaches a low of around 88 cents"; the FAQ adds "The USDC oracle price was near its low of 88 cents"           | Gauntlet, "Aave Resilient Through USDC Volatility", 2023-03-17, https://governance.aave.com/t/aave-resilient-through-usdc-volatility/12330 (copies: `aave-raw/gov_usdc_volatility_2023.json`, `writer-liqprice-raw/gauntlet.txt` lines 10 and 44) | 2026-10-14 |
| Liquidator may repay part or all      | 100% of the chosen debt reserve by default; 50% of total debt only when HF > 0.95 and both reserves are at least $2,000                                 | aave-v3-origin `LiquidationLogic.sol` (aave-facts §0.4, §4.2)                                                                                                                                                                                     | 2026-10-14 |
| Aave app labels                       | Asset page shows "Oracle price" (header) and "Max LTV", "Liquidation threshold", "Liquidation penalty" under "Collateral usage"                         | aave/interface `main` @ `2cda3da262537544e9c91aa68cce8769679f1427` (committed 2026-10-14T13:50:52Z): `src/modules/reserve-overview/SupplyInfo.tsx` lines 266-272, `ReserveTopDetails.tsx` line 58 (copies in `SCRATCH/mkt/writer-liqprice-raw/`)  | 2026-10-14 |
| HF formula, liquidation below HF 1.00 | `GenericLogic.calculateUserAccountData`, `HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1e18`                                                                   | aave-v3-origin `main` (aave-facts §2, §4.1)                                                                                                                                                                                                       | 2026-10-14 |

**Correction (review fix).** An earlier version of this snapshot said the $0.88 USDC figure in aave-facts §5.4 did not appear in
the Gauntlet thread. That was wrong: the thread records a low of around 88 cents at about 08:00 UTC on 2023-03-11 (quoted above),
so aave-facts §5.4 is correct. The article now states it as a dated fact ("on 11 March 2023 it fell to a low of around 88 cents")
and keeps the $0.88 arithmetic.

## 7. Worked arithmetic (recomputed by the writer with Python, 2026-10-14 and again 2026-10-15)

| Case                               | Inputs                                                  | Results                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One collateral (Ethereum Core)     | 10 WETH × $2,400, LT 0.83, LTV 0.805, debt 12,000 USDC  | HF 1.66; liquidation price 12,000 ÷ 8.3 = $1,445.783 → $1,445.78; 2,400 ÷ 1.66 = $1,445.78; fall 39.76% → 39.8%; with USDC at the oracle's $0.99988: $1,445.61                                                                      |
| Max borrow                         | debt 24,000 × 0.805 = $19,320                           | HF 19,920 ÷ 19,320 = 1.0311; liquidation price $2,327.71; fall 3.01%                                                                                                                                                                |
| Two collaterals                    | + 0.2 WBTC × $81,500, LT 0.78; debt 20,000              | weighted 19,920 + 12,714 = 32,634; HF 1.6317 → 1.632; ETH alone $877.83 (−63.4%); WBTC alone 80 ÷ 0.156 = $512.82 (−99.4%); both together factor 0.61286 → −38.71%, ETH $1,470.86, WBTC $49,947.9 → $49,948                         |
| Volatile debt                      | 10,000 USDC × LT 0.78; 2.5 WETH debt at $2,400 = $6,000 | HF 1.30; ETH liquidation price 7,800 ÷ 2.5 = $3,120 (+30%); USDC at $0.88: HF 6,864 ÷ 6,000 = 1.144, ETH liquidation price 6,864 ÷ 2.5 = $2,745.60                                                                                  |
| E-Mode illustration                | wstETH worth 100 ETH, LT 0.95, debt 90 WETH             | HF 1.0556 → 1.056; ratio fall to HF 1 = 1 − 90/95 = 5.26% → 5.3%; max borrow 93 WETH: HF 1.0215, fall 2.11% → 2.1%                                                                                                                  |
| Interest, 1 year at constant rates | borrow 4.496% APR, supply 1.309% APR                    | compounded per second: debt 12,551.8, collateral 10.1318 WETH, HF 1.6079, liquidation price $1,492.60; simple: 12,539.5 / 10.1309 / 1.6094 / $1,491.26. Article: "from $1,445.78 to about $1,490" (HF drift detail left to post #5) |
| LT cut (hypothetical)              | 83% → 80%                                               | 12,000 ÷ 8.0 = $1,500.00 (= 1,445.78 × 83/80)                                                                                                                                                                                       |
| Distance table                     | 1 − 1/HF                                                | 1.25 → 20%; 1.5 → 33.3%; 2.0 → 50%                                                                                                                                                                                                  |
| Alert conversion                   | act at ETH $1,800                                       | 1,800 ÷ 1,445.78 = 1.245 (= 10 × 1,800 × 0.83 ÷ 12,000)                                                                                                                                                                             |
| Arbitrum example                   | 5 WETH × $2,400, LT 0.84; debt 7,000                    | HF 10,080 ÷ 7,000 = 1.44; liquidation price 7,000 ÷ 4.2 = $1,666.67 (= 2,400 ÷ 1.44); fall 30.56% → 30.6%; at LT 0.83: 7,000 ÷ 4.15 = $1,686.75                                                                                     |

## 8. Product facts used (from `SCRATCH/mkt/product.md`)

| Fact                                                                                               | Source                                              |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Checks every 5 minutes                                                                             | P§4.1 (`vercel.json`, `constants/notifications.ts`) |
| On every check while below threshold, one message to each selected channel (Signal, email or both) | P§4.2 step 3, P§4.3                                 |
| Threshold range 1.1-10, one config per wallet per network                                          | P§4.5, P§4.6                                        |
| No liquidation-price or asset-price alerts                                                         | P§10.5                                              |
| Aave V3 and V4 (V4 since 2026-10-16, `AAVE_V4_SPOKES`); Signal and email channels in articles      | P§10.1, P§10.2, build spec owner decision           |
