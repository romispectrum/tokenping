# Data snapshot: tokenized-stocks-collateral

Figures behind `content/blog/tokenized-stocks-collateral.mdx` and its translations, read on 30 Oct 2026 (Friday). On-chain
reads with `cast` (Foundry 1.1.0) against https://base-rpc.publicnode.com, https://robinhood-rpc.publicnode.com and
https://ethereum-rpc.publicnode.com; Aave V4 figures from https://api.v4.aave.com/graphql, Aave V3 from
https://api.v3.aave.com/graphql, Morpho from https://api.morpho.org/graphql. Re-read before changing a number.

## 1. Aave V4: the Coinbase Stocks Spoke on Base

Spoke `0x17905Db0e4A3514467539956c084180616AE7B8D` ("Coinbase Stocks"), oracle `0xaBaf048fD7675Ea34a84332371ffd5D55E322A47`.
Tokenping config: `config/aaveConfig.ts` lists it as "Base (V4 Coinbase Stocks)".

Aave V4 API `reserves` (chainIds 1, 43114, 5042, 8453), 30 Oct 2026 about 07:40 UTC:

| Reserve | Token | Collateral factor | Max liquidation bonus | Liquidation fee | Supply cap | Supplied | Supplied (USD) | Borrowable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AAPLc | `0xb200000000000000000000C2e324d24d7eEcd1fb` | 78% | 5.5% | 10% | 15,000 | 2,086.63 | 732,586.41 | no |
| AMZNc | `0xb200000000000000000000d9192b6B456483C2E8` | 73% | 5.5% | 10% | 10,500 | 1,938.90 | 440,346.88 | no |
| GOOGLc | `0xb2000000000000000000002D0BA3164cc74f58B7` | 76% | 5.5% | 10% | 15,000 | 12,739.91 | 3,584,143.58 | no |
| METAc | `0xb2000000000000000000008bC8786B856E61707C` | 65% | 5.5% | 10% | 5,800 | 3,374.37 | 2,088,305.41 | no |
| MSFTc | `0xB200000000000000000000Ab99cFa739E253872B` | 79% | 5.5% | 10% | 5,200 | 620.86 | 325,686.90 | no |
| NVDAc | `0xb20000000000000000000078ee7ce2fE4908108C` | 70% | 5.5% | 10% | 24,000 | 14,491.46 | 3,032,892.48 | no |
| TSLAc | `0xb2000000000000000000001e800a7f5189430cD0` | 65% | 5.5% | 10% | 14,000 | 2,610.34 | 1,030,490.91 | no |
| USDC | | 0% | | | | | 6,256,083.14 | yes, 5,020,022.47 borrowed |

Stock collateral total: 11,234,452.57 USD. All seven stock tokens: collateral only, 8 decimals, ticker and ISIN in the
API's `tokenizedStock` (exchange NASDAQ, 09:30 to 16:00 America/New_York).

Spoke liquidation config (API `spokes`): target health factor 1.24, health factor for max bonus 0.90, liquidation bonus
factor 0.9 (so the bonus is 0.9 × 5.5% = 4.95% just below 1 and 5.5% at 0.90 or lower).

On-chain, Base block 53278437 (30 Oct 2026, 07:43 UTC): `getReserveCount()` = 8; `getReserveConfig(i)` for i = 0 to 7
returned `paused false, frozen true` for every reserve (USDC: borrowable true). Each stock reserve's
`getReserveSource(i)` on the oracle and the feed's `description()` / `latestRoundData()`:

| i | Token | Source | description | answer (8 dec) | updatedAt |
| --- | --- | --- | --- | --- | --- |
| 0 | AAPLc | `0x787f13dEa48Db0897CbCDD985de77809D837F988` | Coinbase AAPL | 35108580000 = 351.09 | 1793304217 |
| 1 | AMZNc | `0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295` | Coinbase AMZN | 22711221132 = 227.11 | 1793338757 |
| 2 | GOOGLc | `0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2` | Coinbase GOOGL | 28133183413 = 281.33 | 1793330709 |
| 3 | METAc | `0x6526aE6797A76123638b863AeE4dD27Ba4E4b27D` | Coinbase META | 61887334833 = 618.87 | 1793335995 |
| 4 | MSFTc | `0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c` | Coinbase MSFT | 52457185852 = 524.57 | 1793323421 |
| 5 | NVDAc | `0x04689a41629776563E6822F76f2e57D148d28513` | Coinbase NVDA | 20928830475 = 209.29 | 1793335141 |
| 6 | TSLAc | `0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4` | Coinbase TSLA | 39477200089 = 394.77 | 1793340659 |

