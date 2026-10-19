# Data snapshot: crypto-backed-loans

Fact-check log for `content/blog/crypto-backed-loans.mdx` (English, "Crypto-backed loans: how they work and why people
use them") and `content/blog/cs/pujcky-zajistene-kryptomenami.mdx` (Czech), both published 2026-10-19. Everything below
was read or fetched on 2026-10-19 (UTC). Working notes, the read scripts and raw page copies were kept outside the
repository and are not committed.

`<ScopeNote />` keeps its shared "Figures as of 14 Oct 2026" date (`FIGURES_AS_OF` in `components/blog/ScopeNote.tsx`,
which may only move when every post's figures are re-read), so this post dates every figure in its own text: "on 19
October 2026" with the block number.

## 1. How the on-chain figures were read

- Tool: viem 2.39.0 from `packages/nextjs/node_modules`, read-only `eth_call`s pinned to one block per chain
  (`blockNumber` passed on every call), Multicall3 batching.
- RPCs: `https://ethereum-rpc.publicnode.com`, `https://arbitrum-one-rpc.publicnode.com` (the same keyless endpoints
  `utils/rpc.ts` uses).
- Market addresses: `config/aaveConfig.ts` (from the Aave Address Book, checked there on 16 Oct 2026); each Pool and
  PoolDataProvider answered on 19 Oct 2026.

## 2. Aave V3 reserve parameters and rates

Calls on each market's PoolDataProvider: `getReserveConfigurationData(asset)` (LTV, liquidation threshold, bonus,
borrowing enabled, frozen), `getPaused(asset)`, `getReserveCaps(asset)`, `getReserveData(asset)` (field 7,
`variableBorrowRate`, ray). Pool `POOL_REVISION()` = 11 on both markets (Aave V3.7).

- Ethereum Core: PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD`, Pool
  `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`, block **26225342** (2026-10-19 08:11:11 UTC)
- Arbitrum: PoolDataProvider `0x243Aa95cAC2a25651eda86e80bEe66114413c43b`, Pool
  `0x794a61358D6845594F94dc1DB02A252b5b4814aD`, block **516228495** (2026-10-19 08:11:26 UTC)

| Market        | Asset | Address                                      | LTV  | LT   | Bonus | Frozen | Paused | variableBorrowRate (ray)   | APR     | APY (printed) |
| ------------- | ----- | -------------------------------------------- | ---- | ---- | ----- | ------ | ------ | -------------------------- | ------- | ------------- |
| Ethereum Core | WETH  | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 8050 | 8300 | 10500 | false  | false  | 19486844758903148115980446 | 1.9487% | not printed   |
| Ethereum Core | WBTC  | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 7300 | 7800 | 10500 | false  | false  | 3137390424064929427026071  | 0.3137% | not printed   |
| Ethereum Core | cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 7300 | 7800 | 10750 | false  | false  | 2912929483058271100358723  | 0.2913% | not printed   |
| Ethereum Core | USDC  | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 7500 | 7800 | 10450 | false  | false  | 44790263147464772672042951 | 4.4790% | 4.58%         |
| Ethereum Core | USDT  | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 7500 | 7800 | 10450 | false  | false  | 40887876664658968860661660 | 4.0888% | 4.17%         |
| Ethereum Core | GHO   | `0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f` | 0    | 0    | 0     | false  | false  | 45000000000000000000000000 | 4.5000% | 4.60%         |
| Ethereum Core | EURC  | `0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c` | 0    | 7800 | 10500 | false  | false  | 40367180008238855541151089 | 4.0367% | 4.12%         |
| Arbitrum      | WETH  | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` | 8000 | 8400 | 10500 | false  | false  | 19572555190918080659527825 | 1.9573% | not printed   |
| Arbitrum      | WBTC  | `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f` | 7300 | 7800 | 10700 | false  | false  | 7328019700073606470795973  | 0.7328% | not printed   |
| Arbitrum      | USDC  | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | 7500 | 7800 | 10500 | false  | false  | 33936606739114031683805556 | 3.3937% | 3.45%         |
| Arbitrum      | USD₮0 | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | 7500 | 7800 | 10500 | false  | false  | 41240258679272756560012047 | 4.1240% | 4.21%         |
| Arbitrum      | GHO   | `0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33` | 0    | 0    | 0     | false  | false  | 44872977534749408713558047 | 4.4873% | 4.59%         |

APY = (1 + APR ÷ 31,536,000)^31,536,000 − 1, the per-second compounding the Aave app shows. Arbitrum lists no cbBTC
and no euro stablecoin open for borrowing (EURS `0xD22a58f79e9481D1a88e00c343885A588b34b68B` is frozen; bridged USDC.e
`0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8` is frozen and not used in the post). The full euro check is in
`snapshots/short-fiat-with-aave.md`.

## 3. Oracle price

`PoolAddressesProvider(0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e).getPriceOracle()` = AaveOracle
`0x54586bE62E3c3580375aE3723C145253060Ca0C2`; `getAssetPrice(WBTC)` = 8268033164834 (8 decimals) = **$82,680.33** at
Ethereum block **26225364** (2026-10-19 08:15:35 UTC); source `0xDaa4B74C6bAc4e25188e64ebc68DB5050b690cAc`
("wBTC/BTC/USD"). The post uses an illustrative $80,000 and prints the oracle value next to it.

## 4. Worked arithmetic (Python, 2026-10-19)

alice: 1 WBTC at an illustrative $80,000, LT 78%, LTV 73%, bonus 5%, 24,000 USDC borrowed.

- Borrow limit 80,000 × 0.73 = $58,400. HF = 80,000 × 0.78 ÷ 24,000 = **2.60**. Liquidation price 24,000 ÷ 0.78 =
  **$30,769.23** (−61.54%).
- One year at the USDC APY 4.5808%: debt 24,000 × 1.045808 = **25,099.40** USDC; liquidation price 25,099.40 ÷ 0.78 =
  **$32,178.72**.
- Liquidation at $30,000 shortly after borrowing: HF 0.975 (> 0.95, collateral $30,000 and debt $24,000 both ≥ $2,000,
  so up to 50%): 12,000 USDC repaid, 12,000 × 1.05 ÷ 30,000 = **0.42 WBTC** seized; 0.58 WBTC ($17,400, ≥ $1,000 dust
  floor) left against 12,000 USDC; HF 17,400 × 0.78 ÷ 12,000 = **1.131**; bonus lost 600 USD.
- Leverage: 24,000 USDC buys 0.3 WBTC at $80,000; 1.3 WBTC against 24,000 USDC: HF 1.3 × 80,000 × 0.78 ÷ 24,000 = **3.38**,
  liquidation price 24,000 ÷ (1.3 × 0.78) = **$23,668.64**.
- Drawdown check: $69,000 → $17,000 is −75.4%. A 20% loan has its liquidation price at 69,000 × 0.20 ÷ 0.78 = $17,692.31,
  above $17,000, so "even a loan of 20% ... taken at the 2021 peak would have been liquidated by mid-June 2022" (interest
  ignored, which only makes it worse).

## 5. Protocol behaviour (documents and code)

| Statement                                                                                                                                                                                                                            | Source (fetched 2026-10-19)                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interest accrues immediately; rates set by utilisation and governance parameters; steps of borrowing                                                                                                                                 | https://aave.com/help/borrowing/borrow-tokens                                                                                                                                                                                                                                                                                                                     |
| Repay fully or partially; full repayment releases collateral                                                                                                                                                                         | https://aave.com/help/borrowing/repay-tokens                                                                                                                                                                                                                                                                                                                      |
| 50% / 100% liquidation rule with the $2,000 thresholds; competitive bot liquidations                                                                                                                                                 | https://aave.com/help/borrowing/liquidations                                                                                                                                                                                                                                                                                                                      |
| `borrow(asset, amount, interestRateMode, referralCode, onBehalfOf)`: no term; `interestRateMode` "Should always be passed a value of 2 (variable rate mode)"; stable-rate fields "DEPRECATED on v3.2.0"; repay in the borrowed asset | https://aave.com/docs/aave-v3/smart-contracts/pool (`.md` copy)                                                                                                                                                                                                                                                                                                   |
| Repay with collateral and debt swap available on Ethereum Core and Arbitrum in the Aave Labs interface                                                                                                                               | https://aave.com/docs/aave-v3/smart-contracts/swap-features (`.md` copy, availability table)                                                                                                                                                                                                                                                                      |
| Withdrawing collateral while borrowing needs HF ≥ 1 afterwards                                                                                                                                                                       | aave-v3-origin `SupplyLogic.executeWithdraw` → `ValidationLogic.validateHFAndLtvzero` → `validateHealthFactor`                                                                                                                                                                                                                                                    |
| A paused reserve rejects supply, withdraw, borrow and repay; frozen rejects supply and borrow only                                                                                                                                   | aave-v3-origin `ValidationLogic.sol` (`validateSupply`, `validateWithdraw`, `validateBorrow`, `validateRepay`)                                                                                                                                                                                                                                                    |
| Pausing is `onlyEmergencyOrPoolAdmin`                                                                                                                                                                                                | aave-v3-origin `PoolConfigurator.sol` (`setReservePause`, `setPoolPause`)                                                                                                                                                                                                                                                                                         |
| Leftover debt after all collateral is gone becomes a deficit (v3.3+)                                                                                                                                                                 | existing post `how-aave-liquidation-works` (#can-a-liquidation-leave-bad-debt), linked rather than repeated                                                                                                                                                                                                                                                       |
| Aave's own interfaces send no health factor alerts                                                                                                                                                                                   | existing post `aave-health-factor-alert-setup` (#does-aave-send-health-factor-alerts), linked rather than repeated. Checked on 19 Oct 2026 that the "Aave App" launch ARFC (https://governance.aave.com/t/arfc-aave-app-launch/25307) describes Stable Vaults, Balance Protection, App Accounts and Aave Push (a fiat on-ramp), none of them health factor alerts |
| USDC rate jump to 13.67% APR on 14 Oct 2026                                                                                                                                                                                          | existing post `why-aave-health-factor-dropped` and its snapshot (blocks 26194053 and 26194231)                                                                                                                                                                                                                                                                    |

## 6. Centralised lenders, depegs and drawdowns

| Statement in the post                                                                                                           | Source, page date                                                                                                                                                                                    | Checked against                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Celsius froze withdrawals 12 June 2022, filed 13 July 2022, about $20 billion deposited                                         | CFTC press release 8749-23, 13 July 2023: https://www.cftc.gov/PressRoom/PressReleases/8749-23                                                                                                       | page text: "customers deposited approximately $20 billion", "on June 12, 2022, Celsius froze customer withdrawals. On July 13, 2022, Celsius filed for bankruptcy"                                          |
| (same dates, second source, not cited in the post)                                                                              | Louisiana Office of Financial Institutions, 13 July 2022: https://ofi.la.gov/celsius-network-files-chapter-11-bankruptcy/                                                                            | page text                                                                                                                                                                                                   |
| January 2023 ruling: Earn assets became Celsius's property; account holders unsecured creditors                                 | US Bankruptcy Court SDNY, memorandum opinion "Dated: January 4, 2023": https://www.nysb.uscourts.gov/sites/default/files/opinions/312902_1822_opinion.pdf                                            | PDF text ("the cryptocurrency assets became Celsius's property"; "the Account Holders are unsecured creditors"). The opinion speaks of a "July 15, 2022 petition date"; the post uses 13 July from the CFTC |
| Voyager suspended trading, deposits and withdrawals 1 July 2022 after the 3AC default on 15,250 BTC and $350M USDC              | Voyager release via CNW, 1 July 2022: https://www.newswire.ca/news-releases/voyager-digital-provides-market-update-851734302.html                                                                    | page text                                                                                                                                                                                                   |
| Voyager Chapter 11 on 5 July 2022 (SDNY)                                                                                        | Voyager release via CNW, dateline 5 July 2022: https://www.newswire.ca/news-releases/voyager-digital-commences-financial-restructuring-process-to-maximize-value-for-all-stakeholders-888320107.html | page text                                                                                                                                                                                                   |
| Genesis stopped Gemini Earn withdrawals in November 2022, about $900 million, 340,000 investors                                 | SEC press release 2023-7, 12 January 2023: https://www.sec.gov/news/press-release/2023-7                                                                                                             | page text (WebFetch; sec.gov refuses plain curl)                                                                                                                                                            |
| Genesis Chapter 11 on 19 January 2023                                                                                           | SEC press release 2024-37, 19 March 2024: https://www.sec.gov/newsroom/press-releases/2024-37                                                                                                        | page text (WebFetch)                                                                                                                                                                                        |
| BlockFi Chapter 11 on 28 November 2022, days after suspending withdrawals as FTX collapsed                                      | CoinDesk, 28 November 2022: https://www.coindesk.com/policy/2022/11/28/ftx-fallout-continues-as-crypto-lender-blockfi-declares-bankruptcy                                                            | page text ("filed for bankruptcy protection Monday, days after suspending withdrawals")                                                                                                                     |
| Bitcoin about $69,000 (Nov 2021) to about $17,000 (mid-June 2022), below $16,000 after FTX                                      | The ECB Blog, 30 November 2022: https://www.ecb.europa.eu/press/blog/date/2022/html/ecb.blog221130~5301eecd19.en.html                                                                                | page text                                                                                                                                                                                                   |
| USDC low around $0.88 at ~08:00 UTC on 11 March 2023; back above $0.99 by ~00:00 UTC on 13 March; Circle confirmed $3.3B at SVB | Gauntlet on the Aave forum, 17 March 2023: https://governance.aave.com/t/aave-resilient-through-usdc-volatility/12330 (`.json` read)                                                                 | timeline lines in the post body                                                                                                                                                                             |
| $3.3 billion of USDC reserves at Silicon Valley Bank                                                                            | Circle press release, dateline 12 March 2023: https://www.circle.com/pressroom/3-3-billion-of-usdc-reserve-risk-removed-dollar-de-peg-closes                                                         | page text                                                                                                                                                                                                   |
| UST depegged in May 2022, fell close to zero, $40 billion of market value                                                       | SEC press release 2024-73, 13 June 2024: https://www.sec.gov/newsroom/press-releases/2024-73                                                                                                         | page text (WebFetch)                                                                                                                                                                                        |
| WBTC is backed by bitcoin held in custody                                                                                       | https://wbtc.network/ ("Every WBTC is backed 1:1 by Bitcoin in secure custody")                                                                                                                      | page text (WebFetch)                                                                                                                                                                                        |
| March 2026 CAPO incident: ~2.85% lower effective wstETH rate on Core and Prime, ~10,938 wstETH liquidated across 34 accounts    | Chaos Labs on the Aave forum, 10 March 2026: https://governance.aave.com/t/24269 (`.json` read)                                                                                                      | post body text                                                                                                                                                                                              |

Names of company executives appear on several of these pages; the post names companies only.

## 7. Tax

The post says only that taking the loan does not sell the collateral, that tax treatment depends on the country and
sometimes on the protocol's terms, and gives one official example. Source: HMRC Cryptoassets Manual, CRYPTO61640
(published 30 March 2021, updated 28 November 2025):
https://www.gov.uk/hmrc-internal-manuals/cryptoassets-manual/crypto61640. Checked text: "It will be necessary to
consider the terms and conditions of the DeFi lending platform to understand whether the giving of collateral is a
disposal"; where it is not, "the dealings of the DeFi lending platform with the collateral/security are, for CG
purposes, dealings of the borrower". HMRC's July 2026 draft "no gain, no loss" measure (planned from 6 April 2027, not
enacted as of 19 Oct 2026) was read but is not mentioned, to keep the post to the general point. No official Czech page
on crypto loans, lending, collateral or liquidation was found (Finanční správa and Ministry of Finance pages cover only
the 2025 sale exemptions), so the Czech post gives the same UK example and no Czech rule.

## 8. Tokenping facts used

| Fact                                                             | Reference                                                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Checks every 5 minutes; messages while HF is below the threshold | `constants/notifications.ts` (`NOTIFICATION_CHECK_INTERVAL_MINUTES`), `services/notifications/runNotificationCheck.ts`; same wording as `aave-health-factor-alert-setup` |
| No channel list and no price in this post                        | channels and price are left to the linked setup guide                                                                                                                    |

## 9. Not verified, so left out

- Exact all-time high and low dates and prices for ETH, and bitcoin's final 2022 low: only the ECB blog figures are used.
- A date for BlockFi's withdrawal pause from a page that could be read (The Block returns HTTP 403 to scripts); the post
  says "days after" from CoinDesk.
- cbBTC's custody arrangements: Coinbase's own pages answered HTTP 403, so the post describes WBTC's backing only and
  says nothing specific about cbBTC's (its on-chain `name()` is "Coinbase Wrapped BTC").
