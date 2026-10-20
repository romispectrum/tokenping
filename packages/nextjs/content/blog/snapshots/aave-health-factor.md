# Data snapshot: aave-health-factor

Every on-chain, API, code, governance and product figure used in `content/blog/aave-health-factor.mdx`, with the call or
file, the block or timestamp, and the source. Figures were first read on 2026-10-14 for the research files
(`SCRATCH/mkt/aave-facts.md`, `SCRATCH/mkt/product.md`, `SCRATCH/mkt/market.md`) and re-read by the writer the same
evening (2026-10-14, 23:20-23:45 UTC). All times UTC. The article quotes the first-read values with their blocks; the
re-reads confirm them unless a row says otherwise.

Revision 2026-10-15 (review fixes, about 00:15-00:45 UTC): risk parameters re-read once more (§1, unchanged); Aave V3 code
re-fetched to correct the LTV rule (§2a); E-Mode entry and isolation rules re-checked against code and the 3.2 / 3.7 docs
(§2); DefiLlama V4 chain coverage, the Aave app's health factor source and the liquidation fee split added (§7, §8, §9a).
Figures dropped from the article in this revision are marked "not quoted" and kept as a record for other posts. Raw files
for this revision: `SCRATCH/mkt/hub-fix-raw/` (reads) and `SCRATCH/mkt/hub-fix-src/` (code and docs fetched 2026-10-15).

