# Data snapshot: aave-e-mode

Every on-chain figure, date, address, quote and product fact in `content/blog/aave-e-mode.mdx`, written 2026-10-28.
All times are UTC. The writer read every value with `cast` 1.1.0 against public RPCs (ethereum-rpc.publicnode.com,
arbitrum-one-rpc.publicnode.com, base-rpc.publicnode.com, optimism-rpc.publicnode.com), the code from aave-v3-origin
`main` on GitHub and the post-mortem from governance.aave.com (topic 24269, JSON). Raw `cast` output and the decoded
category lists were kept outside the repo. The ScopeNote date (14 Oct 2026) is shared by every post, so every figure in
the text carries its own date.

## 1. Contracts

| Market        | Pool                                         | Other contracts read                                                                                                                                                                       |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ethereum Core | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD`, AaveOracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2`, wstETH `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0`, wstETH oracle source `0xe1D97bF61901B075E9626c8A2340a7De385861Ef` |
| Arbitrum      | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` |                                                                                                                                                                                            |
| Base          | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |                                                                                                                                                                                            |
| Optimism      | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` |                                                                                                                                                                                            |

Pool addresses from `config/aaveConfig.ts` (Ethereum Core, Arbitrum, Optimism, Base entries). Reserve addresses in the
tables below come from each Pool's `getReservesList()`; symbols from each token's `symbol()`.

## 2. E-Mode category reads (28 Oct 2026)

Calls per category id: `getEModeCategoryCollateralConfig(uint8)` (ltv, liquidationThreshold, liquidationBonus in bps;
`(0, 0, 0)` means no category), `getEModeCategoryLabel(uint8)`, `getEModeCategoryCollateralBitmap(uint8)`,
`getEModeCategoryBorrowableBitmap(uint8)`, `getEModeCategoryLtvzeroBitmap(uint8)`, `getIsEModeCategoryIsolated(uint8)`;
bit i of a bitmap is reserve index i of `getReservesList()`. Signatures checked in `IPool.sol` (aave-v3-origin main,
fetched 2026-10-28 14:03:58). Ids 1 to 90 were scanned on Ethereum, 1 to 60 elsewhere, stopping after 12 consecutive
empty ids. Liquidation bonus in the article = bps − 10000 (10100 = 1%).

| Market        | Block(s) and time                                                                 | POOL_REVISION | Reserves | Categories found |
| ------------- | --------------------------------------------------------------------------------- | ------------- | -------- | ---------------- |
| Ethereum Core | 26291736 (14:09:59), every call pinned to it                                       | 11            | 67       | 1 to 48          |
| Arbitrum      | 519074353 (14:34:48) to 519074731 (14:36:31), latest-block reads (see note)        | 11            | 20       | 1 to 10          |
| Base          | 53204166 (14:27:59), pinned                                                        | 11            | 15       | 1 to 15          |
| Optimism      | 158799548 (14:31:13), pinned                                                       | 11            | 14       | 1 to 2           |

Note on Arbitrum: a first run pinned to its starting block returned `RPC_FAIL` for every category, because the public
node refuses blocks older than its non-archive window without a token and Arbitrum produces a block about every 0.25 s;
its output was discarded. The categories were then re-read at the latest block, with the first and last block of the run
recorded, so each value is from some block in that 103-second window. A first Ethereum run (block 26291709, 14:04:35)
returned the same values for ids 1 to 30 as the full run and timed out on one label call; the full run at 26291736 had
no failures.

### 2.1 Ethereum Core, block 26291736 (all 48; the article's table shows ids 1, 2, 11, 4, 7, 22, 26, 3, 40, 43, 47)

