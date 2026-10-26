# Data snapshot: morpho-midnight-fixed-rate-loans

Every on-chain figure, API figure, date and mechanism in `content/blog/morpho-midnight-fixed-rate-loans.mdx`, written
2026-10-26. All times are UTC. A research pass (06:00 to 06:15) read the API, the contracts and Morpho's docs; the writer
then re-read the market definitions, oracle prices, totals, fees and the median position below with `cast` (Foundry) at
the same blocks and found the same values, re-checked the API's listed markets per chain and the Base order book at
about 06:17, and re-read the contract source lines cited in section 6. The ScopeNote shows the Morpho figures date,
26 Oct 2026. No borrower's address is recorded here.

## 1. Contracts and deployment

Midnight core addresses from `config/morpho.ts`, matching docs.morpho.org/developers/contracts/addresses (Morpho
Midnight tab). `cast keccak $(cast code <addr>)` returned
`0x94dfc372cddf727c3cb9649ffab79f400260e1f50c380324e4ad0cf5ab29d9a7` on all five chains (same code everywhere).

| Network | Midnight | First block with code | Time | How found |
| --- | --- | --- | --- | --- |
| Base | `0xAdedD8ab6dE832766Fedf0FaC4992E5C4D3EA18A` | 48286884 | 2026-07-06 18:38:35 | binary search on `cast code --block`, mainnet.base.org |
| Ethereum | `0x471686c42792F93528B000beF54bC10E3aa2045f` | 25798183 | 2026-08-20 18:39:47 | creation tx `0x935b62f793bf14ff7a61fdbe846bdb22399758c37faee802ac2390a376f7b2ae` (Blockscout), `cast receipt` |
| Arc | `0x208786922BE56fDE2D1Fa60e6b9eC5D723e8d7b0` | 20320779 | 2026-09-11 14:06:47 | binary search |
| Tempo | `0x31Ff800b0FA4AA42071d4ae9D0392e84f256D83D` | 42413205 | 2026-10-03 12:33:39 | binary search |
| Robinhood Chain | `0x6120765Ba5336150BbdDdD0Cd9108B5bFD369632` | not read | | robinhood-rpc.publicnode.com and rpc.mainnet.chain.robinhood.com both refuse historical state (re-tried in review); the guide says "Date not available" (was "Not checked" before the cluster review) |

Public launch: "Now Live: Morpho Midnight & New Markets App", published 2026-07-21 (page meta), launch on Base with
cbBTC/USDC and a limited set of maturities; "Auto-rolling, callbacks, and vault allocations are upcoming"; rates "are
not guaranteed"; Midnight "isn't a 'V2' of Morpho Blue". "Morpho Midnight: What to Expect at Launch" (2026-07-17): Base,
cbBTC/USDC, several maturities. The earlier post at morpho.org/blog/morpho-v2-liberating-the-potential-of-onchain-loans
(page title "Morpho Fixed Rate Markets") calls Midnight plus Vaults V2 "Morpho V2". Both pages re-fetched by the writer.

BlueFallbackRolling on all five networks: docs addresses page (Ethereum `0x6910E21c20a09BB3a2026a24585aF1E63d769fe6`, Arc
`0x405711971ef6Be74114778CEfba9a2F2e4648f3d`, Base `0x7bfA8207B818cc0e23a7aBdCBe56572fAbCa831F`, Robinhood Chain
`0x1D0A555d4fd62BbBEeA9A441aa3D8FD7D4B42878`, Tempo `0x9b28416022e883BCaf8DFb967e0DE345F444658c`).

## 2. Markets listed by Morpho's API (26 Oct 2026)

Paged `GET https://api.morpho.org/v0/midnight/markets?chain_ids=<id>&limit=100` through every cursor (06:05 and 06:13),
counting `listed` and `total_units > 0`:

