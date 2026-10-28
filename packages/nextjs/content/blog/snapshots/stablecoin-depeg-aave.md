# Data snapshot: stablecoin-depeg-aave

Every on-chain figure, governance date and quoted claim in `content/blog/stablecoin-depeg-aave.mdx`, written
2026-10-28. All times are UTC. On-chain values were read by the writer with `cast` 1.1.0 against
https://ethereum-rpc.publicnode.com (current state) and https://eth.drpc.org (historical `eth_call` and `eth_getLogs`,
which publicnode refuses without a token). Web sources were fetched on 28 Oct 2026. The ScopeNote date (14 Oct 2026) is
shared by every post, so the figures here carry their own date in the text.

## 1. Contracts (Aave V3 Ethereum Core)

| Contract | Address |
| --- | --- |
| Pool | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` |
| PoolDataProvider | `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` |
| AaveOracle | `0x54586bE62E3c3580375aE3723C145253060Ca0C2` (8 decimals, USD) |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| USDe | `0x4c9EDD5852cd905f086C759E8383e09bff1E68B3` (from `Pool.getReservesList()`; `symbol()` = "USDe") |
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| USDS | `0xdC035D45d973E3EC169d2276DDab16f1e407384F` |
| PYUSD | `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8` |
| GHO | `0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f` |
| sUSDe | `0x9D39A5DE30e57443BfF2A8307A4256c8797A3497` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |

Addresses from `config/aaveConfig.ts` and `content/blog/snapshots/aave-health-factor.md`.

## 2. Risk parameters and oracle reads, block 26291704 (2026-10-28 14:03:35, timestamp 1793196215)

`PoolDataProvider.getReserveConfigurationData(asset)` (decimals, ltv, liquidationThreshold, liquidationBonus,
reserveFactor, usageAsCollateralEnabled, borrowingEnabled, stableBorrowRateEnabled, isActive, isFrozen) and
`AaveOracle.getAssetPrice(asset)` / `getSourceOfAsset(asset)`:

| Asset | LTV | LT | Bonus | RF | Price (8 dec) | Source |
| --- | --- | --- | --- | --- | --- | --- |
| USDC | 7500 | 7800 | 10450 | 1000 | 99971803 = $0.99971803 | `0x3f73F03aa83B2A48ed27E964eD0fDb590332095B` |
| USDT | 7500 | 7800 | 10450 | 1000 | 99842395 = $0.99842395 | `0x260326c220E469358846b187eE53328303Efe19C` |
| USDe | 0 | 7500 | 10850 | 2500 | 99842395 = $0.99842395 | `0xC26D4a1c46d884cfF6dE9800B6aE7A8Cf48B4Ff8` |
| DAI | 0 | 7700 | 10500 | 2500 | 99923138 = $0.99923138 | `0x5c66322CA59bB61e867B28195576DbD8dA4b08dE` |
| USDS | 0 | 7800 | 10750 | 2500 | 99972900 = $0.99972900 | `0x94C7FD62fd0506e71d8142E9D36687fC72A86B02` |
| PYUSD | 0 | 7800 | 10750 | 1000 | 99988808 = $0.99988808 | `0x36964C0579D02E0a5AaAb89E24Cf8d7CDF3549EE` |
| GHO | 0 | 0 | 0 | 10000 | 100000000 = $1.00000000 | `0xD110cac5d8682A3b045D5524a9903E031d70FCCd` |
| sUSDe | 0 | 7500 | 10850 | 2000 | 125333685 = $1.25333685 | `0x42bc86f2f08419280a99d8fbEa4672e7c30a86ec` |
| WETH | 8100 | 8400 | 10500 | 1500 | 233508443741 = $2,335.08443741 | `0x5424384B256154046E9667dDFaaa5e550145215e` |

All active, none frozen. GHO: usageAsCollateralEnabled false. WETH's threshold is 84% here; the 14 Oct 2026 posts read
83% at block 26193284 (not investigated for this guide; the article uses 84% with its own block).

Adapter getters at the same block (`description()`, `getPriceCap()`, `isCapped()`, `latestAnswer()`,
`ASSET_TO_USD_AGGREGATOR()` and that aggregator's `description()` / `latestAnswer()`):

| Adapter | description | getPriceCap | isCapped | latestAnswer | Aggregator | Aggregator description / answer |
| --- | --- | --- | --- | --- | --- | --- |
| USDC `0x3f73…095B` | "Capped USDC / USD" | 104000000 | false | 99971803 | `0xEa674bBC33AE708Bc9EB4ba348b04E4eB55b496b` | "USDC / USD" / 99971803 |
| USDT `0x2603…e19C` | "Capped USDT/USD" | 104000000 | false | 99842395 | `0x3E7d1eAB13ad0104d2750B8863b489D65364e32D` | "USDT / USD" / 99842395 |
| USDe `0xC26D…4Ff8` | "Capped USDT/USD" | reverts (no selector `0x4c7afe60`) | false | 99842395 | `0x3E7d1eAB13ad0104d2750B8863b489D65364e32D` | "USDT / USD" / 99842395 |
| DAI `0x5c66…08dE` | "Capped DAI/USD" | 104000000 | false | 99923138 | `0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9` | "DAI / USD" / 99923138 |
| USDS `0x94C7…6B02` | "Capped USDS/USD" | 104000000 | false | 99972900 | `0xfF30586cD0F29eD462364C7e81375FC0C71219b1` | "USDS / USD" / 99972900 |
| PYUSD `0x3696…9EE` | "Capped pyUSD/USD" | 104000000 | false | 99988808 | `0x8f1dF6D7F2db73eECE86a18b4381F4707b918FB1` | "PYUSD / USD" / 99988808 |
| sUSDe `0x42bc…86ec` | "Capped sUSDe / USDT / USD" | reverts | false | 125333685 | reverts | (different adapter type) |
| GHO `0xD110…FCCd` | reverts | reverts | reverts | 100000000 | reverts | (fixed source) |

USDe adapter `0xC26D4a1c46d884cfF6dE9800B6aE7A8Cf48B4Ff8`: `cast selectors` on its bytecode lists `setPriceCap(int256)`,
`decimals()`, `ASSET_TO_USD_AGGREGATOR()`, `latestAnswer()`, `isCapped()`, `description()`, `ACL_MANAGER()` and not
`getPriceCap()` (which the USDT adapter `0x2603…` has). Storage slot 2 of both adapters = `0x…0632ea00` = 104000000,
slot 1 = "Capped USDT/USD", slot 0 = 8 (decimals). Etherscan (fetched 28 Oct 2026): verified as `PriceCapAdapterStable`,
source files `src/contracts/PriceCapAdapterStable.sol` and `src/interfaces/IPriceCapAdapterStable.sol`, created
2024-03-01 11:11:59 in block 19339947, name tag "Aave: Ethena Correlated USDe Price Feed", constructor description
"Capped USDT/USD". `ACL_MANAGER()` = `0xc2aaCf6553D20d1e9d78E365AAba8032af9c85b0`.

Old USDe source `0x55B6C4D3E8A27b8A1F5a263321b602e0fdEEcC17` (read via drpc): `description()` = "Capped USDe / USD",
`latestAnswer()` at block 26291704 = 99969500 = $0.99969500, `getPriceCap()` = 104000000.

## 3. USDe source switch (AIP 262)

Binary search of `AaveOracle.getSourceOfAsset(USDe)` over blocks 21850000 to 22150000 on eth.drpc.org: block 22002624
returns `0x55B6…cC17`, block 22002625 returns `0xC26D…4Ff8`. Block 22002625 timestamp 1741442507 = 2025-03-08 14:01:47.
`eth_getLogs` for `AssetSourceUpdated(address,address)` (topic0
`0x22c5b7b2d8561d39f7f210b6b326a1aa69f15311163082308ac4877db6339dc1`) in that block, from the AaveOracle: tx
`0xbb810541258db350d632e9a22ed7d7547509c67b2585dbc7a64a76b6ac8e42e0`, log 174 (USDe → `0xC26D…4Ff8`) and log 175
(sUSDe → `0x42bc…86ec`).

Governance record:

| Date (UTC) | Event | Source |
| --- | --- | --- |
| 2025-01-02 | ARFC "sUSDe and USDe Price Feed Update" by Chaos Labs, co-authored with LlamaRisk: "This proposal suggests hardcoding the USDe price to match the USDT price in Aave's pricing feeds"; rationale: USDT accounts for most of Ethena's hedges / minting ("over 84% of minting activity"), pricing sUSDe off USDe's secondary market exposes sUSDe-backed positions to short-term deviations and unnecessary liquidations | governance thread 20495 |
| 2025-01-03 | Replies: ElliotNess questioned the rationale (why not hardcode $1.00; "disappointingly low-quality ARFC"); a commenter noted sUSDe-backed positions would be "exposed to USDT secondary market price deviations" | thread 20495 |
| 2025-01-16 | Chaos Labs: analysis of custodians and Tether exposure, calls the USDT-pricing setup a temporary measure | thread 20495 |
| 2025-02-02 | Escalated to Snapshot (created); vote 2025-02-03 to 2025-02-06; Chaos Labs announced on 2025-02-09 that it passed (quorum reached, YAE, 645.6k votes) | thread 20495; Snapshot `0xd09ac857…6316` |
| 2025-02-19 / 03-03 | aave-proposals-v3 PR 621 ("feat: new pricefeed for USDe and sUSDe", folder `20250213_Multi_SUSDeAndUSDePriceFeedUpdate`) opened and merged; payload `AaveV3Ethereum_SUSDeAndUSDePriceFeedUpdate_20250213.sol` sets USDe → `0xC26D…4Ff8` and sUSDe → `0x42bc…86ec`; diff: USDe "Capped USDe/USD" → "Capped USDT/USD", latest answer 0.99957608 → 1.00004 | github.com/aave-dao/aave-proposals-v3/pull/621 |
| 2025-03-08 14:01:47 | Executed on Ethereum (block 22002625, above) | on-chain |

Proposal id 262 ("sUSDe and USDe Price Feed Update") from the search result pointing at
app.aave.com/governance/v3/proposal/?proposalId=262; vote.onaave.com and app.aave.com render client-side, so the
article links the vote.onaave.com page without quoting it.

## 4. 10 October 2025

| Claim | Source |
| --- | --- |
| "During the October 10th aggressive cryptocurrency market volatility events on centralized exchanges, most notably Binance," USDe's secondary market price moved "down to $0.65 at the lowest point"; the "Chainlink USDe/USD price feed, which sources from multiple venues, did not deviate significantly during this localized de-peg"; "Aave avoided immediate issues from the de-peg on Binance by pricing USDe on par with USDT"; "Aave currently prices USDe on par with the USDT price feed"; the approach "transfers the solvency risk to the Aave protocol"; "Ethena's core redemption mechanism proved resilient despite this secondary market dislocation" | LlamaRisk, ARFC "Ethena USDe Risk Oracle and Automated Freeze Guardian", 2025-10-24 19:31, thread 23303 |
| Chaos Labs reply 2025-11-02: "the Chainlink USDe/USD price reached as low as $0.977"; strongly recommended against adopting LlamaRisk's framework | thread 23303 |
| Thread auto-closed 2025-12-07, no Snapshot or AIP recorded in it | thread 23303 |
| LlamaRisk research note, published 2025-10-18: "the protocol opted to hard-code USDe's price to USDT for collateral valuation"; Aave's USDe deposits of $1.03 billion "remained remarkably stable"; USDe "briefly quoted at $0.62" per CoinGecko / "fell to around $0.60" (the article uses the forum post's $0.65 and does not quote these) | llamarisk.com/research/when-pricing-breaks-usde |
| Chaos Labs monthly update 2025-12-07: "Given the market disturbance on Oct 10, 2025, Chaos Labs identified systemic oracle dislocations"; no liquidation or bad-debt figures | thread 11174/34 |

Not found: any post-mortem counting USDe-related liquidations on Aave on 10 Oct 2025; the article says so. USDT's own
feed value on 10 Oct 2025 was not read.

## 5. March 2023

| Claim | Source |
| --- | --- |
| "The price of USDC reaches a low of around 88 cents" (2023-03-11, ~08:00 UTC); Gauntlet "recommends pausing Aave v2 and v3" at 09:19 UTC; "the Aave Guardian did not implement a pause", weighing "the strategic and philosophical implications of pausing the protocol"; around 13:00 UTC the Guardian froze "USDC, USDT, DAI, FRAX, and MAI on Aave v3 Avalanche and sets LTV to zero", which "allow[ed] liquidations to continue"; realised insolvencies "around $280k" on v3 Avalanche eMode and "around $20k" on v3 Arbitrum, about $300k in total over 11 to 12 March; no realised losses on v2; about $1mm of v2 insolvencies estimated at an 80-cent USDC price | Gauntlet, "Aave Resilient Through USDC Volatility", 2023-03-17, thread 12330 |
| Forum thread opened by Pauljlei (Gauntlet) 2023-03-11 08:13: "Action could be required both from on-chain governance and Guardian via emergency because of bad debt risk"; 09:19 "We recommend that all V2 and V3 markets should be paused temporarily"; bgdlabs 10:19: the Guardian "has the emergency capability to freeze" stablecoins and "set LTV to 0 on stablecoins on Aave v3 Avalanche"; 10:35: Avalanche because "the Aave Guardian can act immediately" there (cross-chain infrastructure does not cover it); bgdlabs 13:12: confirmed the freeze of USDC, USDT, DAI, FRAX and MAI with LTV 0 and that it does not change existing health factors | thread 12241 (forum times shown in the fetch; the article uses Gauntlet's UTC times and "about 13:00 UTC" for the freeze) |
| Aave's X post: "Aave DAO has frozen USDC, USDT, DAI, FRAX, and MAI on Aave v3 Avalanche" | x.com/aave/status/1634596115483086848; snowflake id → 2023-03-11 16:44:17 UTC |
| Circle disclosed $3.3B of reserves at Silicon Valley Bank (background; the article says only "part of USDC's reserves") | Cointelegraph summary in search results, not quoted |

Aave V3 used plain Chainlink feeds for stablecoins in March 2023; the capped adapters were set by later proposals (v3
proposal 51 and v2 proposal 82, the latter executed 2024-04-23 per app.aave.com). The article says only "the capped
adapters came later".

## 6. Mechanics

- `PriceCapAdapterStable.sol` (aave-dao/aave-price-feeds, main, fetched 28 Oct 2026): `latestAnswer()` reads
  `ASSET_TO_USD_AGGREGATOR.latestAnswer()`, returns `_priceCap` if `basePrice > priceCap`, 0 if `basePrice <= 0`, else
  `basePrice`; `isCapped()` = aggregator answer > cap; `setPriceCap` reverts unless `ACL_MANAGER.isRiskAdmin` or
  `isPoolAdmin`; `_setPriceCap` rejects negative caps, caps above `MAX_STABLE_CAP_VALUE` (2e8) and caps below the current
  aggregator price. NatSpec: "Price adapter to cap the price of the USD pegged assets". No floor.
- README: custom price feeds for Aave; "For USD-pegged stablecoins (USDC, USDT, DAI) with fixed 1:1 peg", "Price capped
  at a single configured maximum value (e.g., $1.04 for 4% cap)"; the code "were later moved and improved in the Aave
  Capo repository", which "was later renamed to Aave Price Feeds".
- Aave oracle docs (aave.com/docs/ecosystem/oracle.md): "The oracle for each reserve is selected through Aave
  Governance"; Chainlink feeds "aggregate data from multiple sources".
- Umbrella docs (aave.com/docs/aave-v3/umbrella): "Umbrella enables the corresponding staked assets to be burned and
  offset the bad debt"; "Slashing is triggered automatically by UmbrellaCore when a deficit in the corresponding Aave
  pool" passes the threshold; "Initial activation starts with Ethereum and will expand to other networks".
- Morpho docs (docs.morpho.org/learn/concepts/oracle): "Market curators (not Morpho) are responsible for selecting and
  implementing appropriate oracles for their markets"; "Once a market is deployed, its oracle address cannot be
  modified"; `price()` "returns the price of 1 unit of collateral token quoted in the loan token". No caps or floors
  mentioned.

## 7. Worked examples (writer's arithmetic)

Collateral side, USDC LT 78%, prices illustrative $1 unless stated:

- 20,000 USDC vs 10,000 USDT: 15,600 ÷ 10,000 = 1.56. USDC $0.95: 14,820 ÷ 10,000 = 1.482. USDC $0.87: 13,572 ÷ 10,000 =
  1.3572. HF 1 at USDC = 10,000 ÷ 15,600 = $0.6410.
- 20,000 USDC vs 15,000 USDT (LTV 75% limit): 15,600 ÷ 15,000 = 1.04. USDC $0.95: 14,820 ÷ 15,000 = 0.988. USDC $0.87:
  13,572 ÷ 15,000 = 0.9048. HF 1 at USDC = 15,000 ÷ 15,600 = $0.9615 (3.85% fall).
- Both at $0.95: 14,820 ÷ 14,250 = 1.04.
- WETH and USDC in equal dollar amounts: USDC weighted share 0.78 ÷ (0.84 + 0.78) = 48.1%; 13% × 48.1% = 6.3%.

Debt side, WETH LT 84%, illustrative $2,300 (oracle $2,335.08), 10 WETH = $23,000, weighted 19,320; debt 12,000 USDT:

- $1: 1.61. $0.95: 19,320 ÷ 11,400 = 1.6947. $0.87: 19,320 ÷ 10,440 = 1.8506. $1.02: 19,320 ÷ 12,240 = 1.5784. $1.04
  (cap): 19,320 ÷ 12,480 = 1.5481. Cap limits the loss to 1 ÷ 1.04 = 3.85% of the health factor.

## 8. Not verified, left out

- Why USDe (and DAI, USDS, PYUSD) have LTV 0 on Ethereum Core: no proposal found; the article states only the reading.
- Any count of Aave liquidations tied to USDe on 10 Oct 2025.
- The date of the v3 proposal that first set the stablecoin caps (proposal 51): not quoted.
- USDT/USD feed values on 10 Oct 2025.