| Id | Label | LTV / LT / bonus (bps) | Collateral set | Borrowable set | LTV-0 set | Isolated |
| -- | ----- | ---------------------- | -------------- | -------------- | --------- | -------- |
| 1 | ETH correlated | 9300 / 9500 / 10100 | WETH, wstETH, cbETH, rETH, weETH, osETH, ETHx | WETH | ETHx | false |
| 2 | sUSDe Stablecoins | 9000 / 9200 / 10400 | USDe, sUSDe | USDC, USDT | | false |
| 3 | rsETH__ETH_wstETH_ETHx | 9300 / 9500 / 10100 | rsETH | WETH, wstETH, ETHx | rsETH | false |
| 4 | LBTC_WBTC | 8400 / 8600 / 10300 | LBTC | WBTC | | false |
| 5 | LBTC_cbBTC | 8400 / 8600 / 10300 | LBTC | cbBTC | | false |
| 6 | LBTC_tBTC | 8400 / 8600 / 10300 | LBTC | tBTC | | false |
| 7 | eBTC/WBTC | 8300 / 8500 / 10300 | eBTC | WBTC | | false |
| 8 | PT-sUSDe Stablecoins Jul 2025 | 9000 / 9200 / 10300 | sUSDe, PT-sUSDE-31JUL2025 | USDC, USDT | PT-sUSDE-31JUL2025 | false |
| 9 | PT-eUSDe Stablecoins May 2025 | 9100 / 9300 / 10210 | PT-eUSDE-29MAY2025, eUSDe | USDC, USDT | both | false |
| 10 | PT-USDe Stablecoins July 2025 | 9100 / 9300 / 10210 | USDe, PT-USDe-31JUL2025 | USDC, USDT | PT-USDe-31JUL2025 | false |
| 11 | USDe Stablecoin | 9000 / 9300 / 10200 | USDe | USDC, USDT | | false |
| 12 | PT-USDe USDe July 2025 | 9400 / 9600 / 10110 | USDe, PT-USDe-31JUL2025 | USDe | PT-USDe-31JUL2025 | false |
| 13 | PT-eUSDe Stablecoins August 2025 | 9100 / 9300 / 10200 | PT-eUSDE-14AUG2025, eUSDe | USDC, USDT | both | false |
| 14 | PT-eUSDe USDe August 2025 | 9400 / 9600 / 10100 | PT-eUSDE-14AUG2025, eUSDe | USDe | both | false |
| 15 | eUSDe_Stablecoin | 9000 / 9300 / 10200 | eUSDe | USDC, USDT | eUSDe | false |
| 16 | FBTC/WBTC | 8400 / 8600 / 10300 | FBTC | WBTC | FBTC | false |
| 17 | PT-sUSDe Stablecoins September 2025 | 9000 / 9200 / 10310 | sUSDe, PT-sUSDE-31JUL2025, PT-sUSDE-25SEP2025 | USDC, USDT, USDe, USDtb | the two PTs | false |
| 18 | PT-sUSDe USDe September 2025 | 9200 / 9400 / 10110 | PT-sUSDE-25SEP2025 | USDe | PT-sUSDE-25SEP2025 | false |
| 19 | PT-USDe Stablecoins September 2025 | 9100 / 9300 / 10200 | USDe, PT-USDe-31JUL2025, PT-eUSDE-14AUG2025, PT-USDe-25SEP2025 | USDC, USDT, USDe | the three PTs | false |
| 20 | PT-USDe USDe September 2025 | 9400 / 9600 / 10110 | same as 19 | USDe | the three PTs | false |
| 21 | tETH/Stablecoins | 7200 / 7500 / 10750 | tETH | USDC, USDT | | false |
| 22 | ezETH/wstETH | 9300 / 9500 / 10100 | ezETH | wstETH | ezETH | false |
| 23 | ezETH/Stablecoins | 7500 / 7800 / 10750 | ezETH | USDC, USDT | ezETH | false |
| 24 | PT-sUSDe Stablecoins Nov 2025 | 9000 / 9200 / 10310 | sUSDe, PT-sUSDE-25SEP2025, PT-sUSDE-27NOV2025 | USDC, USDT, USDe, USDtb | the two PTs | false |
| 25 | PT-sUSDe USDe Nov 2025 | 9200 / 9400 / 10110 | PT-sUSDE-25SEP2025, PT-sUSDE-27NOV2025 | USDe | both | false |
| 26 | weETH/wstETH ETH Correlated | 9300 / 9500 / 10100 | weETH | WETH, wstETH | | false |
| 27 | PT-USDe Stablecoins Nov 2025 | 9100 / 9300 / 10200 | PT-USDe-25SEP2025, PT-USDe-27NOV2025 | USDC, USDT, USDe, USDtb | both | false |
| 28 | PT-USDe USDe Nov 2025 | 9400 / 9600 / 10100 | PT-USDe-25SEP2025, PT-USDe-27NOV2025 | USDe | both | false |
| 29 | PTUSDe5FEB/Stablecoins | 9100 / 9300 / 10200 | USDe, PT-USDe-27NOV2025, PT-USDe-5FEB2026 | USDC, USDT, USDe, USDtb | the two PTs | false |
| 30 | PTUSDe5FEB/USDe | 9400 / 9600 / 10100 | same as 29 | USDe | the two PTs | false |
| 31 | PTsUSDe5FEB/Stablecoins | 9000 / 9200 / 10300 | sUSDe, PT-sUSDE-27NOV2025, PT-sUSDE-5FEB2026 | USDC, USDT, USDe, USDtb | the two PTs | false |
| 32 | PTsUSDe5FEB/USDe | 9200 / 9400 / 10200 | same as 31 | USDe | the two PTs | false |
| 33 | syrupUSDT Stablecoins | 9000 / 9200 / 10400 | syrupUSDT | USDT, GHO | | false |
| 34 | PT_USDe_7MAY2026__Stablecoins | 9100 / 9300 / 10270 | USDe, PT-USDe-5FEB2026, PT-USDe-7MAY2026 | USDC, USDT, USDe, USDtb | the two PTs | false |
| 35 | PT_USDe_7MAY2026__USDe | 9400 / 9600 / 10170 | same as 34 | USDe | the two PTs | false |
| 36 | PT_sUSDe_7MAY2026__Stablecoins | 9000 / 9200 / 10420 | sUSDe, PT-sUSDE-5FEB2026, PT-sUSDE-7MAY2026 | USDC, USDT, USDe, USDtb | the two PTs | false |
| 37 | PT_sUSDe_7MAY2026__USDe | 9200 / 9400 / 10320 | same as 36 | USDe | the two PTs | false |
| 38 | PT_srUSDe_2APR2026_sUSDe__USDT_USDe_USDC | 9000 / 9200 / 10330 | sUSDe, PT-srUSDe-2APR2026 | USDC, USDT, USDe | PT-srUSDe-2APR2026 | false |
| 39 | PT_srUSDe_2APR2026_sUSDe__USDe | 9200 / 9400 / 10130 | same as 38 | USDe | PT-srUSDe-2APR2026 | false |
| 40 | LINK__USDC_USDT | 6600 / 7100 / 10700 | LINK | USDC, USDT | | false |
| 41 | EURC__USDC_USDT_GHO | 7500 / 7800 / 10500 | EURC | USDC, USDT, GHO | | false |
| 42 | rsETH__USDC_USDT | 7500 / 7800 / 10750 | rsETH | USDC, USDT | rsETH | false |
| 43 | XAUt__USDC_USDT_GHO | 7000 / 7500 / 10600 | XAUt | USDC, USDT, GHO | | false |
| 44 | PT_srUSDe_25JUN2026__Stablecoins | 9000 / 9200 / 10410 | sUSDe, PT-srUSDe-2APR2026, PT-srUSDe-25JUN2026 | USDC, USDT, USDe | the two PTs | false |
| 45 | PT_srUSDe_25JUN2026__USDe | 9160 / 9360 / 10130 | same as 44 | USDe | the two PTs | false |
| 46 | PT_USDG_28MAY2026__Stablecoins | 9380 / 9580 / 10150 | PT-USDG-28MAY2026 | USDC, USDT, USDe, USDG | PT-USDG-28MAY2026 | false |
| 47 | PT-srUSDe Stablecoins | 9000 / 9200 / 10403 | sUSDe, PT-srUSDe-22OCT2026 | USDC, USDT, USDe | | **true** |
| 48 | PT-srUSDe USDe | 9200 / 9400 / 10103 | sUSDe, PT-srUSDe-22OCT2026 | USDe | | **true** |

