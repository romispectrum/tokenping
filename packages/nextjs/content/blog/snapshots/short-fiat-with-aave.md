# Data snapshot: short-fiat-with-aave

Fact-check log for `content/blog/short-fiat-with-aave.mdx` (English, "Shorting fiat with an Aave loan: how it works and
the risks") and `content/blog/cs/short-fiatu-pujckou-na-aave.mdx` (Czech), both published 2026-10-19. Everything below
was read or fetched on 2026-10-19 (UTC). Working notes, the read scripts and raw page copies were kept outside the
repository and are not committed.

`<ScopeNote />` keeps its shared "Figures as of 14 Oct 2026" date, so the post dates every figure in its own text ("on
19 October 2026" with the block number). Parameters, rates and the oracle reads it shares with `crypto-backed-loans`
(Ethereum Core block 26225342, Arbitrum block 516228495, oracle block 26225364) are listed in
`snapshots/crypto-backed-loans.md` sections 1 to 3 and are not repeated here.

## 1. People cited, and what supports each statement

The owner asked for Juraj Bednár and Pavol Lupták (Wilder) to be referenced. Only what is on the pages below is
attributed to them; each gets one short quotation.

| Statement in the post                                                                                                                                                                                                                                                                                                                            | Supports a statement about | Source                                                                                                                                                                           | Checked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| He wrote in March 2023 that his book and course explain borrowing fiat against bitcoin, "one of the best uses"; borrowing fiat value is shorting it; use it while it has value, repay after inflation; quote "Nenadávajme, shortujme cez pôžičku."                                                                                               | Juraj Bednár               | Blog post in Slovak, https://juraj.bednar.io/blog/2023/03/22/preco-som-napisal-knizku-kryptomeny-a-urobil-kurz-kryptomeny-pre-podnikatelov-ved-existuje-len-bitcoin-a-shitcoiny/ | Full HTML read; `article:published_time` 2023-03-22T08:00:00+01:00. Key fragments: "ako si požičiavať fiat s Bitcoin zábezpekou"; "požičať (teda shortnúť) fiatovú hodnotu"; "na správnej strane inflácie"; "Nenadávajme, shortujme cez pôžičku."                                                                                                                                                                                                                                                    |
| His Slovak minicourse covers loans on Aave and other platforms and the risks of liquidation, wrapped bitcoin, counterparties and interest                                                                                                                                                                                                        | Juraj Bednár               | Product page, https://juraj.bednar.io/product/ako-vyuzit-hodnotu-bitcoinu-bez-toho-aby-sme-ho-museli-predat-minikurz-miniebook/                                                  | Full HTML read; no date on the page. It lists loans on Aave, Spark, Morpho, Hyperliquid and Firefish, and the risks "likvidáciu, riziko zabaleného Bitcoinu, protistrany a úrokov"                                                                                                                                                                                                                                                                                                                   |
| His English book, published March 2024, presents the method in its subtitle as a way to short fiat currencies                                                                                                                                                                                                                                    | Juraj Bednár               | Goodreads, https://www.goodreads.com/book/show/209619869-how-to-harness-the-value-of-bitcoin-without-having-to-sell-it                                                           | Page title "How to harness the value of Bitcoin without having to sell it: A path to your orange citadel and a way to short fiat currencies"; "Paperback Published March 7, 2024"                                                                                                                                                                                                                                                                                                                    |
| He published a guide in June 2026, updated October 2026, on living off a loan against bitcoin through Aave, Morpho or Firefish; quote "Don't sell your Bitcoin. Borrow stablecoins against it"; suggests euro debt for euro spenders; low LTV; lists liquidation, smart contract and stablecoin risks; frames it as borrowing instead of selling | Pavol Lupták               | Liberation Travel, https://liberation.travel/live-off-crypto-loan-legally-pay-no-tax-2026/                                                                                       | Full HTML read. Authorship: schema.org author "Pavol Luptak" in the page's JSON-LD (WordPress post 9060, author id 3); the author also refers to his own repository under `github.com/wilderko`. `article:published_time` 2026-06-26T18:15:40Z, `article:modified_time` 2026-10-15T00:07:25Z. TL;DR opens "Don't sell your Bitcoin. Borrow stablecoins against it"; it recommends EURC debt for people living in the eurozone and lists liquidation, smart-contract, volatility and stablecoin risks |

Searched and not found: any page in which Pavol Lupták himself uses the phrase "short fiat" (English, Slovak or Czech
searches; his BTC Prague pages, podcast listings and the Liberation Travel search API). The post therefore attributes
the "shorting fiat" framing to Bednár only and describes Lupták's guide as making the case for borrowing instead of
selling. The guide's tax claims are not repeated. Pages read but not used: btcprague.com talk pages for Pavol Lupták (no
loan content). No other person is named in the post; the example person is alice.

## 2. Euro and koruna stablecoins on Aave

Method: for every market, every reserve's `symbol()` and `name()` were read and searched case-insensitively for "eur",
"czk", "korun" and "czech"; matches were then checked for borrowing enabled, frozen, paused and borrow cap (V3) or the
reserve flags (V4).

### Aave V3: 26 markets on 23 networks

The 24 markets in `config/aaveConfig.ts` (viem 2.39.0, keyless RPCs from `utils/rpc.ts`, one block per chain, read
2026-10-19 between 08:11:11 and 08:12:39 UTC; Ethereum Core block 26225342, Polygon 95794758, Arbitrum 516228495,
Optimism 158399356, Base 52804074, Avalanche 97951412, Gnosis 48834181, Metis 23292132, BNB Chain 128520057, Scroll
35427206, ZKsync 72556443, Linea 32364315, Sonic 81287711, Celo 80496772, Soneium 29631392, Plasma 35456159, Ink
58899132, MegaETH 29600536, Mantle 102133619, X Layer 73628519, Monad 114704448; Ethereum Prime, EtherFi and Horizon at
26225342), plus the two Aave Address Book markets Tokenping does not list, read for symbols only: Fantom (chain 250,
block 123738108, 08:30:42 UTC, 10 reserves) and Harmony (chain 1666600000, latest block 93624315, whose timestamp is
2026-09-10, 8 reserves). The address book's `src` folder (GitHub API, 2026-10-19) lists these 26 mainnet V3 markets
(`AaveV3InkWhitelabel` is the same Pool as Ink).

| Market        | Reserve                          | Address                                      | Borrowing enabled | Frozen | Paused | Borrow cap | Debt at read | variableBorrowRate (ray)   | APY (printed) |
| ------------- | -------------------------------- | -------------------------------------------- | ----------------- | ------ | ------ | ---------- | ------------ | -------------------------- | ------------- |
| Ethereum Core | EURC                             | `0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c` | true              | false  | false  | 41,400,000 | 25,787,326   | 40367180008238855541151089 | 4.12%         |
| Base          | EURC                             | `0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42` | true              | false  | false  | 12,000,000 | 4,593,630    | 39968223844227568104976840 | 4.08%         |
| Avalanche     | EURC                             | `0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD` | true              | false  | false  | 5,400,000  | 720,908      | 35958388543307435964359888 | 3.66%         |
| Gnosis        | EURe ("Monerium EUR emoney")     | `0xcB444e90D8198415266c6a2724b7900fb12FC56E` | true              | false  | false  | 22,500,000 | 10,301,853   | 38757946257648729055503338 | 3.95%         |
| Celo          | EURm ("Mento Euro")              | `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73` | true              | false  | false  | 90,000     | 9,710        | 93938957798878304241986255 | 9.85%         |
| Arbitrum      | EURS                             | `0xD22a58f79e9481D1a88e00c343885A588b34b68B` | true              | true   | false  | 1          | 5,230        | not printed                | frozen        |
| Polygon       | EURS                             | `0xE111178A87A3BFf0c8d18DECBa5798827539Ae99` | false             | true   | false  | 1          | 160,155      | not printed                | frozen        |
| Polygon       | jEUR                             | `0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c` | true              | true   | false  | 1          | 2,720        | not printed                | frozen        |
| Polygon       | EURA ("EURA (previously agEUR)") | `0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4` | false             | true   | false  | 1          | 1,651        | not printed                | frozen        |

No reserve on any of the 26 markets had "czk", "korun" or "czech" in its symbol or name. Fantom's and Harmony's
reserves are listed in full in the raw read and include no euro or koruna token.

### Aave V4: 20 Spokes on Ethereum, Avalanche, Arc and Base

The list: Aave's V4 API (`POST https://api.v4.aave.com/graphql`, query `spokes(request: {query: {chainIds: [1, 43114,
10, 5042, 8453]}})`, 2026-10-19 08:31:50 UTC) returned 20 Spokes, the same 20 as `AAVE_V4_SPOKES` in
`config/aaveConfig.ts`; its `chains` query also lists OP Mainnet, which had no Spoke. Calls on each Spoke:
`getReserveCount()`, `getReserve(id)` (underlying, hub, assetId, flags, dynamicConfigKey, collateralRisk),
`getDynamicReserveConfig(id, key)`; on each Hub `getAssetDrawnRate(assetId)` (ray, annual, accrued linearly between
index updates per `AssetLogic.sol`). Flag bits from `ReserveFlagsMap.sol`: 0x01 paused, 0x02 frozen, 0x04 borrowable.
Reads 2026-10-19 between 08:13:47 and 08:14:41 UTC.

| Spoke             | Address                                      | Block (UTC)         | EURC reserve, flags | Hub, assetId                                     | Drawn rate (ray)           | Printed |
| ----------------- | -------------------------------------------- | ------------------- | ------------------- | ------------------------------------------------ | -------------------------- | ------- |
| Ethereum Main     | `0x94e7A5dCbE816e498b89aB752661904E2F56c485` | 26225355 (08:13:47) | 9, 12               | `0xCca852Bc40e560adC3b1Cc58CA5b55638ce826c9`, 10 | 38973781596297327107131414 | 3.90%   |
| Ethereum Bluechip | `0x973a023A77420ba610f06b3858aD991Df6d85A08` | 26225356 (08:13:59) | 9, 12               | same Hub, 10                                     | 38973781805682652916737572 | 3.90%   |
| Ethereum Forex    | `0xD8B93635b8C6d0fF98CbE90b5988E3F2d1Cd9da1` | 26225356 (08:13:59) | 0, 12               | same Hub, 10                                     | 38973781805682652916737572 | 3.90%   |
| Ethereum Gold     | `0x65407b940966954b23dfA3caA5C0702bB42984DC` | 26225356 (08:13:59) | 5, 12               | same Hub, 10                                     | 38973781805682652916737572 | 3.90%   |
| Avalanche Main    | `0x435272CefF93a1E657E8ABfdf0A13e95900A3a56` | 97951592 (08:14:26) | 5, 12               | `0xd07369fAE4A5BB13c9Ce446B052c7867B1AbDf6e`, 5  | 14183382624801288808201387 | 1.42%   |
| Avalanche Forex   | `0x6a37776B5E026dBdF043b4F933c323C84DD1B514` | 97951597 (08:14:31) | 0, 12               | same Hub, 5                                      | 14183382650720037964908034 | 1.42%   |
| Arc Main          | `0xB843bdC3a87A05E77E07Df9FE48928b3A34b134d` | 26743212 (08:14:35) | 1, 12               | `0x17288dfc86205301064577b98B02b81017e6F79C`, 1  | 7460715165118965760754644  | 0.75%   |
| Arc Forex         | `0x4164EBCAF74670aa74C8D4F59de6157c0780F1bB` | 26743216 (08:14:37) | 1, 12               | same Hub, 1                                      | 7460715168227700934620544  | 0.75%   |

Flags 12 = borrowable and receive-shares enabled, not paused, not frozen. In each of these Spokes, every reserve with a
collateral factor above zero had `collateralRisk` 0, so the User Risk Premium (Aave V4 overview, "Risk Premium") added
nothing at the time. No V4 reserve's symbol or name contained "czk", "korun" or "czech"; EURC is the only euro asset.

## 3. Oracle values used

AaveOracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2`, Ethereum block **26225364** (2026-10-19 08:15:35 UTC):
WBTC 8268033164834 = **$82,680.33**; EURC 111990517 = **$1.1199** (source `0xa6aB031A4d189B24628EC9Eb155F0a0f1A0E55a3`,
"Capped EURC/USD"); USDC 99988399 ($0.99988, not printed).