| Network (chain id) | Markets | Listed | Listed with units | Listed with borrower debt (the guide's "open loans") |
| --- | --- | --- | --- | --- |
| Ethereum (1) | 1069 | 984 | 13 | 12 |
| Base (8453) | 1151 | 957 | 36 | 19 |
| Arc (5042) | 13 | 0 | (11 unlisted markets hold units) | |
| Robinhood Chain (4663) | 34 | 0 | (7 unlisted markets hold units) | |
| Tempo (4217) | 0 | 0 | | |

`total_units` is lender credit, not borrower debt: `repay` lowers the borrower's debt and raises `withdrawable`, and
totalUnits falls only when lenders withdraw. So a fully repaid market still holds units. Review pass (about 08:00): for
every listed market with units on 1 and 8453, summed `debt` over every page of
`GET /v0/midnight/markets/<id>/positions?types=borrow&chain_id=<id>&limit=100`. Ethereum: 12 with debt; the 13th
(`0x2a9ae590…`, maturity 25 Sep 2026) has 0. Base: 19 with debt; the 17 others have 0, namely every off-cycle or past
maturity (31 Jul, 4, 5, 6, 8, 12, 14, 15, 22, 26, 28 Aug, 9, 20, 25 Sep, 14 Oct 2026), plus `0x8a7f2435…` (25 Dec 2026)
and `0xfbbdc1b3…` (29 Jan 2027), which have no borrowers. On-chain check at the latest block on mainnet.base.org:
`withdrawable(bytes32)` equals `totalUnits(bytes32)` (so outstanding debt totalUnits − withdrawable is 0) for
`0x549cd072…` (1900030624), `0x8a7f2435…` (20457136) and `0x168e3125…` (264663483).

Writer's re-check about 06:17: `?chain_ids=<id>&listed=true&limit=5` returns data for 1 and 8453 and
`{"cursor":null,"data":[]}` for 5042, 4663 and 4217. No listed market on Ethereum or Base has an enter or liquidator
gate. Maturities of listed markets with borrower debt, on both chains: 30 Oct, 27 Nov and 25 Dec 2026 and 26 Mar 2027
(all Fridays, 15:00). Base: five markets each on 30 Oct and 27 Nov, four on 25 Dec, five on 26 Mar 2027; Ethereum: four
on 30 Oct, four on 27 Nov, three on 25 Dec, one on 26 Mar 2027. Listed markets with maturity 0 (131 on Ethereum, 50 on
Base, none holding units) are left out of the guide. Tempo: the API lists no market; no on-chain enumeration was done, so
the guide says only that the API shows none.

Note: `config/morpho.ts` marks Arc and Robinhood Chain `midnightListed: true` ("as of 25 Oct 2026"), but Tokenping's
Midnight reads keep only `listed === true` markets, so on 26 Oct 2026 Midnight alerts could only apply on Ethereum and
Base. After the cluster review the guide (and the other three Morpho guides) says: Midnight alerts cover listed markets,
on Ethereum and Base on 26 Oct 2026; Arc and Robinhood Chain are covered once Morpho lists Midnight markets there, and
until then no Midnight alerts are possible there. Re-checked in the review: `listed=true` returns no data for 5042 and
4663.

The table's listed cells now read "Yes; 19 listed markets have open loans" (Base) and "Yes; 12 ..." (Ethereum), so
the counts are not read as totals (957 and 984 listed, column "Listed" above).

## 3. Base cbBTC/USDC market (worked example)

Market id `0x9593c3a6dba45b6106af8dc8b45ba8c505d90d3d68a3d33f7c278dd921b637da`, listed, largest listed Base market by
units. Block 53102734, timestamp 1792994815 (2026-10-26 06:06:55), RPC base-rpc.publicnode.com.

Created before the public launch: `tickSpacing(bytes32)` on mainnet.base.org is 0 at block 48640665 and 4 at block
48640666 (timestamp 1784070679, 2026-07-14 23:11:19), a week before the 21 Jul launch post, which names only the pair
(cbBTC/USDC on Base) and "a limited set of maturities". The guide says the market is on the launch pair and was created
on 14 Jul 2026; it does not claim it was one of the app's launch markets.

- `toMarket(bytes32)`: chain 8453; loan `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC, 6 decimals); one collateral
  `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` (cbBTC, 8 decimals), LLTV 860000000000000000, cursor 300000000000000000,
  oracle `0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9`; maturity 1798210800 (2026-12-25 15:00:00, Friday); rcfThreshold
  3000000000 (3,000 USDC); enterGate and liquidatorGate 0x0.
- `marketState(bytes32)`: totalUnits 1530235581880 (1,530,235.58 USDC), lossFactor 0, withdrawable 0, continuousFeeCredit 0,
  seven settlement fee breakpoints 0, continuousFee 0, tickSpacing 4.
- Oracle `price()`: 800973300000000000000000000000000000000, ÷ 1e36 × 1e8 ÷ 1e6 = 80,097.33 USDC per cbBTC.
- Time left: (1798210800 − 1792994815) ÷ 86400 = 60.37 days.
- maxLif = 1 ÷ (1 − 0.3 × 0.14) = 1.04384 (bonus 4.38%). 30 minutes after maturity: 1 + 0.04384 × 0.5 = 1.0219.
- Borrowers: 117 (API `GET /v0/midnight/markets/<id>/positions?types=borrow`, every page); sum of debts equals totalUnits
  exactly. API `effective_apr` for borrowers: 1.93% to 6.84% (median 5.95%), labelled in the guide as Morpho's figure.

Median-sized position (debt quartiles 4.00 / 37.08 / 683.59 USDC), at block 53102734: `debt(id,user)` 37079462,
`collateralBitmap` 1, `collateral(id,user,0)` 60018 (re-read by the writer; the API agrees). Python:

- collateral 0.00060018 × 80,097.33 = 48.0728 USDC; maxDebt × 0.86 = 41.3426; HF 41.3426 ÷ 37.0795 = 1.1150
- HF 1 at 37.079462 ÷ (0.00060018 × 0.86) = 71,837.87 USDC, 10.31% below 80,097.33. At exactly 71,838 maxDebt is
  37.07953 > 37.079462, still healthy (normal-mode liquidation needs `originalDebt > maxDebt`), so the guide says "just
  below 71,838"
- liquidated in full at that price: seized value 37.0795 × 1.04384 = 38.7051; collateral then worth 43.1157; left 4.4106
- post-maturity at 80,097.33 after the 60-minute ramp: seized 38.705075, left 48.072816 − 38.705075 = 9.367740; on-time
  repayment leaves 48.072816 − 37.079462 = 10.993354 net; difference 1.625613 = 37.079462 × 0.0438413, shown as 1.63
  (Python Decimal, review pass). Cluster review: the guide now says this is the cost of a liquidation an hour or more
  after maturity, that a liquidator may act any second after 15:00:00 (`block.timestamp > maturity`), and that an
  earlier liquidation costs less (bonus 1 + 0.04384 × elapsed ÷ 60 minutes).

Order book, `GET https://api.morpho.org/v0/midnight/books/<id>` (research pass about 06:10; writer about 06:17, same top of
book): best bid 990129700000000000 (tick 4296), best ask 993356600000000000 (tick 4376).