Article claims from this table: 48 categories; "most pair a PT or Ethena asset with stablecoins or USDe"; ETHx in
category 1's LTV-0 set; 47 and 48 the only isolated categories; category 1 borrowable = WETH only; category 1 bitmap
2952790659 = indexes 0, 1, 7, 9, 28, 29, 31 (same decoding as `snapshots/aave-health-factor.md` §2 on 14 Oct 2026).

### 2.2 Arbitrum, blocks 519074353 to 519074731 (all 10, all in the article)

| Id | Label | LTV / LT / bonus (bps) | Collateral set | Borrowable set | LTV-0 set |
| -- | ----- | ---------------------- | -------------- | -------------- | --------- |
| 1 | Stablecoins | 9300 / 9500 / 10100 | DAI, USDC (bridged, index 1), USD₮0, EURS, USDC (native, index 11) | none (bitmap 0) | DAI, USDC (bridged), EURS |
| 2 | ETH correlated | 9300 / 9500 / 10100 | WETH, wstETH, weETH | WETH | |
| 3 | ezETH/wstETH/WETH ETH Correlated | 9300 / 9500 / 10100 | ezETH | WETH, wstETH | ezETH |
| 4 | ezETH Stablecoins | 7200 / 7500 / 10750 | ezETH | USD₮0, USDC | ezETH |
| 5 | rsETH/wstETH/WETH ETH Correlated | 9300 / 9500 / 10100 | rsETH | WETH, wstETH | rsETH |
| 6 | rsETH/Stablecoins | 7200 / 7500 / 10750 | rsETH | USDC, USD₮0 | rsETH |
| 7 | wstETH/WETH ETH Correlated | 9400 / 9600 / 10100 | wstETH | WETH | |
| 8 | AAVE__USDCn_USDT | 6600 / 7300 / 11000 | AAVE | USD₮0, USDC | |
| 9 | ARB__USDCn_USDT | 5800 / 6300 / 11000 | ARB | USD₮0, USDC | |
| 10 | tBTC__USDCn_USDT | 7200 / 7500 / 10750 | tBTC | USD₮0, USDC | tBTC |

