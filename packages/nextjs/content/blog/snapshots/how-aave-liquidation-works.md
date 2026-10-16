# Data snapshot: how-aave-liquidation-works

Post: `content/blog/how-aave-liquidation-works.mdx` (published 2026-10-14). Every on-chain value, code constant, API value and
dated incident figure the post states is listed here with its call or source, block or timestamp, and URL.

- Fact-sheet reads: 2026-10-14 ~20:58-21:23 UTC (`SCRATCH/mkt/aave-facts.md` §1.3, §4, §6.1, §7; raw output in
  `SCRATCH/mkt/aave-raw/`).
- Writer re-read: 2026-10-14 ~23:20-23:23 UTC (the same publish day in UTC), with the same scripts and RPCs. **Every re-read value
  matched the fact sheet.** Raw output: `SCRATCH/writer-liq/{eth_params_reread,arb_params_reread,v4_main_spoke_reread,eth_emode1_reread}.txt`.
- RPCs: `https://ethereum-rpc.publicnode.com`, `https://arbitrum-one-rpc.publicnode.com`. Tool: Foundry `cast` (read-only `eth_call`).
- Review revision: 2026-10-15 ~00:15 UTC (local 02:15). Reviewer findings checked against the code and docs; the post now
  states the fee on a collateral shortfall, the $1,260 lower bound of the 100% band, the five liquidation checks, the V4 dust
  exception (no number), and uses the v3.3 docs' own close-factor example. No on-chain figure changed. Raw output of the one
  confirmation read: `SCRATCH/writer-liq/r2/usdce_reread.txt`.
- Re-read every on-chain figure below before updating the post. Governance and risk stewards can change them at any time.

## 1. Aave V3 reserve parameters (bonus table, worked example, bad-debt example)

Call: one Multicall3 `aggregate` per chain (`SCRATCH/mkt/scripts/aave_params_mc.sh`) to the current PoolDataProvider,
`getReserveConfigurationData(asset)` (LTV, LT, bonus in bps) and `getLiquidationProtocolFee(asset)` (bps of the bonus), plus `getPaused(asset)`.

| Market | Asset | LT | Bonus | Protocol fee (of bonus) | Paused | Fact-sheet block (UTC) | Writer re-read block (UTC) |
|---|---|---|---|---|---|---|---|
| Ethereum Core | WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 8300 (83%) | 10500 (5%) | 1000 (10%) | false | 26193284 (2026-10-14 20:58:47) | 26193992 (2026-10-14 23:20:47) |
| Ethereum Core | WBTC `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 7800 | 10500 (5%) | 1000 (10%) | false | 26193284 | 26193992 |
| Ethereum Core | USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 7800 | 10450 (4.5%) | 2000 (20%) | false | 26193284 | 26193992 |
| Arbitrum | WETH `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` | 8400 | 10500 (5%) | 1000 (10%) | false | arb 514855406 (20:58:57) | arb 514885618 (23:21:05) |
| Arbitrum | WBTC `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f` | 7800 | 10700 (7%) | 1000 (10%) | false | arb 514855406 | arb 514885618 |
| Arbitrum | USDC native `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | 7800 | 10500 (5%) | 1000 (10%) | false | arb 514855406 | arb 514885618 |
| Arbitrum | USDC.e bridged `0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8` | 7800, LTV 0, **frozen** | 10500 | 1000 | false | arb 514855406 | confirmation only: arb 514897596 (2026-10-15 00:17 UTC), LTV 0, LT 7800, bonus 10500, frozen, not paused |

- Ethereum PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (AddressesProvider `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e`):
  https://etherscan.io/address/0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD
- Arbitrum PoolDataProvider `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` (AddressesProvider `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb`):
  https://arbiscan.io/address/0x243Aa95cAC2a25651eda86e80bEe66114413c43b