RPCs: `https://ethereum-rpc.publicnode.com`, `https://arbitrum-one-rpc.publicnode.com` and the PublicNode RPC of each
other network (read-only `eth_call` with Foundry `cast`). Scripts: `SCRATCH/mkt/scripts/aave_params_mc.sh` (one
Multicall3 `aggregate` per chain, so every value in a chain's rows shares one block) and `aave_rates.sh`; other calls were
direct `cast call`. Raw outputs: `SCRATCH/mkt/aave-raw/*_2026-10-14.txt` (first read) and `SCRATCH/mkt/writer-hub-raw/*.txt`
(writer re-read). SCRATCH = `<scratchpad>`.

## 1. Aave V3 risk parameters (PoolDataProvider `getReserveConfigurationData(address)`)

Ethereum Core PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` (AddressesProvider
`0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e`). Arbitrum PoolDataProvider `0x243Aa95cAC2a25651eda86e80bEe66114413c43b`
(AddressesProvider `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb`).

| Market        | Asset (address)                                          | LTV (bps) | LT (bps) | Bonus (bps) | Status                         | First read (aave-facts §7)                          | Writer re-read                                                                |
| ------------- | -------------------------------------------------------- | --------- | -------- | ----------- | ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Ethereum Core | WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`        | 8050      | 8300     | 10500 (5%)  | active, not frozen, not paused | block 26193284 (ts 1792011527 = 20:58:47)           | blocks 26193994 (23:21:11) and 26194077 (23:37:47), unchanged                 |
| Ethereum Core | WBTC `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`        | 7300      | 7800     | 10500       | active, not frozen, not paused | 26193284                                            | 26193994 and 26194077, unchanged                                              |
| Ethereum Core | USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`        | 7500      | 7800     | 10450       | active, not frozen, not paused | 26193284                                            | 26193994 and 26194077, unchanged                                              |
| Arbitrum      | WETH `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`        | 8000      | 8400     | 10500       | active, not frozen, not paused | Arbitrum block 514855406 (ts 1792011537 = 20:58:57) | Arbitrum blocks 514886238 (23:24:03) and 514889230 (ts 1792021075), unchanged |
| Arbitrum      | WBTC `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`        | 7300      | 7800     | 10700       | active, not frozen, not paused | 514855406                                           | 514886238 and 514889230, unchanged                                            |
| Arbitrum      | USDC native `0xaf88d065e77c8cc2239327c5edb3a432268e5831` | 7500      | 7800     | 10500       | active, not frozen, not paused | 514855406                                           | 514886238 and 514889230, unchanged                                            |

Used in the article: the LTV/LT table; WETH LT 83% and LTV 80.5% (worked example, max-borrow HF); WBTC LT 78% and LTV 73%
(two-collateral example, 1.068); USDC LT 78% and LTV 75% (volatile-debt example, 1.04); WETH bonus 5% (Ethereum Core).

Liquidation protocol fee (`getLiquidationProtocolFee(address)`, basis points of the bonus), Ethereum Core: WETH 1000 (10%
of the bonus), WBTC 1000, USDC 2000; same values at blocks 26193284 (`aave-raw/eth_params_2026-10-14.txt`), 26194077 and 26194348. The article quotes WETH's 10% (the $30 fee in the liquidation section).

Third re-read (revision, `hub-fix-raw/eth_params_2026-10-15.txt` and `arb_params_2026-10-15.txt`): Ethereum block 26194348
(ts 1792024319 = 2026-10-15 00:31:59) and Arbitrum block 514900826 (ts 1792024334 = 00:32:14). Every LTV, LT, bonus,
protocol fee and status value in the table above was unchanged.

## 2. E-Mode category 1, Ethereum Core Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`

| Call                                                   | Value                                                                                                                                                                           | First read (aave-facts §6.1)                    | Writer re-read                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| `getEModeCategoryLabel(1)`                             | "ETH correlated"                                                                                                                                                                | block 26193288                                  | blocks 26193996 and 26194078, same |
| `getEModeCategoryCollateralConfig(1)` (ltv, lt, bonus) | (9300, 9500, 10100): LTV 93%, LT 95%, bonus 1%                                                                                                                                  | 26193288                                        | 26193996 and 26194078, same        |
| `getIsEModeCategoryIsolated(1)`                        | false                                                                                                                                                                           | 26193288                                        | 26193996 and 26194078, same        |
| `getEModeCategoryCollateralBitmap(1)`                  | 2952790659 = reserve indexes 0, 1, 7, 9, 28, 29, 31 = WETH, wstETH, cbETH, rETH, weETH, osETH, ETHx (decoded against `getReservesList()`, symbols from each token's `symbol()`) | 26193288 (aave-facts lists WETH, wstETH, cbETH) | 26194078, full set decoded         |
| `getEModeCategoryBorrowableBitmap(1)`                  | 1 = reserve index 0 = WETH only                                                                                                                                                 | 26193288                                        | 26194078, same                     |

Code behind "to enter a category every borrowed asset must be borrowable in it, every collateral must keep a non-zero LTV
in it, and HF must stay ≥ 1": `ValidationLogic.validateSetUserEMode` (lines 448-498: borrowable-bitmap check for each
borrowed asset; `getUserReserveLtv(...) != 0` for each enabled collateral, `InvalidCollateralInEmode`) and
`SupplyLogic.executeSetUserEMode` (lines 304-336: calls `validateHealthFactor` after switching), aave-v3-origin main,
fetched 2026-10-14 and again 2026-10-15
(https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/logic/SupplyLogic.sol).

"Collateral outside the category's set keeps its normal LTV and threshold (since V3.2)":
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.2/Aave-v3.2-features.md (line 111: "The eMode LT/LTV will only
apply for the ones listed as eModeCollateral … while the others will use their non-eMode LT/LTV"), fetched 2026-10-15.
The first version of the article credited this to V3.6; V3.6 instead decoupled the eMode-0 settings from the E-Mode
settings of assets inside a category (docs/3.6/Aave-v3.6-features.md line 20).

"Isolated category (V3.7 flag): outside collateral gets LTV 0 but keeps its threshold": `ValidationLogic.getUserReserveLtv`
(lines 524-549, returns 0 for assets outside `collateralBitmap` when `isolated`) and
https://github.com/aave-dao/aave-v3-origin/blob/main/docs/3.7/isolated-emode.md (Effects 1-3 and Scenario D: entry blocked
with outside collateral enabled; switching the flag on leaves the health factor unchanged), fetched 2026-10-15. The
article's "'ETH correlated' was not isolated at block 26193288" is the `getIsEModeCategoryIsolated(1)` row above.

## 2a. Which actions check LTV (Aave V3 code, aave-v3-origin main, fetched 2026-10-15)

| Action              | Code path                                                                                       | Check                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borrow              | `BorrowLogic.executeBorrow` line 95 → `ValidationLogic.validateHFAndLtv` (lines 346-385)        | `currentLtv != 0`, HF ≥ 1e18, and `userCollateralInBaseCurrency >= userDebtInBaseCurrency.percentDivCeil(currentLtv)` (`CollateralCannotCoverNewBorrow`): debt may not exceed collateral × LTV |
| Withdraw            | `SupplyLogic.executeWithdraw` line 160 → `ValidationLogic.validateHFAndLtvzero` (lines 398-430) | HF ≥ 1e18 only, plus the LTV-0 ordering rule (if any collateral has LTV 0, the asset withdrawn must be an LTV-0 asset); runs only when the asset is collateral and the user has debt           |
| aToken transfer     | `SupplyLogic.executeFinalizeTransfer` line 209 → `validateHFAndLtvzero`                         | same as withdraw                                                                                                                                                                               |
| Turn collateral off | `SupplyLogic.executeUseReserveAsCollateral(false)` line 278 → `validateHFAndLtvzero`            | same as withdraw                                                                                                                                                                               |

So the LTV limits new borrows only, and the article now says so (table row "New borrows only"; the "Borrow limit used" row
says a borrow that would take it past 100% is refused). The first version said LTV was also checked on withdrawals and
when turning collateral off; that came from aave-facts §3 ("New borrows and withdrawals"), which is wrong on this point.
SupplyLogic.sol last changed in commit `6dc87ad62b` (2026-02-23); all seven Pools run revision 11 (§5).

## 3. Oracle values (Ethereum Core Aave Oracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2`)

| Call                                       | Value                                                                                            | Block / time                                             | Source                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `getAssetPrice(WETH)`                      | 241478089323 = $2,414.78 (quoted; the examples use an illustrative $2,400)                       | block 26193376 (ts 1792012631 = 21:17:11)                | aave-facts §2, §7; `aave-raw/oracle_eth_2026-10-14.txt`                                                         |
| `getAssetPrice(WETH)`, writer re-read      | 241555715191 = $2,415.56 (not quoted)                                                            | blocks 26194001 and 26194078                             | writer                                                                                                          |
| `getSourceOfAsset(USDC)` → `getPriceCap()` | adapter `0x3f73F03aa83B2A48ed27E964eD0fDb590332095B`, "Capped USDC / USD", cap 104000000 = $1.04 | first read block 26193376; re-read 26194025 and 26194078 | aave-facts §5.4; behaviour below $1 from `PriceCapAdapterStable` (https://github.com/aave-dao/aave-price-feeds) |
| `BASE_CURRENCY_UNIT()` / `BASE_CURRENCY()` | 100000000 (8 decimals) / `0x0` (USD)                                                             | re-read on all 7 networks, see §5                        | writer                                                                                                          |

## 4. Interest rates, Ethereum Core (PoolDataProvider `getReserveData(address)`, liquidityRate and variableBorrowRate, ray → APR)

Not quoted since the 2026-10-15 revision: the article now says only that "variable borrow rates can jump" and leaves the
dated figures to `why-aave-health-factor-dropped` (plan §3.0a gives interest drift to #5). The rows stay as a record.

| Reserve                  | Value                                                                                                 | Block / time                                                             | Source                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| WETH supply APR          | 1.309%                                                                                                | 26193378 (ts 1792012655 = 21:17:35); re-read 26194027 and 26194077, same | aave-facts §5.2; `aave-raw/rates_eth_2026-10-14.txt`; writer |
| USDC variable borrow APR | 4.496% (supply 3.800%)                                                                                | 26193378 (21:17:35)                                                      | aave-facts §5.2                                              |
| USDC variable borrow APR | 4.496% (supply 3.801%); totalAToken 2,387.314M USDC                                                   | 26194052 (ts 1792020767 = 23:32:47)                                      | writer (`writer-hub-raw/usdc_rate_two_blocks.txt`)           |
| USDC variable borrow APR | **13.669%** (supply 12.241%); totalAToken 2,253.416M USDC, about $133.9M lower than one block earlier | 26194053 (ts 1792020779 = 23:32:59)                                      | writer (binary search over blocks 26194050-26194060)         |
| USDC variable borrow APR | 14.029% (supply 12.591%); totalAToken 2,250.5M                                                        | 26194060 and 26194077 (23:37:47)                                         | writer                                                       |
| USDC variable borrow APR | 14.037% (supply 12.598%)                                                                              | 26194086 (ts 1792021175 = 23:39:35)                                      | writer                                                       |

The first version of the article said the USDC borrow rate "went from 4.496% to 13.67% APR in a single block (26194053,
23:32:59 UTC) when the USDC supplied to the reserve fell by about $134M" (removed in the revision). The block-26193378 historical read could not be repeated on the
PublicNode endpoint (no archive state); the 4.496% value is confirmed by the writer's reads at 26194027-26194052.
Note for other posts: any article quoting "USDC borrow 4.496%" must carry block 26193378 (or similar); it was 14.04% from
about 23:33 UTC on 2026-10-14.

## 5. Aave V3 Pools Tokenping reads (`config/aaveConfig.ts`), revision and oracle base currency (writer re-read)

| Network         | Pool                                         | Block     | `POOL_REVISION()` | Oracle (`ADDRESSES_PROVIDER().getPriceOracle()`) | `BASE_CURRENCY_UNIT` |
| --------------- | -------------------------------------------- | --------- | ----------------- | ------------------------------------------------ | -------------------- |
| Ethereum (Core) | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | 26194052  | 11                | `0x54586bE62E3c3580375aE3723C145253060Ca0C2`     | 1e8                  |
| Polygon         | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 95543650  | 11                | `0xb023e699F5a33916Ea823A16485e259257cA8Bd1`     | 1e8                  |
| Arbitrum        | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 514888323 | 11                | `0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7`     | 1e8                  |
| Optimism        | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 158211028 | 11                | `0xD81eb3728a631871a7eBBaD631b5f424909f0c77`     | 1e8                  |
| Base            | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` | 52615752  | 11                | `0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156`     | 1e8                  |
| Avalanche       | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | 97568185  | 11                | `0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C`     | 1e8                  |
| Gnosis          | `0xb50201558B00496A145fE76f7424749556E326D8` | 48760150  | 11                | `0xeb0a051be10228213BAEb449db63719d6742F7c4`     | 1e8                  |

First read of the revisions: aave-facts §1.2 (`aave-raw/v3_liveness_2026-10-14.txt`, ~21:08) and product.md §2. Every
oracle's `BASE_CURRENCY()` returned `0x0000…0000` (USD).

## 6. `Pool.getUserAccountData(address)` behaviour (Ethereum Core Pool)

| Check                                                                                                                           | Result                                                                                                                                                                                                                                        | Block                 |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Address with no Aave position (`0x000000000000000000000000000000000000bEEF`)                                                    | `(0, 0, 0, 0, 0, 115792089237316195423570985008687907853269984665640564039457584007913129639935)`: HF = max uint256 ≈ 1.16 × 10^77                                                                                                            | 26194000 and 26194078 |
| Units, checked on one live borrower taken from a `Borrow` event in blocks 26193765-26194065 (address deliberately not recorded) | `currentLiquidationThreshold` 7800 and `ltv` 7300 (basis points); totalCollateralBase / totalDebtBase in USD with 8 decimals; `healthFactor` / 1e18 = 1.07072, equal to totalCollateral × avgLT ÷ 1e4 ÷ totalDebt computed from the same call | ~26194065             |

Code: `GenericLogic.calculateUserAccountData` (HF = Σ(value × LT) wadDiv debt ÷ 1e4, `type(uint256).max` when debt is 0;
LTV-0 collateral still adds to the LT sum) and `ValidationLogic.HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1e18`
(`aave-raw/GenericLogic.sol`, `aave-raw/ValidationLogic.sol`, aave-v3-origin main, fetched 2026-10-14). Return names from
https://aave.com/docs/aave-v3/smart-contracts/pool (fetched 2026-10-14). Null HF in the API:
https://aave.com/docs/aave-v3/markets/positions ("Account Health" note, fetched 2026-10-14).

## 7. Liquidation rules quoted (V3.7)

| Fact                                                                                    | Value                                                                                                                                                                                                                     | Source                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 50% cap condition                                                                       | `healthFactor > CLOSE_FACTOR_HF_THRESHOLD` (0.95e18) and the borrower's collateral and debt in the chosen reserves each `>= MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD` (2000e8 = $2,000); otherwise 100% of that reserve's debt | `aave-raw/LiquidationLogic.sol` lines 43-64, 258-273 (aave-v3-origin main, fetched 2026-10-14)                                                                      |
| Grace period after unpause (not quoted since the revision)                              | up to 4 hours (`MAX_GRACE_PERIOD`)                                                                                                                                                                                        | aave-facts §4.1 (PoolConfigurator, v3.1 docs)                                                                                                                       |
| Frozen reserves stay liquidatable; paused reserves do not                               |                                                                                                                                                                                                                           | aave-facts §0.10, §4.1 (ValidationLogic.validateLiquidationCall)                                                                                                    |
| ETH $1,420 example (not quoted since the revision; owned by how-aave-liquidation-works) | HF 0.982, up to 6,000 USDC repaid, $6,300 of WETH seized, HF after 1.093                                                                                                                                                  | aave-facts §4.4; arithmetic re-checked below                                                                                                                        |
| Fee split on $6,000 repaid against WETH (quoted)                                        | $6,300 of WETH seized (5% bonus = $300); protocol fee 10% of the bonus = $30 to the treasury; $6,270 to the liquidator                                                                                                    | `LiquidationLogic.sol` lines 603-621 (`bonusCollateral = collateral − collateral ÷ LB`; fee = bonusCollateral × fee %), WETH fee 1000 bps (§1); aave-facts §4.3-4.4 |

## 8. Aave V4 figures

| Fact                                                                                                                                   | Value                                                                                         | Call / endpoint                                    | Time                                                                                                           | Source                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| V4 launch dates                                                                                                                        | Ethereum 2026-03-30, Avalanche 2026-07-15, Arc 2026-09-16, Base 2026-10-07                    | docs changelog                                     | fetched 2026-10-14                                                                                             | https://aave.com/docs/resources/changelog (aave-facts §1.1)                               |
| Docs HF example                                                                                                                        | $10,000 ETH × CF 80% ÷ $6,000 GHO = 1.333                                                     | docs                                               | fetched 2026-10-14                                                                                             | https://aave.com/docs/aave-v4/positions (`aave-raw/aave-v4_positions.md` line 56)         |
| Ethereum Main Spoke WETH collateral factor                                                                                             | 0.8300 (also USDC 0.78, WBTC 0.78)                                                            | V4 GraphQL `reserves`                              | 2026-10-14                                                                                                     | https://api.v4.aave.com/graphql (`aave-raw/v4_eth_reserves_2026-10-14.json`)              |
| Ethereum Main Spoke target HF                                                                                                          | `getLiquidationConfig()` = (1.24e18, 0.9e18, 9000) → target HF 1.24                           | Spoke `0x94e7A5dCbE816e498b89aB752661904E2F56c485` | first read ~26193321 (aave-facts §1.1); writer re-read 26194025 and 26194078, same; the article cites 26194078 | on-chain                                                                                  |
| Per-Spoke HF, User Risk Premium                                                                                                        |                                                                                               | docs                                               | fetched 2026-10-14                                                                                             | https://aave.com/docs/aave-v4, https://aave.com/docs/aave-v4/positions                    |
| Dynamic risk configuration (existing positions keep their config key until a risk-increasing action, unless the Governor updates them) |                                                                                               | GitHub docs                                        | fetched 2026-10-14                                                                                             | https://github.com/aave/aave-v4/blob/main/docs/overview.md ("Dynamic Risk Configuration") |
| TVL                                                                                                                                    | Aave V3 17,085,137,624 USD (≈ $17.09B); Aave V4 658,840,204 USD (≈ $0.66B); excludes borrowed | DefiLlama `/protocols`                             | 2026-10-14                                                                                                     | https://api.llama.fi/protocols (`aave-raw/defillama_aave_2026-10-14.json`)                |

DefiLlama V4 chain coverage (added in the revision): `curl https://api.llama.fi/protocols | jq '.[] | select(.slug=="aave-v4")'`
on 2026-10-15 (before 00:31 UTC) returned `chains: ["Ethereum","Arc","Avalanche"]`, tvl 657,312,539, chainTvls Ethereum
442.6M, Arc 183.8M, Avalanche 30.9M (borrowed 416.5M, not in tvl). The 2026-10-14 snapshot row has `nChains: 3`. So the
$0.66B does not include the Base V4 market (launched 2026-10-07). This closes the aave-facts §10 open item; the article
says "Its V4 figure covered Ethereum, Avalanche and Arc, not yet the Base market (checked 15 Oct 2026)".

Not stated in the article, per plan §3.1 and aave-facts §10: that V4 lets you borrow right up to HF 1, and the V4 source
constants (dust threshold, HF ≥ 1 borrow rule).

## 9. Incident and governance figures

| Fact                                                                                                              | Value                                                                                                                                                              | Source                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| March 2026 wstETH exchange-rate misalignment                                                                      | about 2.85% decrease in the effective rate; accounts below HF ≈ 1.0288 (quoted in the E-Mode section); 10,938 wstETH / 34 accounts (not quoted since the revision) | Chaos Labs post-mortem, posted 2026-03-10: https://governance.aave.com/t/post-mortem-exchange-rate-misallignment-on-wsteth-core-and-prime-instances/24269 (`aave-raw/gov_wsteth_capo_postmortem.json`, fetched 2026-10-14). The reimbursement is not mentioned in the article |
| Risk Stewards can move LTV, LT and bonus                                                                          | mechanism only; live limits not stated (aave-facts §10)                                                                                                            | https://github.com/aave-dao/aave-v3-risk-stewards (fetched 2026-10-14)                                                                                                                                                                                                        |
| Aave app: HF in-app, low-HF warnings in transaction flows, no push alerts; help page says to monitor HF regularly |                                                                                                                                                                    | market.md §0 item 1 and §A.1 row 1; https://aave.com/help/borrowing/liquidations (fetched 2026-10-14)                                                                                                                                                                         |

## 9a. How each tool gets the health factor (added in the revision)

| Tool                | How it gets the number                                                                                                                                                                                                      | Source                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Aave app            | Computes it in the browser: `formatUserSummaryAndIncentives` from `@aave/math-utils`, fed by UiPoolDataProvider reserve and user data, with `currentTimestamp: dayjs().unix()`; the file does not call `getUserAccountData` | https://github.com/aave/interface/blob/main/src/hooks/pool/useUserSummaryAndIncentives.ts (fetched 2026-10-15) |
| Tokenping dashboard | `Pool.getUserAccountData`                                                                                                                                                                                                   | product.md §3                                                                                                  |
| Direct call         | `Pool.getUserAccountData`                                                                                                                                                                                                   | §6                                                                                                             |

## 10. Tokenping product facts used

| Fact                                                                                                                                                                                                                                                                                                                            | Source                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Dashboard, 22 networks: every Aave V3 market on 21 (24 markets, Ethereum's Core, Prime, EtherFi and Horizon included) and every Aave V4 Spoke on Ethereum, Avalanche, Arc and Base; markets listed with a position or a saved alert, the rest folded under "Other markets"; view calls only, no approvals or signatures on Aave | product.md §2, §3, §5.1, §6; `config/aaveConfig.ts` (`AAVE_MARKETS`, `AAVE_V3_NETWORKS`, `AAVE_V4_SPOKES`), 2026-10-16 |
| Alerts on Signal or email (Telegram not named, per build spec; superseded 2026-10-20: Signal, Telegram or email, see the update at the end)                                                                                                                                                                                                                                                                  | product.md §4.7; build-spec owner decisions                                                                            |
| Checks every 5 minutes, repeats on every check while below threshold, no recovery message                                                                                                                                                                                                                                       | product.md §4.1, §4.3                                                                                                  |
| Price rendered by `<AlertPrice />` (on-chain `plans(USDC)` on Arbitrum; fallback text when unreadable), paid on Arbitrum                                                                                                                                                                                                        | product.md §5.1-5.2; build-spec                                                                                        |
| Tokenping covers Aave V3 and V4, one alert per V3 market and one per V4 Spoke (24 V3 markets from bgd-labs/aave-address-book, 20 Spokes from Aave's V4 API, 2026-10-16)                                                                                                                                                         | `config/aaveConfig.ts` (`AAVE_MARKETS`, `AAVE_V4_SPOKES`), 2026-10-16                                                  |

## 11. Arithmetic (recomputed by the writer with Python on 2026-10-14; new rows 2026-10-15)

| Quantity                                   | Computation                                                                                                                                                                                   | Result in article                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Example A HF                               | 10 × 2,400 × 0.83 ÷ 12,000 = 19,920 ÷ 12,000                                                                                                                                                  | 1.66                              |
| Borrow limit / room                        | 24,000 × 0.805 = 19,320; 19,320 − 12,000                                                                                                                                                      | $19,320 / $7,320                  |
| Liquidation price                          | 12,000 ÷ (10 × 0.83) = 1,445.783; 1 − 1,445.78 ÷ 2,400 = 0.3976                                                                                                                               | $1,445.78, 39.8%                  |
| Drop to HF 1 from 1.66                     | 1 − 1 ÷ 1.66 = 0.3976                                                                                                                                                                         | about 39.8%                       |
| HF at max borrow (WETH)                    | 19,920 ÷ 19,320 = 1.03106; 83 ÷ 80.5                                                                                                                                                          | 1.031                             |
| Liquidation price at max borrow            | 19,320 ÷ 8.3 = 2,327.71; 1 − 2,327.71 ÷ 2,400 = 0.0301                                                                                                                                        | $2,327.71, 3.0%                   |
| WBTC, USDC at max borrow                   | 78 ÷ 73 = 1.0685; 78 ÷ 75 = 1.04                                                                                                                                                              | 1.068, 1.04                       |
| Example B                                  | 24,000 × 0.83 + 16,300 × 0.78 = 19,920 + 12,714 = 32,634; ÷ 20,000 = 1.6317; ÷ 40,300 = 0.80978; 19,320 + 16,300 × 0.73 = 19,320 + 11,899                                                     | 1.632, 80.98%, $31,219            |
| Example C                                  | 10,000 × 0.78 ÷ 6,000 = 1.30; 7,800 ÷ 6,000 − 1 = 0.30; 10,000 × 0.88 × 0.78 ÷ 6,000 = 1.144                                                                                                  | 1.30, 30%, 1.144                  |
| Borrow limit used vs 1 ÷ HF                | 12,000 ÷ 19,320 = 0.6211; 12,000 ÷ 19,920 = 0.6024                                                                                                                                            | 62.1%, 60.2%                      |
| 18-decimal HF                              | 1.66 × 1e18                                                                                                                                                                                   | 1660000000000000000               |
| max uint256                                | 2^256 − 1 = 1.1579 × 10^77                                                                                                                                                                    | about 1.16 × 10^77                |
| Liquidation at ETH $1,420                  | 14,200 × 0.83 ÷ 12,000 = 0.9822; 6,000 × 1.05 = 6,300; (14,200 − 6,300) × 0.83 ÷ 6,000 = 1.0928                                                                                               | not quoted since the revision     |
| E-Mode example                             | 10,000 × 0.95 ÷ 9,000 = 1.0556 (max borrow 10,000 × 0.93 = 9,300, so 9,000 is allowed)                                                                                                        | 1.056                             |
| E-Mode at max borrow                       | 95 ÷ 93 = 1.02151; 1 − 93 ÷ 95 = 0.02105                                                                                                                                                      | 1.0215, about 2.1%                |
| Max withdrawal to HF 1.00 (revision)       | remaining collateral = 12,000 ÷ 0.83 = 14,457.83; 24,000 − 14,457.83 = 9,542.17; ÷ 2,400 = 3.9759 WETH (an LTV cap would stop at 24,000 − 12,000 ÷ 0.805 = 9,093.17 = 3.789 WETH, not quoted) | about 3.98 WETH ($9,542), HF 1.00 |
| Liquidation fee split (revision)           | 6,000 × 1.05 = 6,300; bonus = 6,300 − 6,300 ÷ 1.05 = 300; fee = 300 × 0.10 = 30; 6,300 − 30 = 6,270                                                                                           | $6,300, $30, $6,270               |
| V4 docs example / same position on V4 Main | 10,000 × 0.80 ÷ 6,000 = 1.3333; 24,000 × 0.83 ÷ 12,000 = 1.66                                                                                                                                 | 1.333, 1.66                       |
| USDC supply drop at block 26194053         | 2,387.314M − 2,253.416M = 133.9M                                                                                                                                                              | not quoted since the revision     |

## 12. Links checked

All external links in the article returned HTTP 200 to `curl -L` on 2026-10-14 (23:2x UTC): the aave-v3-origin
GenericLogic, ValidationLogic, LiquidationLogic and SupplyLogic files and the 3.6 / 3.7 docs; aave.com docs pages (Pool,
positions, V3 overview, changelog, V4, V4 positions) and help page; the Chaos Labs post-mortem; aave-price-feeds;
aave-v3-risk-stewards; the aave-v4 overview. Explorer, API and DefiLlama links point at the contracts and endpoints that
were read.

Added in the revision, HTTP 200 to `curl -L` on 2026-10-15: aave-v3-origin BorrowLogic.sol, docs/3.2/Aave-v3.2-features.md
and docs/3.7/isolated-emode.md; aave/interface `src/hooks/pool/useUserSummaryAndIncentives.ts`. The 3.6 features doc is no
longer cited in the article.

## Update of 2026-10-20

The post now names Telegram next to Signal and email as Tokenping's alert channels, in English and Czech: EN "Tokenping can message you on Signal, Telegram or email", CS "posílat zprávy na Signal, Telegram nebo e-mail".
`updatedAt` moved to 2026-10-20 in both languages; nothing else in the post changed and no other figure was re-read.
Basis: the code at `d9b351f` (`main`) sends each alert by email, Signal and Telegram
(`packages/nextjs/services/notifications/runNotificationCheck.ts:77-98`); the alert form offers Telegram while
`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is set (`packages/nextjs/constants/notifications.ts:24-28`), and production has it
set (the live homepage title read "Aave health factor alerts on Signal, Telegram and email" on 2026-10-20). The build
spec's rule that articles name Signal and email only was dropped in `b7623e4` (2026-10-19); the earlier entry that cites it
is kept as history and marked superseded.