None isolated. "USD₮0" is the on-chain `symbol()` of Arbitrum's USDT reserve. The article's Arbitrum table lists
"DAI, USDC, USD₮0, EURS" for category 1 (the two USDC reserves collapsed into one entry). 96 ÷ 94 = 1.02128.

### 2.3 Base, block 53204166 (all 15; the article's table shows ids 1, 8, 9, 7, 2, 4, 10 and names the rest in prose)

| Id | Label | LTV / LT / bonus (bps) | Collateral set | Borrowable set | LTV-0 set |
| -- | ----- | ---------------------- | -------------- | -------------- | --------- |
| 1 | ETH correlated | 9000 / 9300 / 10200 | WETH, cbETH, wstETH, weETH | WETH | |
| 2 | ezETH wstETH | 9300 / 9500 / 10100 | ezETH | wstETH | ezETH |
| 3 | ezETH Stablecoins | 7200 / 7500 / 10750 | ezETH | USDC | ezETH |
| 4 | LBTC_cbBTC | 8200 / 8400 / 10300 | LBTC | cbBTC | |
| 5 | rsETH/wstETH | 9300 / 9500 / 10100 | wrsETH | WETH, wstETH | wrsETH |
| 6 | rsETH/USDC | 7200 / 7500 / 10750 | wrsETH | USDC | wrsETH |
| 7 | weETH/WETH | 9300 / 9500 / 10125 | weETH | WETH | |
| 8 | wstETH/WETH | 9300 / 9500 / 10100 | wstETH | WETH | |
| 9 | cbETH/WETH | 9300 / 9500 / 10200 | cbETH | WETH | |
| 10 | cbBTC Stablecoins | 8200 / 8500 / 10400 | cbBTC | USDC, GHO | |
| 11 | SyrupUSDC__USDC_GHO | 9000 / 9200 / 10400 | syrupUSDC | USDC, GHO | |
| 12 | AAVE__USDC_GHO | 6300 / 7000 / 11000 | AAVE | USDC, GHO | |
| 13 | EURC__USDC_GHO | 7500 / 7800 / 10500 | EURC | USDC, GHO | |
| 14 | LBTC__USDC_GHO | 7500 / 7800 / 10500 | LBTC | USDC, GHO | |
| 15 | tBTC__USDC_GHO | 7200 / 7500 / 10750 | tBTC | USDC, GHO | tBTC |

