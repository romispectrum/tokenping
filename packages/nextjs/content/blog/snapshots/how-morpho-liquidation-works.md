# Data snapshot: how-morpho-liquidation-works

Every on-chain figure, contract rule and API count in `content/blog/how-morpho-liquidation-works.mdx`, written
2026-10-26. All times are UTC. A research pass read the contracts, docs and API; the writer re-read the Base market,
its oracle price, its pre-liquidation parameters, the Ethereum Midnight market and the API counts with `cast` and
`curl` on the same day and found the same values. The ScopeNote renders Morpho's figures date (26 Oct 2026); the
figures here also carry their own block numbers.

## 1. Contract source read

| Repo | Commit | Files | Supports |
| --- | --- | --- | --- |
| github.com/morpho-org/morpho-blue | `9cf6d5b844625ba108e36d1cf911f5d2faf7c136` (16 Oct 2026) | `src/Morpho.sol`, `src/libraries/ConstantsLib.sol`, `src/interfaces/IMorpho.sol`, `src/interfaces/IOracle.sol` | health check, liquidation, LIF, bad debt, oracle assumptions |
| github.com/morpho-org/midnight | `719fe585e4a7a70883ef2fe19640db036e487437` (22 Oct 2026) | `src/Midnight.sol`, `src/libraries/ConstantsLib.sol` | liquidation modes, RCF, LIF ramp, maxLif, slashing, gates |
| github.com/morpho-org/pre-liquidation | `6f15d201b15f101f0956b8b7eab0d85defe18959` | `README.md`, `src/PreLiquidation.sol` | pre-liquidation rules |
| github.com/morpho-org/morpho-blue-oracles | `9d2a0b66589d0669c52e47310af8eb804facf97e` | `src/morpho-chainlink/libraries/ChainlinkDataFeedLib.sol` | no staleness, bounds or sequencer checks |

