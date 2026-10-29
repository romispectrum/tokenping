# Data snapshot: why-aave-withdraw-or-borrow-fails

Figures behind `content/blog/why-aave-withdraw-or-borrow-fails.mdx` and its Czech and Spanish translations, with the
blocks they were read at. Everything on-chain was read with `cast` (Foundry 1.1.0) against
https://ethereum-rpc.publicnode.com on 29 Oct 2026. Re-read before changing a number in the article.

## 1. Contracts (Aave V3 Ethereum Core)

| Contract | Address |
| --- | --- |
| PoolDataProvider | `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` |
| Aave Oracle | `0x54586bE62E3c3580375aE3723C145253060Ca0C2` |
| aEthUSDC (USDC aToken) | `0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c` |
| aEthWETH | `0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8` |
| aEthLBTC | `0x65906988ADEe75306021C417a1A3458040239602` |

## 2. Reserve reads, block 26296985 (2026-10-29 07:45:11 UTC)

`getAllReservesTokens()` returned 66 reserves. For each: `getReserveConfigurationData`, `getReserveCaps`,
`getPaused`, `getReserveData` (totalAToken, totalVariableDebt). Raw output: scratchpad `cfg.csv` (not kept).

- Frozen (`isFrozen`): 35 of 66: LUSD, CRV, MKR, SNX, BAL, UNI, ENS, 1INCH, FRAX, RPL, sDAI, STG, KNC, FXS, crvUSD,
  ETHx, rsETH, FBTC, ezETH, eUSDe and 15 Pendle PT tokens (PT-eUSDE-29MAY2025, PT-sUSDE-31JUL2025, PT-USDe-31JUL2025,
  PT-eUSDE-14AUG2025, PT-sUSDE-25SEP2025, PT-USDe-25SEP2025, PT-sUSDE-27NOV2025, PT-USDe-27NOV2025, PT-USDe-5FEB2026,
  PT-sUSDE-5FEB2026, PT-USDe-7MAY2026, PT-sUSDE-7MAY2026, PT-srUSDe-2APR2026, PT-srUSDe-25JUN2026, PT-USDG-28MAY2026).
  Every frozen reserve had supply and borrow caps of 1.
- Paused (`getPaused`): none.
- Borrowing disabled on an unfrozen reserve: 15: wstETH, AAVE, cbETH, rETH, LDO, weETH, osETH, sUSDe, LBTC, eBTC, tETH,
  XAUt, syrupUSDT, BTC.b, PT-srUSDe-22OCT2026.
- LTV 0 on an unfrozen reserve enabled as collateral: 11: DAI (LT 77%), LINK (71%), LDO (50%), PYUSD (78%), osETH (75%),
  USDe (75%), sUSDe (75%), USDS (78%), EURC (78%), tETH (0.1%), XAUt (75%).
- Borrow cap 1 with borrowing enabled: tBTC (2.5695 tBTC borrowed).

| Reserve | Supplied (totalAToken) | Supply cap | Borrowed (variable) | Borrow cap | Utilization | LTV / LT |
| --- | --- | --- | --- | --- | --- | --- |
| USDC | 2,347,525,372.91 | 3,000,000,000 (78.3%) | 2,213,199,103.54 | 2,700,000,000 (82.0%) | 94.28% | 75 / 78 |
| USDT | 2,720,521,909.43 | 3,480,000,000 (78.2%) | 2,497,221,560.89 | 3,090,000,000 (80.8%) | 91.79% | 75 / 78 |
| WETH | 2,173,258.87 | 2,700,000 (80.5%) | 1,721,604.37 | 2,400,000 (71.7%) | 79.22% | 81 / 84 |
| DAI | 128,645,219.28 | 200,000,000 | 116,643,515.54 | 180,000,000 | 90.67% | 0 / 77 |
| WBTC | 34,138.21 | 38,200 (89.4%) | 721.66 | 1,500 (48.1%) | 2.11% | 81 / 85 |
| weETH | 1,367,578.30 | 1,500,000 (91.2%) | 50.92 | 1 | 0.00% | 78 / 81 |
| USDe | 252,266,760.45 | 275,000,000 (91.7%) | 12,065,666.93 | 50,000,000 | 4.78% | 0 / 75 |
| sUSDe | 101,740,707.77 | 105,000,000 (96.9%) | 0 | 0 (none) | 0.00% | 0 / 75 |
| tBTC | 1,779.39 | 1,800 (98.9%) | 2.57 | 1 | 0.14% | 73 / 78 |
| LBTC | 2,689.93 | 2,690 (100.0%) | 0.017 | 1 | 0.00% | 70 / 75 |

Utilization = totalVariableDebt ÷ totalAToken.

## 3. Available liquidity (underlying held by the aToken), block 26296985

| Reserve | `balanceOf(aToken)` | Human |
| --- | --- | --- |
| USDC | 134360379936548 | 134,360,379.94 USDC (5.72% of 2,347,525,372.91 supplied) |
| WETH | 398689880850443536846240 | 398,689.88 WETH |
| WBTC | 3341656183983 | 33,416.56 WBTC |
| LBTC | 268991318540 | 2,689.91 LBTC |

## 4. Prices (Aave Oracle `getAssetPrice`, 8 decimals), block 26296985

- WETH 230984088059 → $2,309.84 (source `0x5424384B256154046E9667dDFaaa5e550145215e`, "ETH / USD")
- USDC 99972447 → $0.99972 (source "Capped USDC / USD")