None isolated.

### 2.4 Optimism, block 158799548 (both in the article)

| Id | Label | LTV / LT / bonus (bps) | Collateral set | Borrowable set | LTV-0 set |
| -- | ----- | ---------------------- | -------------- | -------------- | --------- |
| 1 | Stablecoins | 1 / 8700 / 10100 | DAI, USDC (bridged, index 2), USDT, sUSD, USDC (native, index 12) | none (bitmap 0) | DAI, USDC (bridged), sUSD |
| 2 | ETH correlated | 9300 / 9500 / 10100 | WETH, wstETH, rETH | WETH | rETH |

None isolated. LTV 1 bps = 0.01%.

## 3. Ethereum Core reserve parameters, prices and rates

`PoolDataProvider.getReserveConfigurationData(asset)` (decimals, ltv, liquidationThreshold, liquidationBonus,
reserveFactor, ...), `getReserveData(asset)` (field 6 liquidityRate, field 7 variableBorrowRate, ray; ÷ 1e25 = % APR),
`AaveOracle.getAssetPrice(asset)` (USD, 8 decimals).

| Asset | Block (time) | LTV / LT / bonus | Oracle price | Variable borrow APR | Supply APR |
| ----- | ------------ | ---------------- | ------------ | ------------------- | ---------- |
| WETH `0xC02a...6Cc2` | 26291849 (14:32:35) | 8100 / 8400 / 10500 (81% / 84% / 5%) | 233508443741 = $2,335.08 | 19430997967928185932678838 ray = 1.943% | 1.309% |
| wstETH `0x7f39...2Ca0` | 26291849 | 7900 / 8200 / 10600 (79% / 82% / 6%) | 291279403282 = $2,912.79 | 0.019% | 1884637521371455359020 ray = 0.000188%, written "0.0002%" |
| USDC `0xA0b8...eB48` | 26291849 | 7500 / 7800 / 10450 | 99971803 = $0.9997 | 4.33% | not used |
| WBTC `0x2260...2599` | 26291889 (14:40:35) | 8100 / 8500 / 10500 (81% / 85% / 5%) | not read | not read | not read |

These differ from the 14 Oct 2026 values in older posts (WETH 80.5 / 83, WBTC 73 / 78); each post carries its own date.

wstETH/ETH rate: 2912.79403282 ÷ 2335.08443741 = 1.247404 ("1.2474"). `wstETH.stEthPerToken()` at block 26291849 =
1247404156421385319 = 1.247404156. 100 ÷ 1.2474 = 80.17 wstETH ("about 80.2").

wstETH oracle source (`AaveOracle.getSourceOfAsset(wstETH)` = `0xe1D97bF61901B075E9626c8A2340a7De385861Ef`) at block
26291849: `description()` = "Capped wstETH / stETH(ETH) / USD"; `getSnapshotRatio()` = 1228282498700325540 (1.2283);
`getSnapshotTimestamp()` = 1772535659 = 2026-03-03 11:00:59 ("dated 3 Mar 2026"); `getMaxYearlyGrowthRatePercent()` = 880
(8.8%); `getRatio()` = 1247404156421385319, equal to `stEthPerToken()`; `latestAnswer()` = 291279403282, equal to the
wstETH oracle price. A 30-day-old `stEthPerToken()` read (block 26075849) failed: the public node refuses archive
requests without a token, so the staking yield comes from Lido's API instead (§4).

## 4. Lido stETH APR (https://eth-api.lido.fi/v1/protocol/steth/apr/last and /sma, fetched 2026-10-28 14:36:42)

