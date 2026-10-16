# Data snapshot: avoid-aave-liquidation

Post: `content/blog/avoid-aave-liquidation.mdx` ("How to avoid liquidation on Aave"), published 2026-10-14.
Every on-chain value, code rule, doc figure, dated incident and computed number the post states, with its call or source, block or
fetch time, and URL. All times UTC.

- Fact-sheet reads: 2026-10-14 ~20:58-21:23 (`SCRATCH/mkt/aave-facts.md` §2-§8; raw output in `SCRATCH/mkt/aave-raw/`).
- Writer re-read: 2026-10-14 23:22-23:24 (the same publish day in UTC), same scripts and RPCs. **Every re-read value matched the
  fact sheet.** Raw output: `SCRATCH/mkt/writer8-raw/{eth_params_recheck,arb_usdce_recheck,eth_emode1_recheck}.txt`; source files
  fetched by the writer: `SCRATCH/mkt/writer8-raw/{SupplyLogic.sol,PoolConfigurator.sol,swap-features_2026-10-14.md}`.
- Review-round re-read: 2026-10-15 00:23-00:30 UTC (just after the publish day in UTC). Every value already read by the fact sheet
  or the first writer pass matched again, and the cached copies of sentinel-removal.md, PoolConfigurator.sol, ValidationLogic.sol,
  aave-v4 Spoke.sol and aave-v4 docs/overview.md were byte-identical to `main`. New figures from this round: `FLASHLOAN_PREMIUM_TOTAL` on all seven pools, `isFlashBorrower` for
  the swap adapters, the USDC price adapter address and description, the E-Mode 1 LTV-0 bitmap and the bitmap decode. Raw output:
  `SCRATCH/mkt/writer8-raw/review_recheck_2026-10-15.txt`; script `SCRATCH/mkt/writer8-scripts/recheck_review.sh`; address-book
  copies `SCRATCH/mkt/writer8-raw/addrbook/`; `FlashLoanLogic.sol` copy `SCRATCH/mkt/writer8-raw/FlashLoanLogic.sol`.