## 5. Arithmetic (Python, writer, 2026-10-29)

Worked example, section 1: 10 WETH at $2,309.84 = $23,098.41 of collateral, LT 84%, 12,000 USDC of debt priced at
$0.99972 = $11,996.69.

- HF = 23,098.41 × 0.84 ÷ 11,996.69 = 1.6173 (the article rounds the debt to $12,000 and shows 1.617).
- Collateral that keeps HF = 1: 11,996.69 ÷ 0.84 = $14,281.77 = 6.1830 WETH. Withdrawable: 3.8170 WETH. The article
  uses $12,000 of debt: 14,285.71 ÷ 2,309.84 = 6.1847 WETH, withdrawable 3.8153 WETH.
- Max borrow at LTV 81%: 23,098.41 × 0.81 = $18,709.71.

Section 2: USDC available 134,360,379.94 ÷ 2,347,525,372.91 = 5.72%. Headroom under the borrow cap:
2,700,000,000 − 2,213,199,103.54 = 486,800,896.46 USDC. Under the supply cap: 652,474,627.09 USDC.

Section 3: LBTC cap 2,690 − 2,689.93 = 0.07 LBTC of room (2,690 − 2689.93014821 = 0.06985).

## 6. Code (aave-v3-origin `main`, fetched 2026-10-29)

- `ValidationLogic.sol`: `validateSupply` (InvalidAmount, ReserveInactive, ReservePaused, ReserveFrozen,
  SupplyToAToken, SupplyCapExceeded); `validateWithdraw` (InvalidAmount, NotEnoughAvailableUserBalance,
  ReserveInactive, ReservePaused); `validateBorrow` (InvalidAmount, ReserveInactive, ReservePaused, ReserveFrozen,
  NotBorrowableInEMode when in a category else BorrowingNotEnabled, `aToken.totalSupply() >= amount` as
  InvalidAmount, InvalidInterestRateModeSelected unless VARIABLE, BorrowCapExceeded when the cap is not 0);
  `validateRepay` (InvalidAmount, InvalidInterestRateModeSelected, NoExplicitAmountToRepayOnBehalf, ReserveInactive,
  ReservePaused, NoDebtOfSelectedType); `validateHealthFactor` (HealthFactorLowerThanLiquidationThreshold);
  `validateHFAndLtv` (LtvValidationFailed when currentLtv == 0, HealthFactorLowerThanLiquidationThreshold,
  CollateralCannotCoverNewBorrow); `validateHFAndLtvzero` (comment: "If the user has an ltvzero asset, the selected
  asset must be the ltv0 asset. This mechanism ensures that a multi-collateral position needs to withdraw/transfer
  the ltv0 asset first."); `validateLiquidationCall` (LiquidationGraceSentinelCheckFailed); `validateSetUserEMode`
  (InvalidDebtInEmode, InvalidCollateralInEmode). No isolation mode, siloed borrowing or debt ceiling checks remain.
- `GenericLogic.sol` `calculateUserAccountData`: `if (vars.ltv == 0) hasZeroLtvCollateral = true; else avgLtv +=
  balance × ltv`.
- `SupplyLogic.sol` `executeWithdraw`: `validateWithdraw`, burn, then `validateHFAndLtvzero` only when the asset is
  used as collateral and `isBorrowingAny()`. The underlying leaves through `aToken.transferUnderlyingTo`, whose ERC-20
  transfer reverts when the aToken holds less than the amount; no Aave error names that case.
- `BorrowLogic.sol` `executeBorrow`: `validateBorrow`, mint debt, `transferUnderlyingTo`, then `validateHFAndLtv`.
- `Errors.sol`: custom errors, e.g. `error ReserveFrozen(); // 'Action cannot be performed because the reserve is
  frozen'`, `error SupplyCapExceeded(); // 'Supply cap is exceeded'`.

## 7. Docs and threads quoted

- Pool Configurator docs (https://aave.com/docs/aave-v3/smart-contracts/pool-configurator, fetched 2026-10-29): a
  frozen reserve does not allow "any new supply or borrow"; repayments, liquidations and withdrawals remain allowed; a
  paused reserve blocks supply, borrow, repay, liquidate and aToken transfers; a cap of 0 means no cap.
- Incident thread (governance.aave.com topic 15335, fetched 2026-10-29): 4 Nov 2023 Guardian paused Aave V2 Ethereum
  and assets on V3 Arbitrum, Avalanche, Optimism and Polygon after a bug bounty report; proposal 359 executed 12 Nov
  2023 and the Guardian unpaused the V3 instances; 13 Nov a liquidation grace period on V2 Ethereum (about three hours
  for WETH users) then unpause; 16 Nov CRV on V3 Polygon, the last paused asset.
- LlamaRisk cap reductions (governance.aave.com topic 25296, posted 2026-07-10, executed 2026-07-14, fetched
  2026-10-29): MegaETH USDm supply cap 1,000,000,000 → 300,000,000 at 19.8% utilization, "well above current demand".

## 8. Tokenping product facts used

- Checks every 5 minutes; Aave threshold 1.1 to 10, default 1.5; `getUserAccountData`; channels Signal, Telegram,
  email; price via `<AlertPrice />`.

## 9. Not verified

- Which error text a given wallet shows for a custom error: left as "execution reverted" plus the selector.
- Whether the Aave app blocks each case before the transaction: not claimed.
