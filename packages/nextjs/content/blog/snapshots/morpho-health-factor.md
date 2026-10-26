# Data snapshot: morpho-health-factor

Every on-chain figure, API figure and sourced claim in `content/blog/morpho-health-factor.mdx`, written 2026-10-26. All
times are UTC. A research pass read the contracts, the docs and the API; the writer then re-read every on-chain value
below with `cast` (Foundry) against https://ethereum-rpc.publicnode.com at the same blocks and got the same results, and
re-ran the API position query. The ScopeNote date for Morpho guides is 2026-10-26 (`MORPHO_FIGURES_AS_OF` in
`components/blog/ScopeNote.tsx`). No wallet address is named or kept.

## 1. Contracts

| Contract | Chain | Address |
| --- | --- | --- |
| Morpho Blue | Ethereum, Base | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| Morpho Midnight | Ethereum | `0x471686c42792F93528B000beF54bC10E3aa2045f` |
| AdaptiveCurveIRM | Ethereum | `0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC` |
| USDC / cbBTC oracle | Ethereum | `0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a` |
| BTC / USD feed (that oracle's BASE_FEED_1) | Ethereum | `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c` |
| WETH / wstETH oracle | Ethereum | `0xbD60A6770b27E084E8617335ddE769241B0e71D8` |
| wstETH/stETH exchange rate feed (its BASE_FEED_1) | Ethereum | `0x905b7dAbCD3Ce6B792D874e303D336424Cdb1421` |
| USDC 1:1 oracle (Midnight USDC collateral) | Ethereum | `0x8d1A84515B54C58bAc3b18315B6b1f17dA5cf6ca` |
| Pre-liquidation factory | Ethereum | `0x6FF33615e792E35ed1026ea7cACCf42D9BF83476` |
| Pre-liquidation, USDC / cbBTC (86%) | Ethereum | `0xBFa7f9c1983aE40738Ea0F128e58aa704461AA3A` |

Morpho Blue and Midnight addresses also in `config/morpho.ts`; the IRM address matches "Adaptive Curve Irm" on
docs.morpho.org/developers/contracts/addresses.

## 2. Governance and LLTVs

| Call | Chain, block | Result |
| --- | --- | --- |
| Blue `owner()` | Ethereum 26274955; Base 53102888 | `0xcBa28b38103307Ec8dA98377ffF9816C164f9AFa` (Morpho governance multisig, per docs governance page) |
| Blue `isLltvEnabled(x)` at every 0.5% step from 0 to 99.5% | Ethereum 26274950 | true only for 0, 0.385, 0.625, 0.77, 0.86, 0.915, 0.945, 0.965, 0.98 (×1e18) |
| Same, re-read by the writer for those nine plus 0.90 and 0.95 | Ethereum 26274955 | the nine true, 0.90 and 0.95 false |
| Same nine values; spot checks 0.90, 0.95, 0.99 | Base 53102888 | nine true, spot checks false |
| Blue `isIrmEnabled(0x870a...00BC)` | Ethereum 26274955 | true |
| Midnight `isLltvEnabled(x)` | Ethereum 26274969 | true for 0.86, 0.98, 1.0 (and, research pass, 0.385, 0.625, 0.77, 0.915, 0.945, 0.965); false for 0 |
| Midnight `configurator()` | Ethereum 26274969 | `0xcBa28b38103307Ec8dA98377ffF9816C164f9AFa` |

The 0.5% grid scan matches the docs list "Governance-Approved LLTV & IRM"; an off-grid enabled LLTV cannot be fully ruled
out (the EnableLltv event history needs an archive RPC). After review the guide says "accepted the nine LLTVs on
Morpho's governance-approved list ... (each read as enabled ...)", which is what was checked, rather than claiming the
list is complete.

## 3. Worked example 1: USDC | cbBTC (86%), Ethereum

Market id `0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64`. Block 26274955 = 2026-10-26 06:04:59.

| Call | Result |
| --- | --- |
| Blue `idToMarketParams(id)` | loan USDC `0xA0b8...eB48`, collateral cbBTC `0xcbB7...33Bf`, oracle `0xA6D6...182a`, IRM `0x870a...00BC`, LLTV 860000000000000000 |
| Blue `market(id)` | totalSupplyAssets 343182241448906 (343.18M USDC), totalSupplyShares 312706170000445571952, totalBorrowAssets 309128945360567 (309.13M USDC), totalBorrowShares 278158029373793057629, lastUpdate 1792994675, fee 0 |
| Oracle `price()` | 800114843487200000000000000000000000000 → × 10^(8 − 6) ÷ 10^36 = 80,011.48 USDC per cbBTC |
| Oracle `BASE_FEED_1()`, `QUOTE_FEED_1()`, `SCALE_FACTOR()` | `0xF403...E88c`, zero address, 1e26 |
| Oracle `BASE_FEED_2()`, `QUOTE_FEED_2()`, `BASE_VAULT()`, `QUOTE_VAULT()` (review, latest block 26 Oct 2026) | all zero address: no cbBTC/BTC feed and no USDC feed, so 1 cbBTC counts as 1 BTC and 1 USDC as 1 dollar |
| Feed `description()`, `latestRoundData()` | "BTC / USD"; answer 8001148434872, updatedAt 1792991807 (8001148434872 × 1e26 = the price) |
| IRM `borrowRateView(params, market)` (research pass) | 1549525279 per second = 4.89% APR, e^(r × 31,536,000) − 1 = 5.008% APY |

"Largest listed Ethereum market by borrowed value": Morpho API GraphQL `markets(first:12, orderBy:BorrowAssetsUsd,
orderDirection:Desc, where:{chainId_in:[1], listed:true})`, first item this market (borrowAssetsUsd about 309.05M).

Illustrative position, 1 cbBTC against 40,000 USDC, Morpho's integer math (Python):

- collateral value = 1e8 × price ÷ 1e36 = 80,011.484348 USDC
- borrowing limit = × 0.86 = 68,809.876539 USDC
- health factor = 68,809.876539 ÷ 40,000 = 1.7202
- LTV = 40,000 ÷ 80,011.48 = 49.99%
- liquidation price = 40,000 ÷ (1 × 0.86) = 46,511.63, 41.87% below 80,011.48
- one year at 4.8866% APR continuous: debt 40,000 × e^0.048866 = 42,003.18; health factor 68,809.88 ÷ 42,003.18 = 1.638

Borrower distribution: Morpho API GraphQL `marketPositions(first:1000, where:{marketUniqueKey_in:[id], chainId_in:[1],
borrowShares_gte:"1"})`, field `healthFactor`, re-run by the writer on 26 Oct 2026: countTotal 437 (435 with a health
factor; the statistics below are over those 435, and the guide says so); median 1.961, 25th percentile 1.582, 10th percentile 1.355, 75th 2.728, lowest 1.051; share below 1.2: 3.2%,
below 1.1: 1.4%, below 1.05: 0%. Market aggregate from `marketById(id){state{collateralAssets borrowAssets}}` at API
block 26274956: collateral 841983154169 (8,419.83 cbBTC); at the block-26274955 oracle price that is 673.68M USDC against
309.13M borrowed: aggregate LTV 45.9%, aggregate health factor 0.86 × 673.68 ÷ 309.13 = 1.874.

## 4. Pre-liquidation on that market

Block 26274984. Morpho API `marketById(id){preLiquidations{items{address ...}}}` returned `0xBFa7...AA3A`.

| Call | Result |
| --- | --- |
| Factory `isPreLiquidation(0xBFa7...AA3A)` | true |
| `ID()` | the market id above |
| `preLiquidationParams()` | preLltv 832603694978499652 (83.26%), preLCF1 2001493508968667, preLCF2 245311807032632372, preLIF1 = preLIF2 = 1043841336116910229, oracle `0xA6D6...182a` |

Example on that line: 80,011.48 × 0.8326037 ÷ 40,000 = 1.665. Acts only on borrowers who authorised it (pre-liquidation
README). `PreLiquidation.sol` requires preLltv < LLTV.

## 5. Worked example 2: WETH | wstETH (96.5%), Ethereum

Market id `0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e`, block 26274979.

| Call | Result |
| --- | --- |
| Blue `idToMarketParams(id)` | loan WETH `0xC02a...6Cc2`, collateral wstETH `0x7f39...2Ca0`, oracle `0xbD60...71D8`, IRM AdaptiveCurveIRM, LLTV 965000000000000000 |
| Oracle `price()` | 1247173073344729899000000000000000000 = 1.247173 WETH per wstETH |
| Oracle `BASE_FEED_1()`; feed `description()` | `0x905b...1421`; "wstETH/stETH exchange rate" |
| wstETH `stEthPerToken()` | 1247173073344729899, equal to the oracle's answer |
| Oracle `BASE_FEED_2()`, `QUOTE_FEED_1()`, `QUOTE_FEED_2()`, `BASE_VAULT()` (review) | all zero address: only the exchange rate and interest move this health factor |

10 wstETH against 11 WETH: collateral 12.4717 WETH, limit 12.0352, health factor 1.0941; liquidation at
11 ÷ (10 × 0.965) = 1.13990 WETH per wstETH, 8.60% below 1.24717.

## 6. Midnight example, Ethereum

Market id `0xcf447db8cff164867b02edbf7ee7af06d241d4f3a44b34d6e3a3ea872ddea5d6`, block 26274969. Largest listed Midnight
market on Ethereum by `total_units` (23899202747274, 23.9M USDC units; next 13.9M) in the research pass over
`GET https://api.morpho.org/v0/midnight/markets?limit=100` (paginated, 1,941 listed markets, all on Ethereum and Base).

| Call | Result |
| --- | --- |
| Midnight `toMarket(id)` | chainId 1, loan USDC; collaterals (USDC, LLTV 0.98, cursor 0.3, oracle `0x8d1A...f6ca`) and (cbBTC, LLTV 0.86, cursor 0.3, oracle `0xA6D6...182a`); maturity 1798210800 = 2026-12-25 15:00:00 |
| Oracle `0x8d1A...f6ca` `price()` | 1e36 (1 USDC = 1 USDC) |
| Midnight `toMarket(id)` gates (review, latest block 26 Oct 2026) | rcfThreshold 3e11, enterGate and liquidatorGate both zero address: anyone may liquidate in this market. `Midnight.sol` L592-593 reverts a liquidation when a liquidatorGate is set and refuses the caller; docs.morpho.org/learn/concepts/midnight: markets may set up to two optional gates at creation, fixed thereafter |

0.5 cbBTC + 10,000 USDC against 40,000 debt units: 0.5 × 80,011.48 × 0.86 = 34,404.94; 10,000 × 0.98 = 9,800; total
44,204.94; health factor 1.105.

## 7. Arithmetic in the guide (Python)

- Liquidation incentive = min(1.15, 1 ÷ (1 − 0.3 × (1 − LLTV))): 38.5% 1.1500 (cap), 62.5% 1.1268, 77% 1.0741, 86% 1.0438,
  91.5% 1.0262, 94.5% 1.0168, 96.5% 1.0106, 98% 1.0060. Cluster review (26 Oct 2026): the hub no longer carries the
  incentive table or its "price fall before collateral is worth less than the debt" column (1 − LLTV), which did not match
  the liquidation guide's bad-debt line (LTV above 1 ÷ LIF). The hub keeps the formula and the 86% example (100 repaid →
  104.38 seized) and links to the liquidation guide, which holds the full table.