## 4. Worked arithmetic (Python, 2026-10-19)

alice: 1 WBTC, illustrative $80,000, LT 78%, LTV 73%, bonus 5%, 24,000 USDC borrowed, USDC APY 4.5808% (APR 4.4790%
from the ray above) held constant for the example.

- HF 2.60; liquidation price $30,769.23 (−61.54%); borrow limit $58,400. Debt after a year 25,099.40 USDC; interest
  1,099.40; liquidation price after a year $32,178.72.
- After a year: $120,000 → debt 0.20916 BTC, HF 3.729, 0.79084 BTC left (+0.09084 vs 0.7); $88,888.89 (the dollar loses
  10% against bitcoin, 80,000 ÷ 0.9) → 0.28237 BTC, HF 2.762, 0.71763 (+0.01763); $80,000 → 0.31374 BTC, HF 2.486,
  0.68626 (−0.01374); $48,000 → 0.52290 BTC, HF 1.492, 0.47710 (−0.22290). Break-even price 25,099.40 ÷ 0.3 =
  $83,664.68 (+4.58%).
- Liquidation at $30,000 before interest: HF 0.975; up to 50% (HF > 0.95, both legs ≥ $2,000); 12,000 repaid; 0.42 WBTC
  seized; 0.58 WBTC ($17,400) against 12,000; HF 1.131; netted 0.58 − 0.40 = 0.18 BTC vs 0.20 without liquidation; bonus
  0.02 BTC = $600.
