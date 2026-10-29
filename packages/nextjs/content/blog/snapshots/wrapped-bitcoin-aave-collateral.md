# Data snapshot: wrapped-bitcoin-aave-collateral

Figures behind `content/blog/wrapped-bitcoin-aave-collateral.mdx` and its Czech and Spanish translations. On-chain
reads with `cast` (Foundry 1.1.0) against https://ethereum-rpc.publicnode.com and https://base-rpc.publicnode.com on
29 Oct 2026; Morpho figures from https://api.morpho.org/graphql the same day. Re-read before changing a number.

## 1. Aave V3 Ethereum Core reserves, block 26296985 (2026-10-29 07:45:11 UTC)

PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD`: `getReserveConfigurationData`, `getReserveCaps`,
`getReserveData`.

| Reserve | Address | LTV | LT | Bonus | Collateral | Borrowable | Supply cap | Supplied | Borrow cap | Borrowed | Frozen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WBTC | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 81% | 85% | 5.00% | yes | yes | 38,200 | 34,138.21 | 1,500 | 721.66 | no |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 81% | 85% | 7.50% | yes | yes | 20,000 | 17,303.85 | 500 | 174.30 | no |
| tBTC | `0x18084fbA666a33d37592fA2633fD49a74DD93a88` | 73% | 78% | 7.50% | yes | yes (cap 1) | 1,800 | 1,779.39 | 1 | 2.57 | no |
| LBTC | `0x8236a87084f8B84306f72007F36F2618A5634494` | 70% | 75% | 8.50% | yes | no | 2,690 | 2,689.93 | 1 | 0.017 | no |
| eBTC | `0x657e8C867D8B37dCC18fA4Caead9C45EB088C642` | 67% | 72% | 10.00% | yes | no | 134 | 75.02 | 1 | 0 | no |
| BTC.b | `0xB0F70C0bD6FD87dbEb7C10dC692a2a6106817072` | 73% | 78% | 7.50% | yes | no | 225 | 15.84 | 1 | 0 | no |
| FBTC | `0xC96dE26018A54D51c097160568752c4E3BD6C364` | 0% | 78% | 7.50% | yes | no | 1 | 153.83 | 1 | 1.00 | yes |

Bonus = liquidationBonus − 10000. Reserve factors: WBTC, cbBTC, tBTC, LBTC, eBTC, BTC.b 50%; FBTC 75%.

Older values quoted in the article: WBTC LTV 73% / LT 78% at block 26193284 (14 Oct 2026) from `aave-health-factor.mdx`
and `safe-aave-health-factor.mdx`; 81% / 85% at block 26291889 (28 Oct 2026) from `snapshots/aave-e-mode.md`.

## 2. Aave Oracle `0x54586bE62E3c3580375aE3723C145253060Ca0C2`, block 26296985

| Asset | `getSourceOfAsset` | `description()` | `getAssetPrice` (8 dec) | USD |
| --- | --- | --- | --- | --- |
| WBTC | `0xDaa4B74C6bAc4e25188e64ebc68DB5050b690cAc` | "wBTC/BTC/USD" | 7969916421340 | 79,699.16 |
| cbBTC | `0xb41E773f507F7a7EA890b1afB7d2b660c30C8B0A` | "BTC / USD" | 7981889255223 | 79,818.89 |
| tBTC | `0xb41E773f507F7a7EA890b1afB7d2b660c30C8B0A` | "BTC / USD" | 7981889255223 | 79,818.89 |
| BTC.b | `0xb41E773f507F7a7EA890b1afB7d2b660c30C8B0A` | "BTC / USD" | 7981889255223 | 79,818.89 |
| FBTC | `0xb41E773f507F7a7EA890b1afB7d2b660c30C8B0A` | "BTC / USD" | 7981889255223 | 79,818.89 |
| LBTC | `0xf8c04B50499872A5B5137219DEc0F791f7f620D0` | "Capped LBTC / BTC / USD" | 8023745059130 | 80,237.45 |
| eBTC | `0x03bB418e89B75407585f8198178f253DA3216218` | "Capped eBTC / BTC / USD" | 8015602999421 | 80,156.03 |
| WETH | `0x5424384B256154046E9667dDFaaa5e550145215e` | "ETH / USD" | 230984088059 | 2,309.84 |

WBTC adapter: `ASSET_TO_PEG()` = `0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23` ("WBTC / BTC", `latestAnswer` 99850000 =
0.9985); `PEG_TO_BASE()` = `0xb41E773f507F7a7EA890b1afB7d2b660c30C8B0A` ("BTC / USD", 7981889255223). 0.9985 ×
79,818.89 = 79,699.16: matches. The BTC / USD feed's `latestRoundData` updatedAt 1793256479 (2026-10-29 06:47:59 UTC).

LBTC CAPO adapter: `RATIO_PROVIDER` `0x1De9fcfeDF3E51266c188ee422fbA1c7860DA0eF`; `getRatio` 1005243846734663908
(1.005244); `getSnapshotRatio` 1e18 at `getSnapshotTimestamp` 1750023287 (2025-06-15 21:34:47 UTC);
`getMaxYearlyGrowthRatePercent` 200 (2.00%); `getMaxRatioGrowthPerSecond` 634195839; `isCapped` false. Cap at block
time: 1 + 634195839 × (1793259911 − 1750023287) ÷ 1e18 = 1 + 0.027420 = 1.027420.

eBTC CAPO adapter: `RATIO_PROVIDER` `0x1b293DC39F94157fA0D1D36d7e0090C8B8B8c13F`; `getRatio` 1004223780000000000
(1.004224); snapshot 1e18 at 1752286019 (2025-07-12 02:06:59 UTC); max yearly growth 190 (1.90%); per second
602486047; `isCapped` false. Cap at block time: 1 + 602486047 × 40,973,892 ÷ 1e18 = 1.024686.

## 3. Aave E-Mode categories with a BTC wrapper (from `snapshots/aave-e-mode.md`, 28 Oct 2026)

Ethereum Core, block 26291736: 4 LBTC_WBTC (LTV 84% / LT 86% / bonus 3%, collateral LBTC, borrowable WBTC); 5
LBTC_cbBTC and 6 LBTC_tBTC (same parameters); 7 eBTC/WBTC (83% / 85% / 3%); 16 FBTC/WBTC (84% / 86% / 3%, FBTC
frozen). Base, block 53204166: 4 LBTC_cbBTC (82% / 84% / 3%); 10 cbBTC Stablecoins (82% / 85% / 4%, borrowable USDC
and GHO); 14 LBTC__USDC_GHO (75% / 78% / 5%); 15 tBTC__USDC_GHO (72% / 75% / 7.5%). Arbitrum: 10 tBTC__USDCn_USDT
(72% / 75% / 7.5%).

## 4. Morpho (API, 29 Oct 2026, `markets` where listed and collateral in the five wrappers, chains 1 and 8453)

| Chain | Market | LLTV | Market id | Borrowed (USD) | Supplied (USD) | Oracle | Feeds |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Base | cbBTC / USDC | 86% | `0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836` | 1,620,628,353 | 1,793,924,799 | `0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9` | baseFeedOne `0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F` "BTC / USD" |
| Ethereum | cbBTC / USDC | 86% | `0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64` | 309,813,029 | 343,983,277 | `0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a` | baseFeedOne `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c` (BTC / USD) |
| Ethereum | WBTC / USDC | 86% | `0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49` | 115,770,160 | 128,673,789 | `0xDddd770BADd886dF3864029e4B377B5F6a2B6b83` | BASE_FEED_1 `0xfdFD...FBB23` "WBTC / BTC", BASE_FEED_2 `0xF403...E88c` BTC / USD, QUOTE_FEED_1 `0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6` "USDC / USD" |
| Ethereum | WBTC / USDT | 86% | `0xa921ef34e2fc7a27ccc50ae7e4b154e16c9799d3387076c421423ef52ac4df99` | 84,068,482 | 90,178,139 | `0x008bF4B1cDA0cc9f0e882E0697f036667652E1ef` | not read |
| Ethereum | LBTC / USDC | 86% | `0xbf02d6c6852fa0b8247d5514d0c91e6c1fbde9a168ac3fd2033028b5ee5ce6d0` | 1,868,304 | 2,155,419 | `0xDCc04fFaCD7B49035cCdBbbA59a5f955944129DB` | baseFeedOne `0xb415eAA355D8440ac7eCB602D3fb67ccC1f0bc81` ("Redstone Price Feed", answer 100524385 = 1.005244), baseFeedTwo BTC / USD |
| Ethereum | tBTC / USDC | 77% | `0xe4cfbee9af4ad713b41bf79f009ca02b17c001a0c0e7bd2e6a89b1111b3d3f08` | 639,051 | 711,986 | `0x57bfdF6aB73995C5af58A95A16798190e366CA5b` | feeds' `description()` reverted; not described |

Oracle prices read on-chain: Ethereum cbBTC / USDC `price()` 797523717986300000000000000000000000000 at block 26297045
→ × 10^(8−6) ÷ 10^36 = 79,752.37 USDC per cbBTC. Ethereum WBTC / USDC `price()` 796554004230283811927464648044489774671
(latest block, 29 Oct 2026) → 79,655.40 USDC per WBTC. Base cbBTC / USDC `price()` 797418917235000000000000000000000000000
at Base block 53235646 → 79,741.89.

Liquidation incentive factor at LLTV 86%: 1.0438 (4.38%), from `how-morpho-liquidation-works.mdx`.

## 5. Arithmetic (Python, writer, 2026-10-29)

One wrapper against 40,000 USDC on Ethereum Core (USDC counted at $1 for the example; the oracle said $0.99972):

| Collateral | Price | LT | HF | Liquidation price = 40,000 ÷ LT |
| --- | --- | --- | --- | --- |
| WBTC | 79,699.16 | 85% | 79,699.16 × 0.85 ÷ 40,000 = 1.6936 | 47,058.82 (WBTC as the oracle prices it) |
| cbBTC | 79,818.89 | 85% | 1.6962 | 47,058.82 |
| tBTC | 79,818.89 | 78% | 1.5565 | 51,282.05 |
| LBTC | 80,237.45 | 75% | 1.5045 | 53,333.33 (BTC / USD at 53,333.33 ÷ 1.005244 = 53,055.13) |
| eBTC | 80,156.03 | 72% | 1.4428 | 55,555.56 |

Morpho Ethereum cbBTC / USDC (86%): 79,752.37 × 0.86 ÷ 40,000 = 1.7147; liquidation price 40,000 ÷ 0.86 = 46,511.63.

LT ÷ LTV at the borrowing limit: WBTC and cbBTC 85 ÷ 81 = 1.0494; tBTC and BTC.b 78 ÷ 73 = 1.0685; LBTC 75 ÷ 70 =
1.0714; eBTC 72 ÷ 67 = 1.0746. WBTC on 14 Oct 2026: 78 ÷ 73 = 1.0685.

Oracle gap: cbBTC 79,818.89 − WBTC 79,699.16 = 119.73 USD = 0.15% (the WBTC / BTC feed at 0.9985).

Supply shares on Core: WBTC 34,138.21 of the 56,156.07 wrapped BTC supplied across the seven reserves (34,138.21 + 17,303.85 + 1,779.39 +
2,689.93 + 75.02 + 15.84 + 153.83) = 60.8%; cbBTC 17,303.85 = 30.8%.

## 6. Threads and posts quoted (governance.aave.com, fetched 2026-10-29)

- Topic 19096, "[ARFC] Adjusting WBTC Parameters to Address BitGo Transition Risks": LlamaRisk, 18 Sep 2024, proposed
  WBTC LTV 0 on all V3 instances and caps 5 to 10% above use; clarified 19 Sep "not to offboard WBTC, nor to reduce
  current exposure"; Chaos Labs' merged plan, 24 Sep 2024: caps 15% above use, LT −1 point, LTV to 70% where higher,
  reserve factor 20% → 40%; Ethereum V3 borrow cap 28,000 → 3,250. Thread closed 8 Nov 2024.
- Topic 20142, "[ARFC] Onboard LBTC on Aave v3 Core Instance": ACI, 10 Dec 2024; parameters LTV 70% / LT 75% / bonus
  8.5%, supply cap 800, reserve factor 50%; LBTC/WBTC E-Mode 84% / 86% / 3%; LlamaRisk "We are unable to identify a
  suitable oracle at this time"; Chaos Labs recommended BTC/USD while slashing is inactive; Snapshot passed (YAE).
- Topic 22614, "[Direct to AIP] LBTC Oracle and CAPO implementation Update": Chaos Labs, 17 Jul 2025; LBTC/BTC exchange
  rate from Lombard's StakedLBTCOracle × BTC/USD under CAPO, max yearly growth 2.00% (LBTC) and 1.90% (eBTC), 30-day
  snapshot, 7-day delay; eBTC "largely backed by LBTC (historically 90–99%)".
- Topic 20940, "[ARFC] Core & Base - BTC Correlated Asset Update": TokenLogic, 4 Feb 2025; LBTC E-Modes with cbBTC,
  fBTC and tBTC borrowable at 84% / 86% / 3% on Core; Base LBTC onboarding 68% / 73% / 8.5%.
- Unchained, "WBTC completes shift to multi-jurisdiction custody model", 9 Oct 2024: completed 8 Oct 2024 after a
  60-day transition; BitGo and BiT Global joint venture across the US, Singapore and Hong Kong.
- Aave Labs blog, "How Aave Liquidations Perform Under Volatile Conditions", 6 Feb 2026: "more than $250 million was
  liquidated on the day" (10 Oct 2025); $4.65 billion across 310,000+ liquidations 2020 to Feb 2026; BTC-related debt
  4.4% of total repaid.

## 7. Tokenping product facts used

- Aave V3 markets on 21 networks, Aave V4 Spokes, Morpho Blue and Midnight on 14 chains; `getUserAccountData` for Aave;
  Morpho HF computed on-chain; checks every 5 minutes; Aave threshold 1.1 to 10, Morpho 1.02 to 10.

## 8. Not verified

- Who operates the "BTC / USD" source `0xb41E...8B0A` and "ETH / USD" `0x5424...215e` (not the standard Chainlink
  proxies): described as "the BTC / USD feed Aave's oracle uses".
- The tBTC / USDC Morpho oracle's feeds.
- WBTC's current custody key arrangement (2-of-3) beyond the Unchained article: not claimed.