- Price fall to liquidation = 1 − 1 ÷ HF: 1.10 → 9.09%, 1.25 → 20%, 1.50 → 33.3%, 2.00 → 50%, 1.72 → 41.9%.
- Share of the limit borrowed f → HF = 1 ÷ f: 50% → 2.00, 70% → 1.43, 80% → 1.25, 90% → 1.11.

## 8. Code (read 26 Oct 2026)

| Claim | Source |
| --- | --- |
| Five parameters stored once in `createMarket`; IRM and LLTV must be enabled; no setter for them | morpho-blue `src/Morpho.sol` L150-163 (main `9cf6d5b`; same at tag v1.0.0) |
| `enableLltv` requires lltv < 1e18; owner can enable but not disable LLTVs and IRMs | `Morpho.sol` L113-118; `IMorpho.sol` L60, L86, L90 |
| `_isHealthy`: borrowed rounded up, maxBorrow = collateral × price ÷ 1e36 × lltv rounded down, `maxBorrow >= borrowed`; "Rounds in favor of the protocol", one unit less | `Morpho.sol` L515-539 |
| Borrow and withdrawCollateral require healthy; liquidate requires not healthy | `Morpho.sol` L258, L337, L363 |
| Liquidation incentive formula, cursor 0.3, cap 1.15; ORACLE_PRICE_SCALE 1e36 | `Morpho.sol` L366-369; `ConstantsLib.sol` L8, L11, L14 |
| Interest accrual; fee taken from interest already added, MAX_FEE 25% | `Morpho.sol` L482-505; `ConstantsLib.sol` L5 |
| Oracle price scale and decimals; "user's responsibility to select markets with safe oracles" | `src/interfaces/IOracle.sol` L8-13 |
| AdaptiveCurveIRM target utilization 90%, rate at target 0.1% to 200% a year; CURVE_STEEPNESS 4, comments "minimum rate = 0.025%", "maximum rate = 800%" (re-read on main in review) | morpho-blue-irm `src/adaptive-curve-irm/libraries/ConstantsLib.sol` (`b9a5806`) |
| Pre-liquidation acts only while borrowed <= collateral × LLTV and borrowed > collateral × PRE_LLTV (priced by its own oracle), so it can close part of a position whose LLTV health factor is above 1 | pre-liquidation `src/PreLiquidation.sol` L145-147 |
| Midnight liquidation condition `postMaturityMode ? block.timestamp > market.maturity : originalDebt > maxDebt` | `Midnight.sol` L617 |
| Midnight: up to 128 collaterals, 16 per borrower; `isHealthy` sums collateral × price ÷ 1e36 × lltv; liquidation if unhealthy or after maturity; no debt increase after maturity; TIME_TO_MAX_LIF 60 minutes | midnight `src/Midnight.sol` L18-21, L50-53, L379, L615-619, L855-872; `ConstantsLib.sol` L19-21 (main `719fe58`, BUSL-1.1) |
| Midnight debt changes only on trades, repay and liquidation; continuous fee charged to lenders (pendingFee), not to debt | `Midnight.sol` L45-46, L395, L401, L501, L623, L671 |