- Sizing table, share s of collateral value borrowed: HF = 0.78 ÷ s; fall to liquidation = 1 − s ÷ 0.78; price =
  80,000 × s ÷ 0.78: 20% → 3.90, 74.4%, $20,512.82; 30% → 2.60, 61.5%, $30,769.23; 40% → 1.95, 48.7%, $41,025.64; 50% →
  1.56, 35.9%, $51,282.05; 60% → 1.30, 23.1%, $61,538.46; 73% → 1.068, 6.4%, $74,871.79.
- 2021 to 2022 check: a 20% loan at $69,000 has its liquidation price at $17,692.31, above the ECB's "USD 17,000 by
  mid-June 2022".
- Alert example: HF at $50,000 = 50,000 × 0.78 ÷ 24,000 = 1.625, printed 1.63.
- Euro example: 20,000 EURC × 1.11990517 = $22,398.10; with the euro 10% stronger, $24,637.91; HF factor 1 ÷ 1.1 =
  0.909, "about 9%" lower.

## 5. Inflation figures and targets

| Statement                                             | Source, page date                                                                                                                                                      | Checked text                                                                                                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ECB targets 2% over the medium term                   | https://www.ecb.europa.eu/mopo/strategy/html/index.en.html (no date)                                                                                                   | "aiming for 2% inflation over the medium term"                                                                                             |
| CNB targets 2%                                        | https://www.cnb.cz/en/monetary-policy/inflation-target/ and https://www.cnb.cz/cs/menova-politika/inflacni-cil/ (no date)                                              | "the CNB's inflation target has been 2% year-on-year growth in the consumer price index"; "ve výši 2 %"                                    |
| Inflation reduces the value of a currency over time   | https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html and the `.cs.html` version (no date)                                      | "inflation reduces the value of the currency over time"; "inflace v průběhu času snižuje hodnotu měny"                                     |
| Euro area peak 10.6% in October 2022                  | ECB Economic Bulletin 5/2024 box: https://www.ecb.europa.eu/press/economic-bulletin/focus/2024/html/ecb.ebbox202405_05~6924b2283a.en.html                              | "When headline inflation peaked at 10.6% in October 2022"                                                                                  |
| Euro area 3.8% in September 2026                      | Eurostat, 16 October 2026: https://ec.europa.eu/eurostat/web/products-euro-indicators/w/2-16102026-ap                                                                  | "The euro area annual inflation rate was 3.8 % in September 2026"                                                                          |
| US 9.1% in the 12 months to June 2022                 | BLS The Economics Daily, 18 July 2022: https://www.bls.gov/opub/ted/2022/consumer-prices-up-9-1-percent-over-the-year-ended-june-2022-largest-increase-in-40-years.htm | "increased 9.1 percent" (WebFetch; bls.gov refuses plain curl). The post says "reached", not "peaked", because BLS does not call it a peak |
| US 3.7% in September 2026                             | BLS CPI summary, 14 October 2026: https://www.bls.gov/news.release/cpi.nr0.htm                                                                                         | "Over the last 12 months, the all items index increased 3.7 percent before seasonal adjustment" (WebFetch)                                 |
| Czech Republic 18.0% in September 2022                | Czech Statistical Office, 11 October 2022: https://csu.gov.cz/rychle-informace/indexy-spotrebitelskych-cen-inflace-zari-2022                                           | "Meziročně vzrostly spotřebitelské ceny v září o 18,0 %"                                                                                   |
| Czech Republic 2.5% in September 2026                 | Czech Statistical Office, 13 October 2026: https://csu.gov.cz/rychle-informace/indexy-spotrebitelskych-cen-inflace-zari-2026                                           | "Meziročně vzrostly spotřebitelské ceny v září o 2,5 %" (CPI; Eurostat's HICP for Czechia, 2.2%, is not used)                              |
| Bitcoin about $69,000 to about $17,000, below $16,000 | The ECB Blog, 30 November 2022 (see `snapshots/crypto-backed-loans.md` section 6)                                                                                      | page text                                                                                                                                  |