- Re-read timestamps: Ethereum `getCurrentBlockTimestamp` 1792020047; Arbitrum 1792020065 (`arbBlockNumber` 514885618).
- Snapshots: `aave-raw/eth_params_2026-10-14.txt`, `aave-raw/arb_params_2026-10-14.txt`.
- The post prints the fact-sheet block next to each figure (Ethereum 26193284, Arbitrum 514855406; USDC.e at Arbitrum 514855406).
  A USDC.e re-read at the 14 Oct block 514885618 was refused by publicnode (archive requests need a token), so the 15 Oct read
  above only confirms the asset is still frozen; it is not cited in the post.

## 2. Ethereum Core E-Mode category 1 (bonus paragraph)

Call: Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` `getEModeCategoryCollateralConfig(1)` and `getEModeCategoryLabel(1)`.

| Value | Fact sheet | Writer re-read |
|---|---|---|
| (LTV, LT, bonus) | (9300, 9500, 10100) = 93%, 95%, 1% at block 26193288 | (9300, 9500, 10100) at block 26194004 (ts 1792020191 = 2026-10-14 23:23:11 UTC) |
| Label | "ETH correlated" | "ETH correlated" |
| `POOL_REVISION` | 11 (v3.7) | 11 |

- Post states: the 1% category bonus only, with block 26193288 in the body. The HF-at-max-borrow figure (95 ÷ 93 ≈ 1.02) was removed:
  plan §3.0a gives that topic to `safe-aave-health-factor`.
- https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2 · snapshot `aave-raw/eth_emode_2026-10-14.txt`.

## 3. Aave V4 (V4 section)

| Figure in the post | Value | Source | Block / time |
|---|---|---|---|
| Ethereum Main Spoke target health factor | 1.24 (`1240000000000000000`) | `getLiquidationConfig()` on `0x94e7A5dCbE816e498b89aB752661904E2F56c485` | fact sheet ~26193321; writer re-read block 26193995 (ts 1792020083 = 2026-10-14 23:21:23 UTC) |
| Health factor for max bonus | 0.90 (`900000000000000000`) | same call | same |
| Liquidation bonus factor | 90% (`9000` bps) | same call | same |
| WETH max liquidation bonus (Main Spoke) | 5.55% (`0.0555`) | Aave V4 public API `https://api.v4.aave.com/graphql`, `reserves` query | 2026-10-14 (`aave-raw/v4_eth_reserves_2026-10-14.json`) |
| WETH liquidation fee (Main Spoke) | 10% of bonus (`0.1000`) | same | same |
| V4 launch dates | Ethereum 2026-03-30; then Avalanche 2026-07-15, Arc 2026-09-16, Base 2026-10-07 | https://aave.com/docs/resources/changelog.md | fetched 2026-10-14 |

- Bonus formula (V4 `LiquidationLogic.calculateLiquidationBonus`, aave/aave-v4 main): min = (max − 100%) × bonusFactor + 100%, linear to max
  between HF 1.00 and `healthFactorForMaxBonus`. For WETH: 4.995% at HF → 1 (post: "about 5.0% just below 1"), 5.0505% at HF 0.99,
  5.55% at HF ≤ 0.90. "Dutch auction" wording: https://aave.com/docs/aave-v4/positions/liquidations.md (fetched 2026-10-14).