## 9. Docs and help centre (fetched 26 Oct 2026)

| Claim | Source |
| --- | --- |
| "Variable Rate Market (Morpho Blue)"; five parameters; market naming "USDC \| cbBTC (86%)"; governance-approved LLTV and IRM list | docs.morpho.org/learn/concepts/blue |
| HF formula, LTV, ORACLE_PRICE_SCALE; collateral "not cross-margined"; oracle may combine several feeds or rely on other onchain data, and HF reliability reflects the oracle's; integration best practices: alert at e.g. 1.1, keep borrows at 1.05 or higher | docs.morpho.org/developers/borrow/concepts/ltv (page title "Collateral, LTV & Health") |
| Get data tutorial title "Get Data"; Midnight concept page title "What is Midnight?" under "Fixed Rate Markets (Midnight)" | docs.morpho.org/developers/borrow/tutorials/get-data; docs.morpho.org/learn/concepts/midnight |
| API docs: GraphQL at api.morpho.org/graphql (the endpoint answers GET with 400, so the guide links the docs page); Midnight REST `GET /v0/midnight/markets`, supported chains Ethereum, Base, Arc, Robinhood Chain | docs.morpho.org/developers/api/morpho/ (page title "Morpho Blue"); docs.morpho.org/developers/api/morpho-midnight |
| Liquidation incentive formula; "approximately 1.05" at 86% (contract gives 1.0438, the guide uses the contract and notes the rounding) | docs.morpho.org/learn/concepts/liquidation |
| AdaptiveCurveIRM is the only approved IRM; IRM address immutable | docs.morpho.org/learn/concepts/irm |
| Position "can become riskier over time simply from interest accrual" | docs.morpho.org/developers/borrow/concepts/interest-rates |
| Health factor and liquidation price code (`wDivDown(maxBorrow, borrowAssets)`) | docs.morpho.org/developers/borrow/tutorials/get-data |
| Midnight: fixed rate, several collaterals each with LLTV and oracle, units repay one loan token each, "After maturity, any outstanding debt makes a position liquidatable regardless of its health"; integrators compute maxDebt themselves | docs.morpho.org/learn/concepts/midnight; docs.morpho.org/developers/midnight/concepts/collateral-health-liquidations; docs.morpho.org/developers/api/morpho-midnight |
| Governance multisig and powers (LLTV and IRM whitelisting, fee switch up to 25%) | docs.morpho.org/learn/governance/organization |
| "Listed" means shown in Morpho's interface | docs.morpho.org/get-started/resources/interface-listing-policy |
| The app shows the health factor and liquidation price on each position | help.morpho.org/en/articles/12166252-liquidation |
| API `MarketPosition.healthFactor` and `priceVariationToLiquidationPrice` | GraphQL introspection of api.morpho.org/graphql |