Morpho.sol at HEAD was diffed against `12b8a453643d5ef9d55abd88b9f8cfa866882aa5` (the commit Morpho's docs link to):
only formatting and the SPDX line differ.

## 2. Morpho Blue rules (Morpho.sol at 9cf6d5b)

- `liquidate` (L347-418): `exactlyOneZero(seizedAssets, repaidShares)`; `_accrueInterest` (L358); one
  `IOracle(oracle).price()` read (L361); `require(!_isHealthy(...), HEALTHY_POSITION)` (L363); no caller check.
- `_isHealthy` (L527-539): `borrowed` = borrow shares to assets rounded up; `maxBorrow` = collateral × price ÷ 1e36 ×
  LLTV rounded down; healthy if `maxBorrow >= borrowed`. So liquidatable only when LTV is strictly above LLTV. The
  developer docs say "1 or below"; the article follows the code and the learn page ("below 1").
- LIF (L365-369): `min(MAX_LIQUIDATION_INCENTIVE_FACTOR, WAD.wDivDown(WAD - LIQUIDATION_CURSOR.wMulDown(WAD - lltv)))`;
  ConstantsLib: `LIQUIDATION_CURSOR = 0.3e18`, `MAX_LIQUIDATION_INCENTIVE_FACTOR = 1.15e18`.
- Amounts (L371-380): seized = repaid assets × LIF × 1e36 ÷ price, or repaid = seized × price ÷ 1e36 ÷ LIF. Plain
  subtractions (L384-388): repaying more than the debt or seizing more than the collateral reverts. No close factor,
  no minimum (IMorpho.sol L246-249).
- Order (L410-414): collateral to `msg.sender`, then optional `onMorphoLiquidate` callback, then `safeTransferFrom` of
  the loan token. No fee transfer.
- Bad debt (L390-408): if `position.collateral == 0`, the remaining borrow shares are converted to assets (rounded up,
  capped at `totalBorrowAssets`) and subtracted from `totalBorrowAssets` and `totalSupplyAssets`; borrow shares set to 0.
- Oracle reads: only `liquidate` (L361) and `_isHealthy(marketParams, id, borrower)` (L518), which `borrow` and
  `withdrawCollateral` call. `repay` and `supplyCollateral` do not read the oracle (writer's reading of the code).
- No pause, freeze or grace-period logic in Morpho.sol (grep). `repay` (L295) and `liquidate` (L410, L414) move tokens
  with `safeTransfer`/`safeTransferFrom`, so a token issuer's pause or blacklist can block them; the risks page's
  Counterparty Risk section warns that a centralized token governance can blacklist a user or Morpho (review, 26 Oct).
- `enableLltv` (L113-120, owner only): requires the value not yet enabled and `lltv < WAD`; no list in the code, so the
  article calls the table "the enabled values on 26 Oct 2026", not a fixed list.
- IMorpho.sol `createMarket` notes (L104-130): oracle must return a correctly scaled price, must not drop in one step
  below old price × LLTV × LIF, must not revert (liveness), must not return a huge price.

## 3. LIF table (contract integer math, WAD, Python)

| LLTV | LIF raw | LIF |
| --- | --- | --- |
| 0% | 1150000000000000000 | 1.15 (cap) |
| 38.5% | 1150000000000000000 | 1.15 (cap; uncapped 1.226241...) |
| 62.5% | 1126760563380281690 | 1.126761 |
| 77% | 1074113856068743286 | 1.074114 |
| 86% | 1043841336116910229 | 1.043841 |
| 91.5% | 1026167265264238070 | 1.026167 |
| 94.5% | 1016776817488561260 | 1.016777 |
| 96.5% | 1010611419909044972 | 1.010611 |
| 98% | 1006036217303822937 | 1.006036 |

"Collateral you lose per 1,000 of debt repaid" = 1,000 × LIF. LLTV 0 is left out of the article's table: `maxBorrow`
is always 0 there, so `borrow` fails its health check (derived from the code). Docs (learn page, developer page) round
86% to "approximately 1.05"; the article states 1.0438. The 86% value was cross-checked against the pre-liquidation
contract's `preLIF1`/`preLIF2` in section 6.

Enabled LLTVs: docs table "Governance-Approved LLTV & IRM"; research pass: `isLltvEnabled(uint256)` on Ethereum Morpho
Blue `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` at block 26274948, every 0.5% step from 0 to 99.5%: true only for
0, 38.5, 62.5, 77, 86, 91.5, 94.5, 96.5 and 98%; all 8,286 Blue markets in the API use only these. Writer re-checked
`isLltvEnabled(0.86e18) = true` on Base at block 53102870. Deployed bytecode on Ethereum, Base and Arbitrum contains
1.15e18 and 0.3e18 (research pass).

## 4. Worked example market (Base)

Market `0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836`, Morpho Blue
`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`, Base block 53102870 (2026-10-26 06:11:27), RPC base-rpc.publicnode.com.

| Call | Value |
| --- | --- |
| `idToMarketParams(bytes32)` | loan USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 dec), collateral cbBTC `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` (8 dec), oracle `0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9`, IRM `0x46415998764C29aB2a25CbeA6254146D50D22687`, lltv 860000000000000000 |
| `market(bytes32)` | totalSupplyAssets 1789899612834178 (about 1.79bn USDC), totalBorrowAssets 1613068465459818 (about 1.61bn USDC), fee 0 |
| oracle `price()` | 800001529753600000000000000000000000000; scale 36 + 6 - 8 = 34 decimals, so 80,000.15 USDC per cbBTC |
| oracle feeds | BASE_FEED_1 `0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F` (`description()` "BTC / USD", 8 decimals, answer 8000015297536, updatedAt 1792994887); every other feed and vault 0x0; SCALE_FACTOR 1e26 |
| feed `aggregator()` / `owner()` (review, latest block, 26 Oct) | `0xe5ec87a39445b8D5b751b116802A53C5ae7e9Df1` / `0xf0Db7318A51a21C413CaDd4AbDC1E8a500fE5B1b`: a proxy whose owner can repoint it, so the article says the feed's source can change while the oracle address cannot |

"Largest listed market by borrowing on Ethereum and Base": API `markets` ordered by BorrowAssetsUsd, listed true
(research pass). API on 26 Oct 2026: `listed: true`, borrowApy 0.05224 (research pass 0.0524; article says "about
5.2%"), utilization 90.1%.

Illustrative position (Python, LIF 1043841336116910229 ÷ 1e18, P = 80000.15297536):

- 1 cbBTC, 50,000 USDC: LTV 0.62500, HF 1.37600; liquidation price 50,000 ÷ 0.86 = 58,139.53 (27.33% below P).
- Full at 58,139.53: seized 0.897704 cbBTC = 52,192.07 USDC; kept 0.102296 cbBTC = 5,947.47 USDC; cost 2,192.07 =
  4.384% of debt.
- Partial 10,000 USDC: seized 0.179541 cbBTC = 10,438.41 USDC; new LTV 0.83855, HF 1.02557; LIF × LLTV = 0.89770.
- At 50,000: repaid 50,000 ÷ LIF = 47,900.00; bad debt 2,100.00. Bad debt threshold LTV = 1 ÷ LIF = 0.9580.
- Interest only: ln(1.376) ÷ ln(1.0522) = 6.27 years (6.25 at 5.24%): "more than six years", only if the rate held
  (the market runs at 90.1% utilization under an adaptive rate model; the article says "if that rate held").

Typical positions (research pass, not a Morpho statistic): API lists 42,985 borrow positions; the 11,000 largest by
borrow shares (`orderBy: BorrowShares`, the API caps `skip` at 10,000) hold 1,550M of about 1,613M USDC (96%).
Debt-weighted LTV at the oracle price: median 54.1%, so HF 0.86 ÷ 0.541 = 1.59.

## 5. API counts (POST https://api.morpho.org/graphql, re-run by the writer 26 Oct 2026)

- `marketTransactions(where:{marketUniqueKey_in:["0x9103…1836"], chainId_in:[8453], type_in:[Liquidation]})`:
  `pageInfo.countTotal` 14024. These are liquidation events, not transactions: the first three items include tx
  `0x4b7c3ff7abb9983dbe92c2580f6bb5bc8c1747961a572c1d991b6fa2d6563663` twice (log indexes 1996 and 1994), so the
  article says "14,024 liquidations".
- `marketTransactions(where:{chainId_in:[1,8453], type_in:[Liquidation], badDebtAssets_gte:"1"})`: `countTotal` 1428,
  in 1,226 distinct transactions. The largest raw entries are in small markets; the article names none.
- Size of those entries (review re-run, 26 Oct 2026; `badDebtAssets` ÷ 10^decimals × the loan asset's `priceUsd` today,
  so values are at 26 Oct 2026 prices, not at the time): 1,393 of 1,428 have a price; median about $0.05; 638 under
  $0.01, 840 under $1, 553 at least $1, 276 at least $100, 130 at least $1,000, 50 at least $10,000. Only 441 of the
  1,428 are in markets with `listed: true`, and 12 of those are at least $1 (largest about $9,600, WETH). Hence "most of
  them under 1 US dollar or in markets the Morpho app does not list".
- A decoded example (research pass, not in the article): Base tx
  `0xda56a1df6c2a8026e5f25d630ff3b98941c17a777186187dce9b90262a9ba20c`, block 53031082, `Liquidate` event repaidAssets
  96.54 USDC, seizedAssets 0.00125972 cbBTC, badDebt 0; 96.54 × 1.043841 ÷ 0.00125972 ≈ 79,999 USDC per cbBTC.

## 6. Pre-liquidation (Base, block 53102870)

- Factory `0x8cd16b62E170Ee0bA83D80e1F80E6085367e2aef`: `isPreLiquidation(0xa7272aFc21f9C321024ED93892a1abfeb621C374)`
  = true; its `ID()` is the market above (research pass).
- `preLiquidationParams()` (writer re-read): preLltv 832603694978499652 (83.26%), preLCF1 2001493508968667 (0.20%),
  preLCF2 245311807032632372 (24.53%), preLIF1 = preLIF2 = 1043841336116910229, oracle `0x663B…39B9`.
- Rules (README; PreLiquidation.sol L129-169): acts only if authorised on Morpho; only while preLltv < LTV <= LLTV;
  repaid shares capped by the interpolated preLCF; preLltv < LLTV, preLCF1 <= preLCF2, preLCF1 <= 1,
  1 <= preLIF1 <= preLIF2 <= 1 ÷ LLTV. The article does not claim the pre-liquidation incentive is at most the LIF.
- `preLiquidate` (L129-174) caps each call at `position.borrowShares × preLCF` and has no cooldown or call counter, so
  calls can repeat (even in one block) while preLltv < LTV <= LLTV; preLIF <= 1 ÷ LLTV keeps each call from raising
  the LTV. `Morpho.liquidate` is unaffected above the LLTV. Hence "addition" and "up to 0.20% per call (calls can
  repeat)". Cluster review: the "Consider pre-liquidation" advice was removed; the guide now says Morpho is retiring the
  feature (no new positions, borrowers asked to switch it off), per help.morpho.org article 12048871 "Sunsetting
  Auto-deleverage" (snapshots/morpho-pre-liquidation.md, section 8), and points to the pre-liquidation guide.

## 7. Midnight (Midnight.sol at 719fe58)

- Header L17-21 and ConstantsLib: up to 128 collaterals per market, 16 per borrower; LLTV = 1 has no incentive and no RCF.
- Header L49-67 and `liquidate` (L570-680): liquidatable if `postMaturityMode ? block.timestamp > maturity : debt >
  maxDebt`; normal mode LIF = maxLif with RCF `repaid <= (debt - maxDebt) ÷ (1 - LIF × LLTV)`, skipped when
  `collateral × price ÷ LIF - maxRepaid < rcfThreshold`; post-maturity LIF = min(maxLif, 1 + (maxLif - 1) × elapsed ÷
  TIME_TO_MAX_LIF), no RCF; `TIME_TO_MAX_LIF = 60 minutes`. Header L53: after maturity, an unhealthy borrower's
  liquidator can choose either mode (`postMaturityMode` argument), so the ramp only protects a borrower who is healthy.
- Bad debt: debt minus Σ collateral value ÷ maxLif, removed from the borrower's debt and spread via `lossFactor`
  (header "SLASHING": credit slashed at each lender's next interaction).
- `maxLif = 1 ÷ (1 - cursor × (1 - LLTV))` (ConstantsLib L32-34); market creation requires maxLif <= 2 and, unless
  LLTV = 1, LLTV × maxLif <= 0.999 (L766-768). No 1.15 cap. No pause or freeze logic (grep).
- `liquidatorGate` check (L590-593).
- Ethereum Midnight `0x471686c42792F93528B000beF54bC10E3aa2045f`, block 26274998 (writer re-read): `toMarket` of
  `0xcf447db8cff164867b02edbf7ee7af06d241d4f3a44b34d6e3a3ea872ddea5d6` = loan USDC; collaterals USDC (LLTV 98%, cursor
  0.3) and cbBTC (LLTV 86%, cursor 0.3); maturity 1798210800 (25 Dec 2026 15:00); rcfThreshold 300000000000
  (300,000 USDC); liquidator gate and enter gate 0x0.
- Research pass: on Ethereum Midnight, `isLltvEnabled` true for 38.5, 62.5, 77, 86, 91.5, 94.5, 96.5, 98 and 100%;
  `isLiquidationCursorEnabled` true only for 0.3 among 2.5% steps. Base Midnight
  `0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A`: cursor 0.3 true (writer re-read, latest block).
- API `GET https://api.morpho.org/v0/midnight/markets?listed=true` (research pass): all 1,941 listed markets use
  cursor 0.3 with collateral LLTVs 62.5 to 98% and zero gates; `rcf_threshold` among the 49 with non-zero units: 900,
  3,000 and 5,000 USDC (Base), 300,000 and 500,000 USDC (Ethereum).
- Review re-run of the same endpoint, all cursor pages (1,941 markets, 26 Oct 2026): every listed market is on Ethereum
  or Base and lends USDC. `rcf_threshold` counts, Ethereum: 90,000 (105), 200,000 (81), 300,000 (416), 500,000 (326),
  700,000 (49), 2,000,000 (7) USDC; Base: 900 (294), 2,000 (187), 3,000 (304), 5,000 (172) USDC. With non-zero
  `total_units` (49): Ethereum 300,000 (11), 500,000 (2); Base 900 (7), 3,000 (28), 5,000 (1). The article gives both
  ranges: 900 to 2,000,000 USDC across listed markets, 900 to 500,000 USDC in markets with loans outstanding. The
  `collaterals` array carries `liquidation_cursor` per collateral.
- Cluster review: the Midnight section was cut to a summary that links to the Midnight guide, which holds the detail.
  The rcfThreshold ranges and the RCF illustration below are no longer in the article. The exception is now worded per
  collateral, as in the contract: the collateral left after a capped liquidation would repay less than rcfThreshold.
- RCF illustration (Python, no longer in the article): collateral 100,000 USDC of cbBTC, LLTV 0.86, LIF 1.043841, debt 87,000: maxDebt 86,000;
  maxRepaid = 1,000 ÷ (1 - 0.897704) = 9,775.5; seized 10,204.1 USDC; after: debt and maxDebt both 77,224.5.
  RCF test value 100,000 ÷ 1.043841 - 9,775.5 = 86,024.5: below 300,000 (RCF off), above 3,000 (RCF on).
- Docs (Midnight collateral-health page) say no partial liquidation after maturity; the contract allows any amount.
  The article says only that the whole debt can go and that there is no RCF.

## 8. Docs pages (fetched as `.md`, 26 Oct 2026)

| Page | Supports |
| --- | --- |
| docs.morpho.org/learn/concepts/liquidation | below 1; liquidators (bots, individuals, RPC node and wallet); no auction; up to 100%; LIF all to the liquidator; vault bad debt handling (Bad Debt Consideration: Vault V2 and legacy V1.0 pass the loss through the share price, legacy V1.1 does not realize it and the debt stays in the market until paid down manually); oracle price used; no price floor |
| docs.morpho.org/developers/borrow/concepts/liquidation | "1 or below" wording (not followed); higher LLTV smaller incentive to avoid cascades; bad debt is a loss for that market's lenders |
| docs.morpho.org/learn/concepts/oracle | oracle-agnostic; curators choose; immutable oracle |
| docs.morpho.org/learn/concepts/blue | permanent parameters; enabled LLTVs; isolated markets |
| docs.morpho.org/learn/concepts/midnight/liquidations | two modes; LIF ramp over 60 minutes; RCF and its exceptions; liquidator gates |
| docs.morpho.org/developers/midnight/concepts/collateral-health-liquidations | per-collateral parameters; liquidator picks collateral |
| docs.morpho.org/learn/concepts/midnight | debt units at a fixed rate |
| docs.morpho.org/learn/resources/risks | oracle manipulation can cause liquidations or bad debt; counterparty risk (token governance can blacklist) |

Cluster review: the vault sentence now says only that a Vault V2 passes the loss on to its share price and legacy V1.1
vaults do not. The docs' "debt stays in the market" wording was dropped: it reads as if the borrower's debt survived,
while `Morpho.sol` writes the borrower's remaining debt off in the liquidation (section 2).

## 9. Aave comparison

From this repo's `content/blog/how-aave-liquidation-works.mdx`: 50% or 100% close factor with a $1,000 dust rule,
per-asset bonus with a protocol fee, pause with grace period, deficit and Umbrella.

## 10. Tokenping

From the task brief, spot-checked in the repo: 5-minute checks (`vercel.json` cron `*/5 * * * *` on
`/api/cron/notifications`), only of positions with a saved alert (`readMorphoPositions` in
`services/notifications/morphoAlerts.ts` reads the alert rows); 14 networks; Midnight on Ethereum, Base, Arc and
Robinhood Chain in `config/morpho.ts`, but only `listed=true` markets are read (`services/morpho/api.ts`) and the API
listed Midnight markets only on Ethereum and Base on 26 Oct 2026, so the guide words it as the other Morpho guides do
(listed markets, Ethereum and Base on that date, Arc and Robinhood Chain once Morpho lists markets there); health from the chain with Morpho's math (`services/morpho/health.ts`); Morpho
threshold 1.02 to 10 (`utils/notifications/threshold.ts`); lower of the LLTV and pre-liquidation lines; 7-day and
24-hour maturity reminders (`services/notifications/maturityReminders.ts`); price via `<AlertPrice />`.

## 11. Left out

- The identity of the BTC/USD feed `0x64c9…848F` was not checked against Chainlink's feed list, so the article says "a
  BTC/USD price feed".
- No Midnight launch date and no total Midnight market count (placeholder markets with maturity 0 appear in the API).
- Midnight deployed bytecode was not compared with GitHub HEAD; deployed views match the repo interface.