"At those numbers the debt grows a little faster than prices": 4.58% (USDC APY) against 3.7% (US CPI) and 4.12% (EURC
APY) against 3.8% (euro area HICP), both as of the dates above. It is a comparison of published numbers, not a forecast.

## 6. Protocol behaviour

Interest accrues from the moment of borrowing (https://aave.com/help/borrowing/borrow-tokens); the 50% / 100% rule and
competing liquidation bots (https://aave.com/help/borrowing/liquidations); repay with collateral and debt swap
(https://aave.com/docs/aave-v3/smart-contracts/swap-features, availability table: Ethereum Core and Arbitrum among
others); V4 base rate plus risk premium (https://github.com/aave/aave-v4/blob/main/docs/overview.md, "Risk Premium");
frozen reserves reject supply and borrow but not repay (aave-v3-origin `ValidationLogic.sol`). All fetched 2026-10-19.
The USDC rate jump to 13.67% APR on 14 Oct 2026 comes from `snapshots/why-aave-health-factor-dropped.md`.

## 7. Tokenping facts used

Checks every 5 minutes and messages while the health factor is below the threshold (`constants/notifications.ts`,
`services/notifications/runNotificationCheck.ts`); the price is rendered by `<AlertPrice />`, never written out; no
channel list in this post.

## 8. Not verified, so left out

- A page where Pavol Lupták uses the term "short fiat" (see section 1).
- Any official Czech guidance on taxing crypto loans: none found, and the post does not discuss tax beyond the link to
  `crypto-backed-loans`.
- Any CZK stablecoin elsewhere than on Aave: out of scope; the post only says none is listed on the Aave markets read.
- Aave V4 rates including a risk premium for a real position: the post prints only the base rate and notes the premium
  was zero for every collateral asset at the time.