`last`: apr 2.253 at timeUnix 1793190215 (2026-10-28 12:23:35). `sma`: smaApr 2.3261 over the 7 daily values
2.259, 2.222, 2.781, 2.255, 2.24, 2.273, 2.253. Article: "2.25%" and "7-day average of 2.33%"; the yearly example uses
2.3%.

## 5. Arithmetic (Python, writer, 2026-10-28)

- HF 10,000 × 0.95 ÷ 9,000 = 1.0556 ("1.056"); borrow limit 10,000 × 0.93 = 9,300; 9,500 ÷ 9,300 = 1.02151 ("1.0215").
- Outside E-Mode: 10,000 × 0.82 ÷ 9,000 = 0.9111 ("0.911"); 10,000 × 0.79 = 7,900; exit requires debt ≤ 10,000 × 0.82 = 8,200.
- WETH at limit: 84 ÷ 81 = 1.0370 ("1.037"). Arbitrum category 7: 96 ÷ 94 = 1.0213.
- Rate fall to HF 1: 1 − 90 ÷ 95 = 5.26% ("5.3%"); 1 − 93 ÷ 95 = 2.11% ("2.1%").
- Leverage: 1 ÷ (1 − 0.93) = 14.29 ("14.3"); 1 ÷ (1 − 0.79) = 4.76 ("4.8"); 100 ÷ 10 = ten times.
- One year, simple interest, 2.3% staking yield: collateral 102.3 ETH. Borrow 1.94%: debt 90 × 1.0194 = 91.746 ("91.75"),
  equity 10.554 ("10.55", +5.5%), HF 102.3 × 0.95 ÷ 91.746 = 1.0593 ("1.059"). Borrow 5%: debt 94.5, equity 7.8,
  HF 1.0284 ("1.028"). Borrow 8%: debt 97.2, HF 0.99985 ("1.000").
- A loop kept at 1.12 to 1.15 survives a 2.85% rate fall: 1.12 × (1 − 0.0285) = 1.088 > 1.

## 6. Code (aave-v3-origin `main`, fetched 2026-10-28 14:03:58)

| Claim | Where |
| ----- | ----- |
| E-Mode getters, `setUserEMode(uint8)`, `getUserEMode(address) returns (uint256)`, `getEModeCategoryCollateralConfig` returns `DataTypes.CollateralConfig` (ltv, liquidationThreshold, liquidationBonus), `getIsEModeCategoryIsolated(uint8)`, `getEModeCategoryLtvzeroBitmap(uint8)`; `getEModeCategoryLabel` is marked deprecated | `src/contracts/interfaces/IPool.sol` lines 615-682 |
| Check 1 (`InvalidDebtInEmode`: borrowable bitmap for a category, `getBorrowingEnabled()` for category 0), check 2 (`InvalidCollateralInEmode` via `getUserReserveLtv(...) != 0`), empty wallet always passes, category must have a non-zero LT | `ValidationLogic.validateSetUserEMode`, lines 448-498 |
| `getUserReserveLtv`: category LTV for assets in `collateralBitmap` (0 if in `ltvzeroBitmap`), 0 for outside assets when `isolated`, else the reserve's own LTV | `ValidationLogic.getUserReserveLtv`, lines 524-549 |
| Check 3: `usersEModeCategory[user] = categoryId` then `validateHealthFactor`; same category returns early with no checks | `SupplyLogic.executeSetUserEMode`, lines 304-336 |
| 100% close factor when collateral or debt in the reserve < $2,000 | `LiquidationLogic.sol` line 56 `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8`, lines 260-265 |

## 7. Docs quoted

| Quote or claim | Source |
| -------------- | ------ |
| "liquid eModes" introduced in V3.2; "The eMode LT/LTV will only apply for the ones listed as eModeCollateral for that specific eMode, while the others will use their non-eMode LT/LTV"; "You can only borrow assets that are borrowable in your specific eMode"; enter/switch needs HF ≥ 1 and all borrowed assets borrowable | `docs/3.2/Aave-v3.2-features.md` lines 54, 71, 109-125 (fetched 2026-10-28) |
| Isolated flag: outside assets "treated as LTV-zero (they still contribute to the liquidation threshold and health factor, but cannot back new borrows)"; entry blocked; enabling outside collateral refused; live toggle: LTV "immediately becomes LTV-zero", "Health factor is unaffected" | `docs/3.7/isolated-emode.md`, Overview, Effects 1-3, Scenario D (fetched 2026-10-28) |
| "maximize their borrowing power by selecting optimized asset categories"; "When an E-mode is activated, borrowing is restricted to assets within the chosen category" | https://aave.com/help/borrowing/e-mode (fetched 2026-10-28 14:36). https://aave.com/docs/aave-v3/markets/e-mode returned 404; no docs page for E-Mode was found, so the help page is cited |