- RPCs: `https://ethereum-rpc.publicnode.com`, `https://arbitrum-one-rpc.publicnode.com` (plus the Optimism, Base, Polygon, Avalanche
  and Gnosis publicnode RPCs for the section 3a reads). Tool: Foundry `cast` (read-only `eth_call`).
  Scripts: `SCRATCH/mkt/scripts/aave_params_mc.sh` (one Multicall3 `aggregate` per chain, so a chain's rows share one block) and
  `SCRATCH/mkt/scripts/aave_emode.sh`.
- `SCRATCH` = `<scratchpad>`.
- Re-read every on-chain figure below before updating the post. Governance and risk stewards can change them at any time.

## 1. Aave V3 Ethereum Core reserve parameters

Call: Multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11` `aggregate` wrapping `getReserveConfigurationData(asset)`,
`getLiquidationProtocolFee(asset)`, `getReserveCaps(asset)` and `getPaused(asset)` on the current PoolDataProvider
`0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (AddressesProvider `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e`).
Source: https://etherscan.io/address/0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD

| Asset                                             | LTV (bps) | LT (bps) | Bonus (bps) | Protocol fee (bps of bonus) | Active / frozen / paused | Fact-sheet read                          | Writer re-read                                      |
| ------------------------------------------------- | --------- | -------- | ----------- | --------------------------- | ------------------------ | ---------------------------------------- | --------------------------------------------------- |
| WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 8050      | 8300     | 10500       | 1000                        | true / false / false     | block 26193284, ts 1792011527 (20:58:47) | block 26194005, ts 1792020203 (23:23:23), identical |
| WBTC `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 7300      | 7800     | 10500       | 1000                        | true / false / false     | 26193284                                 | 26194005, identical                                 |
| USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 7500      | 7800     | 10450       | 2000                        | true / false / false     | 26193284                                 | 26194005, identical                                 |

Used in the post: WETH LT 83% and LTV 80.5% (all worked examples, max-borrow HF 1.031, the 80%-of-limit conversion); WBTC LT 78% /
LTV 73% (max-borrow HF 1.068; "$1,000 of WBTC adds $780"); USDC LT 78% / LTV 75% (max-borrow HF 1.04; volatile-debt example;
collateral-swap example); WETH bonus 5% ("What happens below 1", printed with block 26193284).

## 2. Aave V3 Arbitrum USDC.e (LTV 0 example)

Call: same script with `ARB=1` on PoolDataProvider `0x243Aa95cAC2a25651eda86e80bEe66114413c43b` (AddressesProvider
`0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb`). Source: https://arbiscan.io/address/0x243Aa95cAC2a25651eda86e80bEe66114413c43b

| Asset                                                       | LTV | LT   | Borrowing | Frozen   | Paused | Caps (borrow, supply) | Fact-sheet read                                    | Writer re-read                                                              |
| ----------------------------------------------------------- | --- | ---- | --------- | -------- | ------ | --------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| USDC.e bridged `0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8` | 0   | 7800 | false     | **true** | false  | 1, 1                  | Arbitrum block 514855406, ts 1792011537 (20:58:57) | Arbitrum block 514886152 (L1 26194004), ts 1792020216 (23:23:36), identical |

Used in the post: "LTV 0, threshold 78% and frozen while governance winds it down (Arbitrum block 514855406, 14 Oct 2026)". The wind-down context comes from aave-facts §3 and
§1.2 (asset-level deprecation of bridged USDC.e where native USDC is listed, governance thread https://governance.aave.com/t/25401).

## 3. Ethereum Core E-Mode category 1 and pool revision

Calls on Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`: `getEModeCategoryLabel(1)`, `getEModeCategoryCollateralConfig(1)`,
`getIsEModeCategoryIsolated(1)`, `getEModeCategoryCollateralBitmap(1)`, `getEModeCategoryBorrowableBitmap(1)`, `POOL_REVISION()`.
Source: https://etherscan.io/address/0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2

| Value                                 | Fact sheet                                     | Writer re-read (blocks 26194006-26194008) | Review re-read (block 26194307, 2026-10-15 00:23:47) |
| ------------------------------------- | ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Label                                 | "ETH correlated" (block 26193288)              | same                                      | same                                                 |
| (ltv, lt, bonus)                      | (9300, 9500, 10100): LTV 93%, LT 95%, bonus 1% | same                                      | same                                                 |
| Isolated                              | false                                          | false                                     | not re-read                                          |
| Collateral bitmap / borrowable bitmap | 2952790659 / 1                                 | 2952790659 / 1                            | 2952790659 / 1                                       |
| `getEModeCategoryLtvzeroBitmap(1)`    | not read                                       | not read                                  | 2147483648 (bit 31: ETHx)                            |
| `POOL_REVISION`                       | 11 (v3.7), block 26193328                      | 11                                        | 11 (block 26194302; see 3a)                          |

Bitmap decode (reserve index from `getReservesList()` at block 26194307, symbol from each token's `symbol()`): the collateral bitmap
2952790659 sets bits 0, 1, 7, 9, 28, 29 and 31, i.e. **WETH, wstETH, cbETH, rETH, weETH, osETH and ETHx** (ETHx has LTV 0 in this
category per the LTV-0 bitmap). The borrowable bitmap 1 sets bit 0 only: **WETH**. The first version of this snapshot listed only
WETH, wstETH and cbETH (copied from aave-facts §6.1, which says "includes"); corrected here. The post states only "allows borrowing
WETH only" and the wstETH/WETH pair, so its text is unaffected.

Used in the post: E-Mode LTV 93% / LT 95% (printed with block 26193288); max-borrow HF 95 ÷ 93 ≈ 1.0215; "ETH correlated allows
borrowing WETH only" (from `getEModeCategoryBorrowableBitmap(1)`, now named in Sources).

## 3a. All seven pools: `POOL_REVISION` and flash-loan premium (review re-read, 2026-10-15 00:23 UTC)

Script `SCRATCH/mkt/writer8-scripts/recheck_review.sh`: `POOL_REVISION()` and `FLASHLOAN_PREMIUM_TOTAL()` on each pool, both at the
same block per chain. Pool addresses from `packages/nextjs/config/aaveConfig.ts`, cross-checked against aave-dao/aave-address-book
(https://github.com/aave-dao/aave-address-book, `src/AaveV3Ethereum.sol` and `src/AaveV3Arbitrum.sol` line 12).

| Network   | Pool                                         | Fact-sheet `POOL_REVISION` (aave-facts §1.2) | Review re-read block | `POOL_REVISION` | `FLASHLOAN_PREMIUM_TOTAL` |
| --------- | -------------------------------------------- | -------------------------------------------- | -------------------- | --------------- | ------------------------- |
| Ethereum  | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | 11 at block 26193328                         | 26194302             | 11              | 5 (0.05%)                 |
| Arbitrum  | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 11 at block 514857341                        | 514898873            | 11              | 5                         |
| Optimism  | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 11 at block 158206625                        | 158212509            | 11              | 5                         |
| Base      | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` | 11 at block 52611344                         | 52617228             | 11              | 5                         |
| Polygon   | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 11 at block 95537797                         | 95545658             | 11              | 5                         |
| Avalanche | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 11 at block 97560030                         | 97571168             | 11              | 5                         |
| Gnosis    | `0xb50201558B00496A145fE76f7424749556E326D8` | 11 at block 48758416                         | 48760722             | 11              | 5                         |

- Used in the post: "all seven networks this guide checked ... run V3.7" (also matches the aave.com changelog: v3.7 Part 1 on
  2026-04-20 with Optimism and Gnosis, Part 2 on 2026-05-29 with Ethereum Core, Polygon, Avalanche, Arbitrum and Base); "a 0.05%
  Aave flash-loan premium ... (all seven networks, read 15 Oct 2026)".
- The premium applies to the swap adapters: `ACLManager.isFlashBorrower` = **false** for the Ethereum adapters
  (ACLManager `0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0`, from `AddressesProvider.getACLManager()` at block 26194307):
  REPAY_WITH_COLLATERAL_ADAPTER `0x35bb522b102326ea3F1141661dF4626C87000e3E`, SWAP_COLLATERAL_ADAPTER
  `0xADC0A53095A0af87F3aa29FE0715B5c28016364e`, DEBT_SWAP_ADAPTER `0xd7852E139a7097E119623de0751AE53a61efb442`; and for the Arbitrum
  adapters (ACLManager `0xa72636CbcAa8F5FF95B2cc47F3CDEe83F3294a0B`, Arbitrum block 514899237): `0xE28E2c8d240dd5eBd0adcab86fbD79df7a052034`,
  `0xF3C3F14dd7BDb7E03e6EBc3bc5Ffc6D66De12251`, `0x63dfa7c09Dc2Ff4030d6B8Dc2ce6262BF898C8A4`. Adapter addresses from
  aave-address-book main (`AaveV3Ethereum.sol` lines 62, 76-77, 84; `AaveV3Arbitrum.sol` lines 71, 87-88, 99), fetched 2026-10-15.
- Code: `FlashLoanLogic.sol` (aave-v3-origin main, fetched 2026-10-15) line 75 zeroes the premium only for authorized flash borrowers
  in `flashLoan`; line 178 charges it on every `flashLoanSimple`; line 143: "no premium is paid when taking on the flashloan as debt"
  (which is how debt swaps open the new debt). The swap-features doc also lists adapter functions that run "without using flash
  loans", so the post says "when the adapter takes a flash loan".

## 4. USDC oracle on Ethereum

- Adapter: AaveOracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2` (from `AddressesProvider.getPriceOracle()`)
  `getSourceOfAsset(USDC)` = `0x3f73F03aa83B2A48ed27E964eD0fDb590332095B`, `description()` = "Capped USDC / USD"
  (https://etherscan.io/address/0x3f73F03aa83B2A48ed27E964eD0fDb590332095B; also `USDC_ORACLE` in aave-address-book
  `AaveV3Ethereum.sol` line 231).
- `getPriceCap()` = 104000000 ($1.04, 8 decimals), read at block 26193376 (`SCRATCH/mkt/aave-raw/oracle_eth_2026-10-14.txt`;
  aave-facts §5.4). Review re-read at block 26194307 (2026-10-15 00:23:47 UTC): 104000000, unchanged; `latestAnswer()` 99987936
  ($0.99988). The post prints "block 26193376, 14 Oct 2026".
- `PriceCapAdapterStable.latestAnswer()`: returns the cap if the base price is above it, 0 if the base price is ≤ 0, otherwise the base
  price, so falls below $1 pass through (https://github.com/aave-dao/aave-price-feeds/blob/main/src/contracts/PriceCapAdapterStable.sol,
  repo `main` HEAD `c10d32c84e` of 2026-10-07; file copy `SCRATCH/mkt/aave-raw/PriceCapAdapterStable.sol`, lines 46-59).
- Oracle WETH price at block 26193376 (21:17:11): 241478089323 = $2,414.78. The post uses $2,400 as an illustrative round price and says so.

## 5. Contract rules (aave-v3-origin `main`, HEAD `8305565ae3` of 2026-09-09; fetched 2026-10-14)

| Rule stated in the post                                                                                                                                                                                                                      | Source and location                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HF = Σ(collateral × LT) ÷ debt; below 1.00 liquidatable                                                                                                                                                                                      | `GenericLogic.sol` (last changed `cf4e138c59`, 2026-02-23); `ValidationLogic.validateLiquidationCall` requires `healthFactor < HEALTH_FACTOR_LIQUIDATION_THRESHOLD` (1e18)                                                                                     |
| A frozen reserve rejects new supply and borrowing                                                                                                                                                                                            | `ValidationLogic.validateSupply` lines 47-50 and `validateBorrow` lines 113-120 (`require(!isFrozen, ReserveFrozen())`)                                                                                                                                        |
| Repaying works on a frozen reserve; it needs active and not paused                                                                                                                                                                           | `ValidationLogic.validateRepay` lines 185-187 (checks `isActive`, `!isPaused`, no frozen check)                                                                                                                                                                |
| A pause blocks repayments, supplies and liquidations                                                                                                                                                                                         | `validateRepay` line 187, `validateSupply` line 49, `validateLiquidationCall` line 273                                                                                                                                                                         |
| Liquidation needs both reserves active and not paused, grace periods over, HF < 1; the frozen flag is not checked                                                                                                                            | `ValidationLogic.validateLiquidationCall` lines 253-291 (file last changed `73e03ff12b`, 2026-03-17; byte-identical to the fact-sheet copy `SCRATCH/mkt/aave-raw/ValidationLogic.sol`)                                                                         |
| An asset with LTV 0 can't be enabled as collateral                                                                                                                                                                                           | `SupplyLogic.executeUseReserveAsCollateral` lines 265-273 (`require(validateUseAsCollateral(...), UserHasAssetWithZeroLtv())`); `ValidationLogic.validateUseAsCollateral` lines 509-517 (user LTV ≠ 0); v3.6 doc "ltv0 assets cannot be enabled as collateral" |
| An LTV 0 asset already enabled still counts toward HF at its LT                                                                                                                                                                              | aave-facts §3 (GenericLogic uses LT); v3.6 doc "ltv0 rules"                                                                                                                                                                                                    |
| Every LT is below 100% (LT × bonus ≤ 100%, bonus > 100%)                                                                                                                                                                                     | `PoolConfigurator.configureReserveAsCollateral` lines 127-141; `setEModeCategory` lines 342-353 (file last changed `cf4e138c59`, 2026-02-23)                                                                                                                   |
| Grace period after an unpause is at most 4 hours                                                                                                                                                                                             | `PoolConfigurator.MAX_GRACE_PERIOD = 4 hours` (line 33, enforced line 246)                                                                                                                                                                                     |
| Pausing and unpausing (with the grace period) is done by the emergency admin or the pool admin                                                                                                                                               | `PoolConfigurator.setReservePause(address,bool,uint40)` and `setReservePause(address,bool)` are `onlyEmergencyOrPoolAdmin` (lines 240-246, 260); `setPoolPause` likewise (lines 474, 485)                                                                      |
| The Protocol Emergency Guardian (a 4-of-7 multisig) holds `EMERGENCY_ADMIN` for Aave protocol markets                                                                                                                                        | https://aave.com/docs/ecosystem/governance ("Guardians" section; copy `SCRATCH/mkt/aave-raw/ecosystem_governance.md` lines 144-152, fetched 2026-10-14)                                                                                                        |
| A reserve at its supply cap rejects new supply                                                                                                                                                                                               | `ValidationLogic.validateSupply` lines 53-63 (`SupplyCapExceeded`; file still byte-identical to main on 2026-10-15)                                                                                                                                            |
| A pause blocks supply and changes to "use as collateral"                                                                                                                                                                                     | `validateSupply` line 49; `validateSetUseReserveAsCollateral` lines 196-202 (`ReservePaused`), called first in `SupplyLogic.executeUseReserveAsCollateral` line 254                                                                                            |
| Close factor: 50% of total debt only if HF > 0.95 and both chosen reserves ≥ $2,000, otherwise 100% of that debt reserve                                                                                                                     | `LiquidationLogic.sol` constants `CLOSE_FACTOR_HF_THRESHOLD = 0.95e18`, `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8` (aave-facts §4.2)                                                                                                                       |
| Before v3.7 the L2 sentinel blocked most liquidations while the sequencer was down and for a grace period after recovery (always allowed below HF 0.95); v3.7 removed it, so liquidations need only HF < 1 and any reserve grace period over | `docs/3.7/sentinel-removal.md` "What?" and "Effects" (copy `SCRATCH/mkt/aave-raw/v3docs_3.7_sentinel-removal.md`; aave-facts §4.1)                                                                                                                             |
| LTV limits borrowing and withdrawals; HF uses LT                                                                                                                                                                                             | `ValidationLogic` / `GenericLogic` (aave-facts §3)                                                                                                                                                                                                             |
| HF per pool per chain; Ethereum has separate Core, Prime, EtherFi and Horizon markets                                                                                                                                                        | aave-facts §1.2, §11                                                                                                                                                                                                                                           |

URLs: https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/logic/GenericLogic.sol ·
.../ValidationLogic.sol · .../SupplyLogic.sol · .../LiquidationLogic.sol ·
https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/pool/PoolConfigurator.sol ·
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.6/Aave-v3.6-features.md ·
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.7/sentinel-removal.md

## 6. Aave docs: swap features (fetched 2026-10-14 ~23:22 UTC)

URL: https://aave.com/docs/aave-v3/smart-contracts/swap-features (fetched as `.md`; byte-identical to the fact-sheet copy
`SCRATCH/mkt/aave-raw/aave-v3_swap-features.md`).

- Fees for tokens traded through CoW Protocol: debt swaps 0 bps; all other swap operations 15 bps between correlated assets
  (e.g. ETH/wstETH), 25 bps otherwise. Swaps use ParaSwap or CoW "depending on network availability".
- Market table: Repay With Collateral and Collateral Swap ticked for Ethereum Core, Ethereum Prime, Ethereum EtherFi, Arbitrum,
  Avalanche, Base, BNB, Optimism, Polygon, Gnosis, Sonic. The post names the seven Tokenping networks and says "among others".
- The adapters integrate Aave flash loans; some functions (`swapAndRepay`, `swapAndDeposit`) run "without using flash loans"; "The
  user should give this contract allowance to pull the aTokens" (or a permit signature).
- The post prints "(as of 14 Oct 2026)" next to the fee bps and "(14 Oct 2026)" next to the market list.

## 7. Aave V4 (no V4 numbers are stated in the post)

The post makes two V4 statements: one collateral factor per collateral asset in each Spoke instead of an LTV/LT pair (Step 3), and
no close factor, with liquidators repaying only enough to bring HF back to the Spoke's target (first section).

- One collateral factor: aave/aave-v4 main `src/spoke/Spoke.sol` (copy `SCRATCH/mkt/aave-raw/v4_Spoke.sol`): account data sums
  `collateralFactor × value` (lines 729-748); a config requires `collateralFactor < PERCENTAGE_FACTOR` (lines 919-926);
  `docs/overview.md` lines 216 and 228 name the Collateral Factor (CF) as the collateralization parameter
  (https://github.com/aave/aave-v4/blob/main/docs/overview.md). aave-facts §1.3.
- No close factor / target HF: `docs/overview.md` lines 258-262 ("Aave V4 removes the default close-factor ... bring the borrower
  back to the `TargetHealthFactor`"); positions doc "liquidators repay only enough debt to restore the position to a healthy state".
  aave-facts §0.9, §1.3.
- HF per Spoke: https://aave.com/docs/aave-v4/positions (copy `SCRATCH/mkt/aave-raw/aave-v4_positions.md`), "Positions in different
  Spokes do not affect each other's Health Factors".
- Correction to the first version of this snapshot: the positions doc does **not** say "one collateral factor per asset". Its prose
  describes borrowing power "based on the asset's Loan-to-Value (LTV) ratio" and borrows backed "according to liquidation thresholds",
  and uses an "80% Collateral Factor" only in its example. aave-facts §9 flags that docs wording as out of step with the V4 code; the
  post therefore cites Spoke.sol and overview.md for the collateral-factor claim.
- Deliberately **not** stated (aave-facts §10, UNVERIFIED against deployed bytecode): that V4 lets you borrow up to HF 1, the V4
  $1,000 dust rule. The Step 3 sentence was reworded in review to say only that the LT ÷ LTV figures apply to V3.

## 8. Worked arithmetic (re-computed by the writer with exact fractions, Python `fractions.Fraction`)

Position A: Aave V3 Ethereum Core, 10 WETH at an illustrative $2,400 (collateral $24,000, LT 0.83, LTV 0.805), debt 12,000 USDC at $1.

| Figure                                                                               | Formula                                                                                            | Exact / rounded                                                                                           |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| HF                                                                                   | 24,000 × 0.83 ÷ 12,000                                                                             | 19,920 ÷ 12,000 = 1.66                                                                                    |
| ETH price at HF 1                                                                    | 12,000 ÷ (10 × 0.83)                                                                               | 1,445.783… → $1,445.78 (39.76% → 39.8% below $2,400)                                                      |
| Supply $1,000 more WETH (0.41667 WETH)                                               | (19,920 + 830) ÷ 12,000                                                                            | 1.729167 → 1.729; ETH at HF 1: 12,000 ÷ (10.41667 × 0.83) = $1,387.95 (42.2%)                             |
| Repay 1,000 USDC from wallet                                                         | 19,920 ÷ 11,000                                                                                    | 1.810909 → 1.811; ETH at HF 1: 11,000 ÷ 8.3 = $1,325.30 (44.8%)                                           |
| Repay 1,000 USDC with WETH, no fee                                                   | (19,920 − 830) ÷ 11,000                                                                            | 1.735455 → 1.735; ETH at HF 1: 11,000 ÷ (9.58333 × 0.83) = $1,382.92 (42.4%)                              |
| Same with a 25 bps fee ($2.50)                                                       | (19,920 − 1,002.50 × 0.83) ÷ 11,000                                                                | 1.735266 → 1.735                                                                                          |
| Same with the fee and a 0.05% flash-loan premium on the 1,000 USDC flash loan        | WETH sold V = 1,000.50 ÷ 0.9975; (19,920 − V × 0.83) ÷ 11,000                                      | V = $1,003.01 (fee + premium ≈ $3.01, "about $3"); HF 1.735228 → 1.735                                    |
| Repay-beats-add condition                                                            | (W)/(D−X) > (W + X·LT)/D ⇔ HF > LT(1 − X/D)                                                        | 1.66 > 0.83 × (1 − 1,000/12,000) = 0.7608: holds                                                          |
| Repay-with-collateral condition                                                      | (HF·D − X·LT)/(D − X) > HF ⇔ HF > LT                                                               | 1.66 > 0.83: holds                                                                                        |
| Max borrow (borrow limit)                                                            | 24,000 × 0.805                                                                                     | $19,320                                                                                                   |
| HF at max borrow                                                                     | LT ÷ LTV                                                                                           | WETH 0.83/0.805 = 1.031056; WBTC 0.78/0.73 = 1.068493; USDC 0.78/0.75 = 1.04; E-Mode 0.95/0.93 = 1.021505 |
| ETH price at HF 1 when fully borrowed                                                | 19,320 ÷ 8.3                                                                                       | $2,327.71, a 3.01% fall → "3.0%"                                                                          |
| E-Mode ratio move to HF 1 at max borrow                                              | 1 − 93/95                                                                                          | 2.105% → "2.1%"                                                                                           |
| HF at 80% of borrow limit used                                                       | LT ÷ (LTV × 0.8)                                                                                   | 0.83 ÷ 0.644 = 1.28882 → "about 1.29"                                                                     |
| Collateral swap: 5 WETH → 12,000 USDC, no fee                                        | (5 × 2,400 × 0.83 + 12,000 × 0.78) ÷ 12,000                                                        | (9,960 + 9,360) ÷ 12,000 = 1.61                                                                           |
| ETH price at HF 1 after that swap                                                    | (12,000 − 9,360) ÷ (5 × 0.83)                                                                      | 2,640 ÷ 4.15 = $636.14 (73.49% → 73.5% below $2,400)                                                      |
| Same swap with a 25 bps fee ($30)                                                    | (9,960 + 11,970 × 0.78) ÷ 12,000; (12,000 − 9,336.6) ÷ 4.15                                        | HF 1.608050 → "about 1.608"; ETH at HF 1 $641.78 → "about $642"                                           |
| Same swap, fee plus 0.05% premium on the 5 WETH flash loan (0.0025 WETH = $6)        | WETH left 4.9975; (4.9975 × 2,400 × 0.83 + 9,336.6) ÷ 12,000; (12,000 − 9,336.6) ÷ (4.9975 × 0.83) | HF 1.607635 → "about 1.608"; ETH at HF 1 $642.10 → "about $642" (the figures the post now prints)         |
| Example C: 10,000 USDC (LT 0.78) vs $6,000 WETH debt                                 | 7,800 ÷ 6,000                                                                                      | 1.30; HF 1 when ETH rises 30%: 2,400 × 1.3 = $3,120                                                       |
| Example C at USDC $0.88                                                              | 8,800 × 0.78 ÷ 6,000                                                                               | 1.144                                                                                                     |
| Remaining fall from an alert at HF 1.3 (single volatile collateral, stablecoin debt) | 1 − 1/1.3                                                                                          | 23.08% → "23.1%"                                                                                          |

## 9. Dated incidents and user reports

| Claim in the post                                                                                                                                                                 | Source (fetched 2026-10-14)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | What the source says                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Polygon forum user (Aave V2, May 2021) tried to repay at HF 1.01, got errors, was liquidated first                                                                                | https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067 (posted 2021-05-18T18:45:59Z; `SCRATCH/mkt/gov/polygon-8067.json`). "Aave V2": aave.com changelog, Aave v2 Polygon market 2021-04-14, Aave v3 2022-03-16 (`SCRATCH/mkt/aave-raw/resources_changelog.md` lines 323-343)                                                                                                                                                                                                                                   | HF was 1.01; repeated "JSON ERROR" on repay; by the time it worked HF was under 1 and the position was liquidated                                                     |
| Aave forum user: more than an hour of pending repay attempts before liquidation, December 2024                                                                                    | https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379 (posted 2024-12-23T17:32:55Z; `SCRATCH/mkt/gov/t20379.json`)                                                                                                                                                                                                                                                                                                                                                                            | "one hour+" of repay attempts, 10+ tries pending in the interface, then liquidation; repay worked right after. The user's suggested cause is not repeated in the post |
| USDC low of around 88 cents on 11 March 2023                                                                                                                                      | https://governance.aave.com/t/aave-resilient-through-usdc-volatility/12330 (Gauntlet, 2023-03-17; `SCRATCH/mkt/aave-raw/gov_usdc_volatility_2023.json`)                                                                                                                                                                                                                                                                                                                                                                                 | Timeline: "2023-03-11 ~8:00 UTC: The price of USDC reaches a low of around 88 cents"                                                                                  |
| March 2026 CAPO error on Ethereum Core and Prime cut the wstETH rate by about 2.85%; ~10,938 wstETH liquidated in E-Mode across 34 accounts; positions with HF below about 1.0288 | https://governance.aave.com/t/post-mortem-exchange-rate-misallignment-on-wsteth-core-and-prime-instances/24269 (Chaos Labs, 2026-03-10; `SCRATCH/mkt/aave-raw/gov_wsteth_capo_postmortem.json`)                                                                                                                                                                                                                                                                                                                                         | All four figures appear in the post-mortem. Its compensation plan is **not** stated in the post (completion unverified, plan §3.5)                                    |
| Aave interface removed its HAL link on 30 May 2024 because HAL shut down                                                                                                          | https://github.com/aave/interface/pull/2084 ("chore: remove hal", merged 2024-05-30T16:21:54Z; GitHub API checked 2026-10-14)                                                                                                                                                                                                                                                                                                                                                                                                           | "Removes Hal integration since the service is shut down"                                                                                                              |
| Aave's interface shows HF but sends no push alerts                                                                                                                                | `SCRATCH/mkt/market.md` §A.1 rows 1-2 (https://aave.com/pro; aave/interface `LowHealthFactorWarning.tsx`; checked 2026-10-14); aave/interface repo tree (`SCRATCH/mkt/aave-interface-tree.json`, 1,688 paths, fetched 2026-10-14): no notification module, only `TopBarNotify.tsx`, `LowHealthFactorWarning.tsx` and leftover HAL icons; https://aave.com/help/borrowing/liquidations (re-fetched 2026-10-15 ~00:27 UTC, copy `SCRATCH/mkt/writer8-raw/web/`): "Regular monitoring of this metric is essential", no alert feature named | In-app HF and warnings only; no push channel. Now cited in the post's Sources (help page and interface source)                                                        |

## 10. Tokenping facts used in Step 6 (`SCRATCH/mkt/product.md`, compiled 2026-10-14)

| Claim                                                                                                                                                                                          | product.md reference                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checks every 5 minutes                                                                                                                                                                         | §4.1 (`vercel.json` cron `*/5 * * * *`; `NOTIFICATION_CHECK_INTERVAL_MINUTES = 5`)                                                                                                                                                                |
| 22 networks since 2026-10-16: every Aave V3 market on 21 (24 markets, Ethereum's Core, Prime, EtherFi and Horizon included) and every Aave V4 Spoke; 7 networks with Ethereum Core only before | §2 (`config/aaveConfig.ts`, `AAVE_MARKETS`, `AAVE_V4_SPOKES`)                                                                                                                                                                                     |
| Signal or email (articles name these two only)                                                                                                                                                 | §4.7; build spec owner decision                                                                                                                                                                                                                   |
| Threshold per network, 1.1 to 10, default 1.5                                                                                                                                                  | §4.5, §4.6                                                                                                                                                                                                                                        |
| Repeats every 5 minutes while below; no "recovered" message                                                                                                                                    | §4.3                                                                                                                                                                                                                                              |
| Watches the connected wallet only                                                                                                                                                              | §4.6                                                                                                                                                                                                                                              |
| Read-only, no approval on Aave; can't repay                                                                                                                                                    | §6                                                                                                                                                                                                                                                |
| Dashboard free; alert price paid on Arbitrum                                                                                                                                                   | §5.1. Price rendered live by `<AlertPrice />` from `plans(USDC)` on TokenpingPaywall `0x79872d7529cfE1c062838fACDA004Ce4BFB16553` (read at Arbitrum block 514853265: 3000000 raw = 3 USDC, 2592000 s = 30 days, §5.2). Not hard-coded in the post |

## 11. Source URL checks (2026-10-14 ~23:25 UTC, `curl -L`)

All cited URLs returned HTTP 200 except the three block-explorer pages (etherscan.io ×2, arbiscan.io), which return 403 to
non-browser clients. They are the standard contract pages; the values were read directly over RPC (sections 1-3).
Review round (2026-10-15 ~00:30 UTC): the URLs added to Sources (aave/aave-v4 overview.md and Spoke.sol, aave.com docs governance
and changelog, aave.com help liquidations, github.com/aave/interface, github.com/aave-dao/aave-address-book, aave.com V4 positions,
sentinel-removal.md) returned HTTP 200; the etherscan page for the USDC adapter `0x3f73…095B` returns 403 like the others and its
values were read over RPC (section 4).