- bid 0.9901297: 1 ÷ P − 1 = 0.99687%; × 365 ÷ 60.37 = 6.03% a year; 10,000 ÷ 0.9901297 = 10,099.69 USDC owed
- ask 0.9933566: 0.6688%, 4.04% a year (not used in the guide)

## 4. Ethereum USDC market (multi-collateral example)

Market id `0xcf447db8cff164867b02edbf7ee7af06d241d4f3a44b34d6e3a3ea872ddea5d6`, listed, largest listed Ethereum market.
Block 26274992, timestamp 1792995155 (06:12:35), RPC ethereum-rpc.publicnode.com, re-read by the writer.

- `toMarket`: loan USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`; collateral 1 USDC, LLTV 0.98, cursor 0.3, oracle
  `0x8d1A84515B54C58bAc3b18315B6b1f17dA5cf6ca` (`price()` 1e36, 1:1); collateral 2 cbBTC, LLTV 0.86, cursor 0.3, oracle
  `0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a` (`price()` 800114843487200000000000000000000000000 = 80,011.48 USDC);
  maturity 1798210800; rcfThreshold 300000000000 (300,000 USDC); no gates.
- `totalUnits` 23899202747274 (23.90M USDC), `continuousFee` 0; settlement fees all 0 (research pass, `settlementFeeCbps`).
- Illustrative position (not a real wallet), the same one as in `morpho-health-factor.mdx`'s Midnight section: 0.5 cbBTC
  = 40,005.74 × 0.86 = 34,404.94; 10,000 USDC × 0.98 = 9,800.00; maxDebt 44,204.94; debt 40,000; HF 1.1051; HF 1 at
  (40,000 − 9,800) ÷ (0.5 × 0.86) = 70,232.56 USDC, 12.22% below 80,011.48 (Python Decimal, review pass).
- USDC collateral bonus: 1 ÷ (1 − 0.3 × 0.02) = 1.0060.

## 5. Morpho Blue comparison

morpho-blue `src/libraries/ConstantsLib.sol`: LIQUIDATION_CURSOR 0.3e18, MAX_LIQUIDATION_INCENTIVE_FACTOR 1.15e18;
`src/Morpho.sol` `liquidate`: incentive = min(1.15, 1 ÷ (1 − 0.3 × (1 − LLTV))), no close factor; `_accrueInterest` grows
debt with the market's IRM. Pre-liquidation exists for Blue only (Morpho's PreLiquidationFactory per chain in
`config/morpho.ts`); Midnight's repo and periphery README list no pre-liquidation contract.

Cluster review (26 Oct 2026): the comparison table's Blue "How much at once" cell now reads "Up to all of the debt in
one call" (no close factor; repaid amount capped by the debt), the same wording as the liquidation guide; its
pre-liquidation cell says Morpho is retiring the feature (snapshots/morpho-pre-liquidation.md, section 8). The RCF
exception is worded per collateral (section 6). The guide explains once that it names a Midnight market by its pair,
collateral first ("cbBTC/USDC"), and writes "21 Jul 2026" like the rest of the cluster.

## 6. Midnight mechanics (github.com/morpho-org/midnight at 719fe585, 2026-10-22)

| Claim in the guide | Where |
| --- | --- |
| Market fields: loan token, collaterals (token, LLTV, cursor, oracle), maturity, rcfThreshold, gates | `src/interfaces/IMidnight.sol` lines 5-21 |
| Markets immutable, up to 128 collaterals, LLTV and cursor must be enabled, maxLif ≤ 2 | `Midnight.sol` `touchMarket` lines 750-788; `ConstantsLib.sol` MAX_COLLATERALS |
| No 15% bonus cap on Midnight: only maxLif ≤ 2 and LLTV × maxLif ≤ 0.999 (Blue's 1.15 cap is Blue only) | `touchMarket` lines 766-768 |
| At most 16 collaterals per borrower | `ConstantsLib.sol` MAX_COLLATERALS_PER_BORROWER; `supplyCollateral` |
| Gates cannot block exits | `Midnight.sol` header, GATES |
| Borrowing sells units at a price; debt changes only in take (selling units raises it, buying units back lowers it, line 395), repay, liquidate | `take` lines 379-401, `repay` line 501, `liquidate`; `updatePosition` touches lender credit and pendingFee only |
| No new debt after maturity | `take`: `CannotIncreaseDebtPostMaturity` |
| Settlement fee caps 0.0014% (0 and 1 day) to 0.5% (360 days); continuous fee ≤ 1% a year, lenders only | `ConstantsLib.sol` lines 11-18; header, SETTLEMENT FEES and CONTINUOUS FEES |
| Healthy while maxDebt ≥ debt; maxDebt = Σ value × LLTV | `isHealthy` lines 855-872 |
| Collateral mix can change; withdrawals health-checked | header, MULTI-COLLATERAL MARKETS; `withdrawCollateral` |
| Reverting oracle blocks liquidate, and isHealthy, withdrawCollateral and take while the user has debt; repay calls no oracle; zero debt needs no oracle | header, LIVENESS lines 120-122; `repay` lines 495-514; `isHealthy` line 853 |
| Bonus maxLif = 1 ÷ (1 − cursor × (1 − LLTV)) | `ConstantsLib.sol` `maxLif` |
| Normal mode: `originalDebt > maxDebt`; post-maturity mode: `block.timestamp > maturity` only | `liquidate` lines 615-619 |
| RCF caps repaid amount to what restores health; lifted per collateral when `collateral[collateralIndex] × price ÷ lif − maxRepaid < rcfThreshold`; none in post-maturity mode | `liquidate` lines 651-663; header, LIQUIDATIONS lines 54-65; docs collateral-health-liquidations ("per-collateral exception") |
| Post-maturity bonus from 1 to maxLif over 60 minutes | TIME_TO_MAX_LIF; `liquidate` lines 641-643 |
| After maturity an unhealthy borrower's liquidator can choose either mode (normal mode: full maxLif at once) | header, LIQUIDATIONS line 53; docs liquidations ("before or after maturity") |
| Repaying early refunds no interest: repay charges exactly `units` loan tokens | `repay` lines 495-514; docs exit-borrow-early ("par is the ceiling") |
| Liquidator picks collateral and amount | `liquidate(collateralIndex, seizedAssets or repaidUnits)` lines 638-649 |
| Bad debt shared by that market's lenders | `liquidate` lines 599-636 (lossFactor); docs liquidations page |
| Repay costs exactly `units`, no maturity check | `repay` lines 495-514 |
| Collateral stays until withdrawn; zero debt passes without oracles | `withdrawCollateral` lines 544-568; `isHealthy` |
| BlueFallbackRolling: opt-in, authorise on Midnight and Blue, permissionless roll from a start time, caller incentive a share of debt set by the borrower, rising linearly from start to end, capped at 100%, borrowed on Blue against the borrower's collateral (so added to the new Blue debt), one matching collateral | `src/periphery/README.md` lines 24-34; `BlueFallbackRolling.sol` |

## 7. Morpho docs (docs.morpho.org, fetched 2026-10-26)

| Page | Supports |
| --- | --- |
| /learn/concepts/midnight | units, credit and debt; annualization by dividing the term rate by the share of a year left (5.26% ÷ 0.5 = 10.53% APR); early exits (buy units, repay one token per unit); healthy when debt ≤ maxDebt; collateral mix |
| /learn/concepts/midnight/liquidations | two paths; post-maturity "regardless of the position's health"; lenders expect to redeem at maturity; strictly after maturity; LIF ramp 60 minutes; table: healthy at exact maturity not liquidatable |
| /learn/concepts/midnight/offers | callbacks; a borrower near maturity can repay or buy back and enter a later maturity atomically (llms-full.txt, re-searched in review: no other rolling than this and BlueFallbackRolling) |
| /learn/concepts/midnight/gates | gates restrict entry or liquidation, never exits |
| /developers/midnight/get-started, /concepts/market-mechanics | rate from price, no IRM, different borrowers different rates, Blue vs Midnight |
| /developers/midnight/concepts/collateral-health-liquidations | new collateral needs a new market; liquidators pick the best-paying collateral; states health as maxDebt ≥ debt and calls pre-maturity liquidation "health-factor based" (so the guide no longer says Morpho's docs avoid the term); rcfThreshold exception is per collateral |
| /developers/midnight/concepts/fees | settlement and continuous fees |
| /developers/midnight/tutorials/exit-borrow-early | par is the ceiling for an early exit |
| /developers/midnight/tutorials/exit-borrow-by-repaying-in-full-at-maturity | repay in full, then withdraw |
| /developers/contracts/addresses | Midnight and BlueFallbackRolling addresses per network |
| llms.txt | names "Fixed Rate Markets (Midnight)" and "Variable Rate Markets (Blue)" |

Some developer tutorials speak of "accrued debt"; the contract has no borrower interest accrual (section 6), so the guide
follows the contract.

## 8. Tokenping (this repo)

| Claim | Where |
| --- | --- |
| Checks every 5 minutes | `vercel.json` cron `*/5 * * * *`; `constants/notifications.ts` |
| Health from the chain with Morpho's math, never the API | `services/morpho/health.ts` `readMidnightHealth`; `services/morpho/math.ts`; `services/notifications/morphoAlerts.ts` header |
| Threshold 1.02 to 10 | `constants/notifications.ts` MORPHO_HEALTH_FACTOR_THRESHOLD_MIN 1.02, HEALTH_FACTOR_THRESHOLD_MAX 10 |
| Health alert at each check below threshold; 7-day reminder (1 day < left ≤ 7 days); 1-day reminder (≤ 24 hours); after maturity an alert at every check while debt remains; nothing without debt | `morphoNotices` in `services/notifications/morphoAlerts.ts`; reminders sent once per alert and maturity (`services/notifications/maturityReminders.ts`) |
| Midnight alerts only on listed markets | `config/morpho.ts` `MORPHO_MIDNIGHT_CHAINS`; `services/morpho/api.ts` keeps `listed === true` |
| 14 networks, Blue and Midnight, dashboard needs no payment, alerts at `<AlertPrice />` | `config/morpho.ts` `MORPHO_CHAINS`; task brief facts |