## 10. Aave comparison

From this repo's `content/blog/aave-health-factor.mdx` (figures read 14 Oct 2026): one health factor per Aave V3 market,
USD prices from the Aave oracle, maximum borrow leaves LT ÷ LTV = 1.031 for WETH on Ethereum Core, E-Mode categories,
governance and Risk Stewards can change thresholds. Morpho Blue has no category mechanism (checked `Morpho.sol`). Aave V4:
one health factor per Spoke and one collateral factor per asset (same file, section "Is the health factor different on
Aave V4?"), linked rather than repeated. The buffer link points at `safe-aave-health-factor.mdx` section "How much
buffer do you need to have time to act?".

## 11. Tokenping facts

From the brief, spot-checked in code: cron every 5 minutes (`vercel.json`); `MORPHO_THRESHOLD_RANGE` minimum 1.02, maximum
10 (`utils/notifications/threshold.ts`); 14 chains and `midnightListed` for Ethereum, Base, Arc and Robinhood Chain
(`config/morpho.ts`), but `services/morpho/api.ts` asks the API for `listed=true` markets only, and on 26 Oct 2026
`GET /v0/midnight/markets?chain_ids=<id>&listed=true` returned data for 1 and 8453 and `{"cursor":null,"data":[]}` for
5042 and 4663 (re-checked in the cluster review). So the guide says Midnight alerts cover listed markets, on Ethereum and
Base on that date, and that Arc and Robinhood Chain are covered once Morpho lists Midnight markets there; 7-day and 1-day maturity reminders (`services/notifications/maturityReminders.ts`); the lower of the
LLTV line and an authorised pre-liquidation line (`services/morpho/health.ts`: it computes a second health factor with
the pre-liquidation contract's own oracle price and preLltv, and keeps it when lower). Price via `<AlertPrice />`.

## 12. Left out

- Why LLTV 0 is enabled on Blue: not stated in any source read.
- Whether Morpho's app caps borrows below the LLTV: the app was not inspected; the guide only says what the contract allows
  and what Morpho's developer docs advise.
- Morpho's API lists no Midnight market as listed on Arc or Robinhood Chain today (13 and 34 markets there, none listed);
  after the cluster review the guide says so (see section 11), in the same words as the other three Morpho guides.
- Pre-liquidation sunset (cluster review): the sentence that Morpho's app no longer offers it and asks borrowers to turn
  it off rests on help.morpho.org article 12048871 "Sunsetting Auto-deleverage" (snapshots/morpho-pre-liquidation.md,
  section 8).
- Morpho docs differ on whether exactly HF 1.00 is liquidatable; the guide follows the contract (healthy at 1.00,
  liquidatable below 1).