- Target-HF mechanism: https://github.com/aave/aave-v4/blob/main/docs/overview.md (fetched 2026-10-14).
- Dust exception, stated without a number ("unless that would leave a very small remainder, the whole debt in that reserve can be
  cleared"): aave/aave-v4 `docs/overview.md` ("in situations that do not result in dust collateral or debt remaining"; "Handle Dust
  Debt") and https://aave.com/docs/aave-v4/positions/liquidations.md ("you must liquidate the entire debt in that reserve"), both
  fetched 2026-10-14 (`aave-raw/v4_overview_gh.md`, `aave-raw/aave-v4_positions_liquidations.md`).
- Deliberately **not** stated: the V4 `DUST_LIQUIDATION_THRESHOLD` value ($1,000) and the V4 HF ≥ 1 borrow rule (aave-facts §10: deployed
  bytecode not compared with source). Per-Spoke live parameters above were confirmed on-chain.
- The "one health factor per Spoke / single collateral factor" bullet was cut (hub topic; length).

## 4. Aave V3 code constants and rules (aave-dao/aave-v3-origin, branch main; local copies read 2026-10-14)

| Rule in the post | Code | File |
|---|---|---|
| Liquidatable when HF < 1.00 | `params.healthFactor < HEALTH_FACTOR_LIQUIDATION_THRESHOLD` (1e18) | `ValidationLogic.validateLiquidationCall` |
| Both reserves active and not paused; frozen not checked | `getFlags()` → `require(active)`, `require(!paused)`; frozen flag ignored | same |
| Grace period must have ended | `liquidationGracePeriodUntil < block.timestamp` for both reserves | same |
| Collateral must be enabled; borrower must owe the debt asset | `isUsingAsCollateral`; `totalDebt != 0` | same |
| No self-liquidation (fifth check in the post's list) | `require(params.borrower != params.liquidator, Errors.SelfLiquidation())`, the first line of the function | same |
| 50% default | `DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e4` | `LiquidationLogic.sol` |
| HF cut-off | `CLOSE_FACTOR_HF_THRESHOLD = 0.95e18`, 50% only if `healthFactor > 0.95` | same |
| $2,000 per-reserve minimum | `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8` (collateral reserve ≥ and debt reserve ≥) | same |
| 50% of **total** debt, capped at reserve debt | `totalDebtInBaseCurrency.percentMul(0.5e4)` applied only if reserve debt exceeds it | same |
| $1,000 dust rule | `MIN_LEFTOVER_BASE = 1000e8`, `MustNotLeaveDust()` unless all debt or all collateral of the reserve is taken | same |
| Collateral shortfall → all of that collateral, less debt repaid; the protocol fee is still taken from it | `_calculateAvailableCollateralToLiquidate`: if `maxCollateralToLiquidate > borrowerCollateralBalance` then `collateralAmount = balance`, `debtAmountNeeded = value ÷ LB`; the fee block runs afterwards in both branches | same |
| Liquidator repays with their own funds (borrowed tokens stay with the borrower) | `IERC20(params.debtAsset).safeTransferFrom(params.liquidator, aToken, actualDebtToLiquidate)` | same |
| Bonus and fee belong to the seized collateral (E-Mode category bonus if in its collateral set) | `getLiquidationBonus()` / `eModeCategories[...].liquidationBonus`; `getLiquidationProtocolFee()` on the collateral reserve | same |
| Fee = share of the bonus portion only | `bonusCollateral = amount − amount / LB`; `fee = bonusCollateral × feePct` | same |
| Bad debt → burned and recorded as deficit (v3.3+) | `hasNoCollateralLeft` → `_burnBadDebt`, `debtReserve.deficit += outstandingDebt` | same |
| Grace period max 4 hours (v3.1) | `MAX_GRACE_PERIOD = 4 hours`; docs: "heavily limited to a maximum value of 4 hours" | `PoolConfigurator.sol`; `docs/3.1/Aave-v3.1-features.md` |
| Unpause with grace period: emergency guardian or governance | `setReservePause(asset, paused, gracePeriod) … onlyEmergencyOrPoolAdmin`; the Protocol Emergency Guardian (4-of-7 multisig) "is the holder of the `EMERGENCY_ADMIN` role", the pool admin is governance | `PoolConfigurator.sol`; https://aave.com/docs/ecosystem/governance.md (`aave-raw/ecosystem_governance.md`) |
| Risk stewards adjust bonuses within limits (not the protocol fee) | README: stewards may change supply/borrow caps, LTV, LT, liquidation bonus and E-Mode LTV/LT/LB, each within `maxPercentChange` | https://github.com/aave-dao/aave-v3-risk-stewards (`aave-raw/risk_stewards_README.md`) |
| Sentinel removed (v3.7), including the post-recovery grace period | `PriceOracleSentinel` / `SequencerOracle` deleted; before v3.7 liquidations were blocked while the sequencer was down or its grace period had not elapsed; after: "Liquidations succeed whenever health factor < 1.0 and the liquidation grace period has elapsed" | `docs/3.7/sentinel-removal.md` |
| Whole-position close factor (v3.3), with the docs' own example: $3,000 each of GHO, USDC and DAI debt | v3.3 docs §2.1: "3k $ GHO DEBT, 3k $ USDC DEBT, 3k $ DAI DEBT" … "would allow to liquidate the whole 3k $ GHO/USDC or DAI in a single liquidation" | `docs/3.3/Aave-v3.3-features.md` |
| Flat 50% was Aave V2's rule | v3.3 docs §2.1: "in Aave v2, this parameter was a constant 50%" | same |

URLs: https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/logic/LiquidationLogic.sol ·
https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/logic/ValidationLogic.sol ·
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.3/Aave-v3.3-features.md ·
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.1/Aave-v3.1-features.md ·
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.7/sentinel-removal.md (all fetched 2026-10-14; LiquidationLogic last
changed 2026-03-31, commit `2f6a0fc96a`).

## 5. Documents and dated incidents

| Figure / claim in the post | Source | Date |
|---|---|---|
| aave.com Pool reference still says "close factor is 0.5" | https://aave.com/docs/aave-v3/smart-contracts/pool.md (line: "Currently the **close factor is 0.5**") | fetched 2026-10-14 |
| Umbrella covers deficits by burning staked aTokens; activation started on Ethereum | https://aave.com/docs/aave-v3/umbrella.md ("Initial activation starts with Ethereum and will expand to other networks") | fetched 2026-10-14 |
| USDC ≈ $0.88 on 11 Mar 2023; ≈ $280k bad debt V3 Avalanche E-Mode, ≈ $20k V3 Arbitrum; stablecoins on V3 Avalanche frozen, liquidations continued; partial liquidations below (1 + bonus) push accounts further into insolvency | Gauntlet, https://governance.aave.com/t/aave-resilient-through-usdc-volatility/12330 | posted 2023-03-17, fetched 2026-10-14 (`aave-raw/gov_usdc_volatility_2023.json`) |
| Polygon forum user tried to repay at HF 1.01, repeated errors, liquidated | https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067 | posted 2021-05-18, fetched 2026-10-14 (`gov/polygon-8067.json`) |
| Aave forum user: 1 hour+ of repay attempts hanging, then liquidated (the user's suspicion about the cause is not repeated) | https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379 | posted 2024-12-23, fetched 2026-10-14 (`gov/t20379.json`) |
| Aave's own app at app.aave.com sends no alerts; HAL integration removed (the separate mobile "Aave App" savings product is not meant) | https://github.com/aave/interface/pull/2084 (merged 2024-05-30); `market.md` §0 item 1, §A rows 1-2 and the note after table A.1 | fetched 2026-10-14 |
| V3.7 live on all seven Tokenping pools (`POOL_REVISION` 11), named in the sequencer bullet as the Arbitrum, Optimism and Base V3 markets | `aave-facts.md` §1.2 (Arbitrum block 514857341, Optimism 158206625, Base 52611344), `aave-raw/v3_liveness_2026-10-14.txt`; Ethereum re-read above | 2026-10-14 |

## 6. Product facts used (Tokenping)

| Claim | Source |
|---|---|
| Checks every 5 minutes | `vercel.json` `*/5 * * * *`; `NOTIFICATION_CHECK_INTERVAL_MINUTES = 5` (`product.md` §4.1) |
| Aave V3 on seven networks; since 2026-10-16 every Aave V4 Spoke on Ethereum, Avalanche, Arc and Base (20), one alert per Spoke | `config/aaveConfig.ts` (`AAVE_MARKETS`, `AAVE_V4_SPOKES`; `product.md` §2) |
| Signal or email (Telegram not named: blog build spec) | `product.md` §4.7 |
| Threshold 1.1 to 10 | `constants/notifications.ts` (`product.md` §4.5) |
| Alert repeats on every check while below threshold | `runNotificationCheck.ts` (`product.md` §4.3) |
| A fast move can cross the threshold and 1.0 between two checks | `product.md` §10.3 ("Polling, not real-time … a fast price move can liquidate a position between checks") |
| Dashboard free | `/aave` (`product.md` §3, §11); price itself comes from the shared end box (`getAlertPlan`), not hard-coded |

## 7. Worked arithmetic (illustrative prices; recomputed by the writer with python3, interest ignored, USDC = $1.00)

Inputs: 10 WETH, 12,000 USDC debt, WETH LT 0.83, bonus 1.05, protocol fee 10% of bonus (Ethereum Core, §1).

- HF at $2,400: 24,000 × 0.83 ÷ 12,000 = **1.66**.
- HF = 1 at P = 12,000 ÷ 8.3 = **$1,445.783**; HF = 0.95 at P = 11,400 ÷ 8.3 = **$1,373.494** (price-band table).
- Lower bound of the 100% band: repaying all 12,000 USDC needs 12,000 × 1.05 = $12,600 of WETH, so P ≥ 12,600 ÷ 10 = **$1,260**
  (HF there = 12,600 × 0.83 ÷ 12,000 = **0.8715**). Below it all 10 WETH are seized, debt repaid = 10P ÷ 1.05 < 12,000, and the rest is
  burned as a deficit because WETH is the only collateral (`hasNoCollateralLeft`).
- **$1,420:** collateral $14,200; HF = 11,786 ÷ 12,000 = **0.98217**. Cap 50% → 6,000 USDC. Seized 6,300 ÷ 1,420 = **4.43662 WETH**;
  bonus $300 = 0.21127 WETH; fee $30 = **0.02113 WETH**; liquidator $6,270 = **4.41549 WETH** (code path:
  `amount = base × LB`, `bonus = amount − amount/LB`, `fee = bonus × 0.10`). After: 5.56338 WETH = **$7,900.00**, debt 6,000,
  HF = 6,557 ÷ 6,000 = **1.09283**. Net position 2,200 → **1,900**. Dust check: $6,000 debt and $7,900 collateral left, both ≥ $1,000.
- **Then $1,330:** 5.56338 × 1,330 = **$7,399.29**; HF = 6,141.41 ÷ 6,000 = **1.02357**; new liquidation price 6,000 ÷ (5.56338 × 0.83)
  = **$1,299.37**.
- **First liquidation at $1,330:** collateral $13,300; HF = 11,039 ÷ 12,000 = **0.91992** (≤ 0.95 → 100%). Seized 12,600 ÷ 1,330 =
  **9.47368 WETH**; left 0.52632 WETH = **$700.00**; fee 10% × $600 = **$60**; liquidator **$12,540**. Debt fully cleared, so the dust
  check does not run. Net position 1,300 → **700**.
- **Per $1,000 repaid (bonus table):** bonus b, fee f → you lose 1,000 + b, liquidator gets 1,000 + b − b×f: WETH/WBTC 5%/10% → 1,050 /
  1,045; USDC Ethereum 4.5%/20% → 1,045 / 1,036; WBTC Arbitrum 7%/10% → 1,070 / 1,063; USDC Arbitrum 5%/10% → 1,050 / 1,045.
- **Bad-debt example:** $10,000 WETH (only collateral), 9,800 USDC debt: HF = 8,300 ÷ 9,800 = **0.84694** (100% cap). Needed 9,800 × 1.05
  = $10,290 > $10,000 → all collateral seized, debt repaid 10,000 ÷ 1.05 = **9,523.81 USDC**, remaining **276.19 USDC** burned as deficit.
  Fee still applies: bonus portion 10,000 − 9,523.81 = 476.19; fee 10% = **$47.62**; liquidator receives **$9,952.38** of WETH.
- **Close-factor illustration (v3.3 docs):** $3,000 each of GHO, USDC, DAI = $9,000 total; 50% = **$4,500** ≥ $3,000, so any one
  reserve can be cleared in one call with room to spare. (The earlier $3,000 USDC + $3,000 USDT version was dropped: it only works at
  exact equality, because the cap applies when reserve debt `>` 50% of total, and a cent of extra USDC interest would leave dust that
  `MustNotLeaveDust` rejects.)
