# Data snapshot: liquidated-on-aave-or-morpho-what-now

Figures behind `content/blog/liquidated-on-aave-or-morpho-what-now.mdx` and its translations, read on 31 Oct 2026
with `cast` against public RPCs (eth.drpc.org for archive calls on Ethereum, base.drpc.org on Base) and Morpho's API.
All times are UTC. Re-read before changing a number.

## 1. Aave example: Ethereum Core, block 26305893 (30 Oct 2026 13:33 UTC)

Transaction `0x5f88aa61ca6180e132a627c5e4d483c4098becc65359fa6af50551c405312fb6`, sent by `0xe1da…806b` to the
liquidator contract `0x29452e8332912533130fb708984722d92184284f`, 19 logs. Borrower
`0x572cf0670d6a02933cdd266c3595a88181a93183` (not named in the article).

`LiquidationCall` (Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`, log 13): collateralAsset WETH, debtAsset USDT,
debtToCover 1,320,785,158 (1,320.785158 USDT), liquidatedCollateralAmount 619,088,749,154,691,217
(0.619088749 WETH), liquidator `0x2945…284f`, receiveAToken false.

Other logs: variableDebtEthUSDT `0x6df1c1e379bc5a00a7b4c6e67a203333772f45a8` Burn 1,320.537444 from the borrower
(balanceIncrease 0.247714 of accrued interest); aEthWETH `0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8` Burn
0.619069088492882589 (target the liquidator) and WETH Transfer 0.619088749154691217 to the liquidator; aEthWETH
Transfer 0.005952776434179724 from the borrower to the collector `0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c`
(BalanceTransfer, the liquidation protocol fee).

Aave Oracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2` at block 26305893: WETH 221,630,581,629 (2,216.30581629 USD),
USDT 99,888,865 (0.99888865 USD).

`getUserAccountData(borrower)`, values in USD with 8 decimals:

| | Block 26305892 (one block before) | Block 26305893 (after the liquidation) |
| --- | --- | --- |
| totalCollateralBase | 3,156.47462544 | 1,752.12707686 |
| totalDebtBase | 2,638.63450695 | 1,319.31730342 |
| currentLiquidationThreshold | 8400 (84%) | 8400 |
| ltv | 0 (no new borrowing allowed) | 0 |
| healthFactor | 1.004852577492591181 | 1.115566922943526264 |

Derived: repaid 1,319.32 USD; collateral to the liquidator 1,372.09 USD; fee 13.19 USD; total taken 1,385.28 USD;
1,385.28 ÷ 1,319.32 = 1.05000 (5% bonus, 65.96 USD); fee ÷ bonus = 0.2000 (20%). WETH after = 1,752.13 ÷ 2,216.31 =
0.790562; WETH before = 0.790562 + 0.619088749 + 0.005952776 = 1.415603; implied WETH price one block earlier =
3,156.47 ÷ 1.415603 = 2,229.77 USD (0.6% higher); health factor at the liquidation price = 1.415603 × 2,216.31 × 0.84 ÷
2,638.63 = 0.99878. 50% of the debt before = 1,319.32 USD = the amount repaid (health factor above 0.95, both legs
above 2,000 USD). After: 1 − 1 ÷ 1.1156 = 10.4% price fall to the next liquidation.

`PoolAddressesProvider.getPoolDataProvider()` = `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD`;
`getReserveConfigurationData(WETH)` at block 26305893: decimals 18, ltv 0, liquidationThreshold 8400,
liquidationBonus 10500 (5%), reserveFactor 1500; `getLiquidationProtocolFee(WETH)` = 2000 (20%). (The
how-aave-liquidation-works snapshot recorded 10% on 14 Oct 2026; the fee is a governance parameter.)

Four other `LiquidationCall` logs in blocks 26305893 to 26312359 (the last 7,000 blocks on 31 Oct 2026, saved in the
scratchpad as `aave_liq_rows_priced.json`): XAUt → USDC 17,321.91 USDC for 4.689956 XAUt; WETH → GHO 2.1078 GHO for
0.000978787 WETH (position fully cleared, debt below 2,000 USD); WETH → USDT 2.141370 USDT for 0.000992736 WETH;
WETH → WETH 0.000418608 WETH for 0.000435352 WETH. Not used in the article beyond the count.

## 2. Morpho example: USDC | cbBTC (86%) on Base, block 53265200 (30 Oct 2026 00:22 UTC)

Market `0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836`, lltv 0.86, listed, oracle
`0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9`, Morpho Blue `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`.

Transaction `0xc2df272f36d8b0b566c24988052c1508a4c90a97999b2da5a8c8ec7f8e3f0178`, sent by `0x6159…4746` to
`0x583d…9b77`, 131 logs, 30 `Liquidate` events, all with caller `0xd8413bf7e7782b536abdeebbcb9e7c4fc481e2e7`, repaid
from 224.08 to 80,187.00 USDC, badDebtAssets 0 in every one. The article follows borrower
`0x0Aa8153Dff1a8A606372b31F724a113a68025DD0` (not named in the article): repaidAssets 2,174,732,093 (2,174.732093
USDC), repaidShares 1,930,751,849,307,601, seizedAssets 2,952,084 (0.02952084 cbBTC), badDebtAssets 0.

`Liquidate` topic: `0xa4946ede45d0c6f06a0f5ce92c9ad3b4751452d2fe0e25010783bcab57a67e41`.

On-chain state:

| | Block 53265199 | Block 53265200 |
| --- | --- | --- |
| oracle `price()` | 771,404,600,000,000,000,000,000,000,000,000,000,000 (77,140.46 USDC per cbBTC) | 768,973,800,000,000,000,000,000,000,000,000,000,000 (76,897.38) |
| position.borrowShares | 1,930,752,272,875,647 | 423,568,046 |
| position.collateral | 3,286,284 (0.03286284 cbBTC) | 334,200 (0.003342 cbBTC) |
| market.totalBorrowAssets | 1,620,007,334,851,024 | 1,619,682,854,002,015 |
| market.totalBorrowShares | 1,438,260,917,575,559,326,571 | 1,437,972,832,221,537,291,702 |

Derived: debt before = 1,930,752,272,875,647 × totalBorrowAssets ÷ totalBorrowShares = 2,174.73 USDC; collateral
before = 2,527.07 USD at 76,897.38 (2,535.05 at 77,140.46); LTV 86.06%, health factor 0.99933 (1.00249 at the earlier
price). LIF = 1 ÷ (1 − 0.3 × (1 − 0.86)) = 1.043841; seized 0.02952084 × 76,897.38 = 2,270.08 USD; 2,270.08 ÷ 2,174.73 =
1.0438; cost 95.34 USD (4.38%). Left: 0.003342 cbBTC = 256.99 USD; 423,568,046 borrow shares = 0.000477 USDC.
0.02952084 ÷ 0.03286284 = 89.8% of the collateral.

The borrower's liquidations in Morpho's API (`marketTransactions`, `userAddress_in`), all on Base: 3 Jun 2026 03:50
cbBTC/USDC (86%) 482.896393 USDC repaid; 14 Oct 2026 15:56 cbZEC/USDC (62.5%) 128.651609 USDC; 30 Oct 2026 00:22
cbBTC/USDC (86%) 2,174.732093 USDC. Current position in the cbBTC market: collateral 0, borrow 0 (withdrawn after).

`marketTransactions` of type Liquidation in this market from 28 Oct 2026 00:30 UTC to 31 Oct 2026 00:30 UTC: 393,
none with badDebtAssets above 0 (saved in the scratchpad as `morpho_cbbtc_liqs.json`).

## 3. Figures reused from other snapshots

- 7,521 liquidations, 5,703 borrowers, 932 liquidated more than once, 36.7% between 00:00 and 06:00 UTC, bad debt
  3,523,866 USD, 30 Sep to 30 Oct 2026 (`snapshots/who-needs-health-factor-alerts.md`).
- Close factor rules (50% above 0.95 with both legs at least 2,000 USD, else 100%), V4 target health factor 1.24 on the
  Ethereum Main Spoke, Aave v3.3 deficit handling (`snapshots/how-aave-liquidation-works.md`).
- Morpho Blue: no close factor, LIF formula, bad debt written off against the market's lenders, LLTV fixed at market
  creation (`snapshots/how-morpho-liquidation-works.md`).
- Health factor 1.5 survives a 33% fall and 2 a 50% fall (`snapshots/safe-aave-health-factor.md`).
- Aave froze every DAO-operated V3 and V4 market on 29 Oct 2026 (`snapshots/tokenized-stocks-collateral.md`).

## 4. Tokenping product facts used

Checks every 5 minutes; Aave threshold 1.1 to 10, Morpho 1.02 to 10; a message on every check while below the
threshold; Signal, Telegram and email in English, Czech, Spanish, Hindi, German or Vietnamese; one alert per Aave V3
market, V4 Spoke or Morpho market; the dashboards show current positions only, no transaction history; looking at
positions needs no payment; beta, no uptime guarantee.

## 5. Not verified

- Whether the Morpho app itself lists past liquidations of a position (the article points to the API and the contract
  log, and to the position being smaller or gone in the app).
- The tax treatment of a liquidation in any country (the article says "in many countries" and gives no advice).