## 8. Chaos Labs post-mortem (governance.aave.com topic 24269, posted 2026-03-10 19:50:36, fetched 2026-10-28 14:04:00)

| Article claim | Post text |
| ------------- | --------- |
| about 2.85% cut in the effective rate; Core and Prime | "approximately 2.85% decrease in the effective exchange rate used by the protocol" on "Ethereum Core and Prime instances"; "an effective downward move of around 2.855%" |
| positions below about 1.0288 | "affecting the positions with a health factor lower than 1.0288" |
| roughly 10,938 wstETH, 34 accounts | "roughly 10938 wstETH in E-Mode liquidation volume across 34 accounts" |
| no bad debt | "protocol incurred no bad debt" |
| about 512 ETH captured; 141 ETH and about 13 ETH recovered; DAO treasury covers the rest | "liquidators captured approximately 512 ETH in liquidation bonuses and value realized through the exchange rate deviation"; "recapture 141 ETH of liquidation bonus revenue through BuilderNet refunds, in addition to roughly 13 ETH in liquidation fees"; "with DAO treasury funds to cover any excess" (the Impact section also says 141.5 ETH and that no more than 358 ETH will need to be compensated by the DAO; not used) |
| snapshot timestamp seven days old; ratio limited to 3% every 3 days; max rate about 1.1939 | "the snapshot timestamp was still set to the value corresponding to 7 days earlier (1772535647)"; "it can only be increased by 3% every 3 days"; "the calculated maximum exchange rate was roughly 1.1939" |
| wstETH borrow cap cut to 1 | "Temporarily reduced the wstETH borrow cap to 1 on Aave Core and Aave Prime" |

The post does not give the incident's calendar date; the article says "March 2026" and dates the post. The compensation
that followed is in `snapshots/why-aave-health-factor-dropped.md`, not re-verified here.

## 9. Tokenping product facts used

| Fact | Source |
| ---- | ------ |
| Aave alert threshold 1.1 to 10, default 1.5; Morpho may go lower (not mentioned) | `constants/notifications.ts`: `HEALTH_FACTOR_THRESHOLD_MIN = 1.1`, `HEALTH_FACTOR_THRESHOLD_MAX = 10`, `DEFAULT_HEALTH_FACTOR_THRESHOLD = 1.5` |
| Checks every 5 minutes, a message per channel on every check while below the threshold, no snooze or digest | `vercel.json` cron `*/5 * * * *`, `NOTIFICATION_CHECK_INTERVAL_MINUTES = 5`; `aave-health-factor-alert-setup.mdx` "How often will you be alerted?" |
| Reads `Pool.getUserAccountData` (which applies the user's E-Mode category) | `snapshots/aave-health-factor.md` §6 and §9a; `GenericLogic.calculateUserAccountData` picks the E-Mode LT per asset |
| Channels Signal, Telegram, email; one alert per V3 market or V4 Spoke; paid on Arbitrum; price via `<AlertPrice />`; beta, no uptime guarantee; dashboard needs no payment | `constants/notifications.ts` (`NOTIFICATION_SERVICES`), `snapshots/aave-health-factor.md` §10, `aave-health-factor-alert-setup.mdx` |

## 10. Not verified

- Which interfaces turn E-Mode on for a user, and how common flash-loan loops are: not stated in the article.
- The calendar date of the March 2026 incident (the post does not give it).
- Compensation payouts after the incident (left to the why-dropped guide).
- Lido's APR is from Lido's API, not an on-chain read (the archive read failed, §3).