## 2. The freeze of 29 Oct 2026

Aave V3 Ethereum Core, block 26304159 (30 Oct 2026): PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD`
`getReserveConfigurationData`: WETH isFrozen true, USDC isFrozen true; `getPaused` false for both. (On 29 Oct, block
26296985, both were unfrozen: `snapshots/why-aave-withdraw-or-borrow-fails.md`.)

Context (Coingabbar, "Aave News: V3 and V4 Markets Frozen as Precaution", 30 Oct 2026, fetched 30 Oct 2026): Guardian
multisigs froze 175 V3 reserves on 16 networks and 117 V4 reserves on four networks between 21:42 and 23:04 UTC on 29 Oct
2026, after reports of an incident affecting Binance-affiliated wallets; Horizon left open; withdraw and repay allowed;
no unfreeze date. Aave's X post (x.com/aave/status/2115937863162339637) could not be fetched (HTTP 402); its wording is
not quoted.

## 3. Weekend price pauses (Chainlink rounds, `getRoundData`)

Coinbase NVDA feed on Base (`0x0468...8513`), phase 2: round 663 at Fri 23 Oct 2026 19:54:29 UTC (211.449), round 664 at
Mon 26 Oct 2026 00:00:55 UTC (211.868): no round for 52.1 hours.

Robinhood RHNVDA / USD feed on Robinhood Chain (`0xCF169363636D73dbBf77733629CB38919d14232d`): round 1345 at Fri 23 Oct
19:55:31 UTC (211.164), round 1346 at Mon 26 Oct 00:00:49 UTC (211.915).

All seven Coinbase feeds, the last round before and the first after each of the five weekends since launch (27 Sep, 4,
11, 18 and 25 Oct; script `gaps.py`, output `weekend_gaps.json`, scratch): 35 gaps, closures 51.3 to 58.3 hours, every
move within ±1.24%. Largest: TSLA 16 Oct 20:44 UTC 353.30 to 19 Oct 00:00 UTC 357.68 (+1.24%); META +0.85%; GOOGL +0.77%;
AMZN +0.76%; NVDA +0.76%; MSFT +0.68%. Largest fall: AAPL 25 Sep 19:50 UTC 341.51 to 28 Sep 00:00 UTC 340.24 (-0.37%).

## 4. Morpho

Morpho API `markets`, all 8,328 Blue markets, collateral name or symbol matching a stock token (Robinhood Token,
xStock, Ondo Tokenized, Backed): 261 markets (Robinhood Chain 228, Ethereum 27, Base 4, HyperEVM 2), 21 listed;
borrowed 1,747,410 USD in all, 118,750 in listed markets, 1,628,660 in unlisted ones.

Listed on Robinhood Chain: AAPL, GOOGL, META, NVDA, SPCX, TSLA at LLTV 62.5%; GOOGL and SPY at 77%. Listed on Ethereum:
Ondo tokens (SPYon, QQQon, TSLAon at 62.5%, FLHYon at 86%) and wSPYx (xStocks) at 86%.

Largest by borrowing: NVDA / USDG (62.5%), unlisted, `0x8b16891f032a93b771347c9cb470a780e6699dd701553d3402aa3cdba6189c3e`,
623,189 USD borrowed; oracle `0xED29D310cfa91778A5850538DA28ed42234Cb78c` has no `BASE_FEED_1` (not a
MorphoChainlinkOracleV2), `price()` 208709738535927706811000000.

Listed NVDA / USDG (62.5%) `0xf5ff7d546af5e72f3912d2aa723088fd0bf66fddc158714995637714d9db6e4c`, Morpho Blue on Robinhood
Chain `0x9D53d5E3bd5E8d4Cbfa6DB1ca238AEA02E651010`: loan USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`, collateral
NVDA `0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC`, oracle `0x37CF511fA79B8446f1C23D6a81Df117F28240bE0`: BASE_FEED_1
"RHNVDA / USD" (20854808058 = 208.55), QUOTE_FEED_1 "USDG / USD" (1.00); `price()` 208548080580000000000000000 × 10^(18 − 6)
÷ 10^36 = 208.55 USDG per NVDA (NVDA 18 decimals, USDG 6). 51,082 USD borrowed.

Liquidation incentive factor: min(1.15, 1 ÷ (0.3 × LLTV + 0.7)): 62.5% gives 1.1268 (12.68%), 77% gives 1.0741 (7.41%).

## 5. Aave V3

Aave V3 API `markets` for all 24 V3 markets (21 networks, Ethereum's Core, EtherFi, Lido and Horizon): no reserve whose
name matches a tokenized stock. Horizon's 11 reserves are other real-world assets.

## 6. Arithmetic (Python, writer, 30 Oct 2026)

100 NVDAc at 209.29 = 20,928.83 USD. 11,000 USDC of debt. Aave V4 health factor = collateral × collateral factor ÷ debt =
20,928.83 × 0.70 ÷ 11,000 = 1.332. Borrowing limit at 70%: 14,650.18. Liquidation price = 11,000 ÷ (100 × 0.70) = 157.14,
24.9% below 209.29. After a Monday gap of 1.24%: 1.315; 10%: 1.199; 20%: 1.065; 25%: 0.999; 30%: 0.932.

Same loan on Morpho's listed NVDA / USDG (62.5%), 100 NVDA at 208.55: 20,854.81 × 0.625 ÷ 11,000 = 1.185; liquidation
price 176.00, 15.6% below.

## 7. Docs and articles quoted (fetched 30 Oct 2026)

- Aave blog, "Coinbase Tokenized Stocks Now Live on Aave V4" (25 Sep 2026): seven tokens, Equities Hub with one USDC
  reserve and one Spoke; collateral only; non-US eligible persons (Regulation S); Coinbase Onchain SPV Ltd certificates,
  shares held by Alpaca Securities LLC; dividends reinvested through a multiplier; Chainlink 24/5 feeds, Sunday 20:00 ET
  to Friday 20:00 ET; weekend price held; "a position's health factor can fall only through interest accrual during
  that window"; reserve paused during corporate actions such as splits.
- Chainlink docs, Tokenized Equity Feeds and Base Tokenized Equities (Coinbase B20): sessions (regular 09:30 to 16:00,
  pre 04:00 to 09:30, post 16:00 to 20:00, overnight 20:00 to 04:00 ET); "These feeds do not publish updates, including
  heartbeat updates, while markets are closed"; Token Price = Underlying Equity Market Price × Multiplier; guidance to
  integrators.
- Robinhood docs, Stock Tokens: debt securities issued by Robinhood Assets (Jersey) Limited; no rights in the underlying;
  not for US persons; restricted in Canada, the UK and Switzerland; multiplier via `uiMultiplier()`; market makers mint
  and burn Monday 02:00 to Saturday 02:00 CET. Oracles & Price Feeds: Chainlink, price includes the multiplier, 24/5,
  `oraclePaused()` during corporate actions.
- CryptoSlate (27 Sep 2026): LlamaRisk recommended the parameters; collateral factor is also the liquidation threshold;
  sale depth on Base 0.27M to 1.08M USD per token for 2% price impact (17 Sep data); shortfall falls on the hub's USDC
  suppliers.
- Crypto Briefing (22 Oct 2026): Morpho stock-token lending live on Robinhood Chain on 22 Oct 2026; NVDA and SPCX at 62.5%,
  SPY at 77%; non-US persons only.

## 8. Not verified

- Liquidations during a freeze on Aave V4: not tested. ISpoke.sol (aave-v4 main) has `CannotReceiveShares`, "Thrown when the
  liquidator tries to receive shares for a collateral reserve that is frozen", which implies liquidation of frozen
  collateral is allowed (as on V3) as long as the liquidator takes the tokens, not shares.
- The unlisted Morpho NVDA oracle's design.
