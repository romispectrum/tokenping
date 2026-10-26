# Data snapshot: morpho-pre-liquidation

Every on-chain figure, date and claim about Morpho in `content/blog/morpho-pre-liquidation.mdx`, written 2026-10-26. All
times are UTC. A research pass read the contracts and Morpho's API on 26 Oct 2026 (working copies kept outside the repo);
the writer then re-read the Base and Ethereum pre-liquidation contracts with `cast` and re-ran the API queries, and found the
same values. The Morpho ScopeNote date (26 Oct 2026) matches the figures here.

Line references: `morpho-org/pre-liquidation` at commit 6f15d201b15f101f0956b8b7eab0d85defe18959; `morpho-org/morpho-blue`
`src/Morpho.sol` at commit 9cf6d5b844625ba108e36d1cf911f5d2faf7c136.

## 1. Contracts

| Chain | Morpho Blue | PreLiquidationFactory | PreLiquidation (cbBTC/USDC, 86% LLTV) | Market oracle | RPC |
| --- | --- | --- | --- | --- | --- |
| Base | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` | `0x8cd16b62E170Ee0bA83D80e1F80E6085367e2aef` | `0xa7272aFc21f9C321024ED93892a1abfeb621C374` | `0x663BECd10daE6C4A3Dcd89F1d76c1174199639B9` | base-rpc.publicnode.com |
| Ethereum | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` | `0x6FF33615e792E35ed1026ea7cACCf42D9BF83476` | `0xBFa7f9c1983aE40738Ea0F128e58aa704461AA3A` | `0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a` | ethereum-rpc.publicnode.com |

Blue and factory addresses from `config/morpho.ts`; factory addresses also in the SDK's `packages/morpho-ts/src/addresses.ts`
(Ethereum line 121, Base line 217). `factory.MORPHO()` on Base returned the Blue address above.

## 2. Base, USDC | cbBTC (86%) (worked example and "a real contract")

Cluster review: the guide now names Blue markets as Morpho's app does, loan token first ("USDC | cbBTC (86%)"), like
the hub and the liquidation guide.

Market id `0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836`. Research pass at block 53102692
(timestamp 1792994731, 2026-10-26 06:05:31); writer re-read at block 53102952 (timestamp 1792995251).

| Call | Value | Used for |
| --- | --- | --- |
| `factory.isPreLiquidation(0xa7272a...C374)` | true (both blocks) | "the factory confirms it created the contract" |
| `preLiquidation.ID()` | the market id above (both blocks) | "points to this market" |
| `preLiquidation.preLiquidationParams()` | (832603694978499652, 2001493508968667, 245311807032632372, 1043841336116910229, 1043841336116910229, `0x663BEC...39B9`) (both blocks) | preLLTV 83.26%, close factor 0.20% to 24.53%, bonus 4.38%, market oracle |
| `preLiquidation.marketParams()` | (USDC `0x8335...2913`, cbBTC `0xcbB7...33Bf`, oracle `0x663BEC...39B9`, IRM `0x4641...2687`, 860000000000000000) | market and its oracle |
| `oracle.price()` at 53102692 | 800973300000000000000000000000000000000 | 80,097.33 USDC per cbBTC (price / 1e34: USDC 6 decimals, cbBTC 8) |
| `oracle.price()` at 53102952 | 800001529753600000000000000000000000000 | 80,000.15 USDC per cbBTC, the worked example's price (cluster review) |
| `oracle.price()` at 53102870 (cluster review, `cast`) | 800001529753600000000000000000000000000 | the same 80,000.15; the price and block `how-morpho-liquidation-works.mdx` uses |
| `Blue.market(id)` at 53102692 | totalSupplyAssets 1789871000578774, totalBorrowAssets 1613068192882196 | about 1.61 billion USDC borrowed |
| `codesize(0xa7272a...C374)` | 6212 bytes; EIP-1967 implementation slot zero (research pass) | not a proxy: "no owner, admin or upgrade function" (with the source, below) |
| `cast logs` topic0 `0xd5b01f14...a8580` (PreLiquidate), blocks 53052692 to 53102692 | none | "no pre-liquidation in the roughly 28 hours read" |

Older PreLiquidate history was not read: the public RPC refuses archive log ranges.

Morpho API (`POST https://api.morpho.org/graphql`, `marketById(chainId: 8453)`), read by both passes: listed true, LLTV 0.86,
one pre-liquidation contract with the same address and parameters as on chain; collateralAssets 4005073874706 (40,050.74 cbBTC,
"about 40,051 cbBTC"); borrowAssetsUsd 1,612,777,305. `marketPositions(... borrowShares_gte: "1")` countTotal 42985 (research
pass), 42984 (writer), so the text says "about 43,000". No individual wallet was read.

## 3. Ethereum, cbBTC/USDC at 86% LLTV

Market id `0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64`. Research pass at block 26274980 (timestamp
1792995011); writer re-read at block 26275002.

- `factory.isPreLiquidation(0xBFa7...AA3A)`: true. `ID()`: the market id.
- `preLiquidationParams()`: the same five numbers as Base, oracle `0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a`, equal to the
  market oracle in `marketParams()` (loan USDC `0xA0b8...eB48`, collateral cbBTC, IRM `0x870a...00BC`, LLTV 0.86).
- Review pass (26 Oct 2026), Morpho API `markets(chainId_in: [1], listed: true)` with cbBTC collateral and USDC loan: three
  listed 86% markets. `0x64d65c9a...fcc64` (this one, borrowAssetsUsd 309,065,733, pre-liquidation `0xBFa7...AA3A`),
  `0xba3ba077...c5a7` (579,203, pre-liquidation `0x3Ed3EbD4B87c45288e2e34813367620e9684092a`) and `0xbc99de6a...84fe`
  (950,527, none). Hence "the largest listed cbBTC/USDC market at 86%".

## 4. Contracts listed by Morpho's API

Query: `markets(first: 500, skip: 0 and 500, where: {chainId_in: [1, 8453, 42161, 10, 137, 130, 480, 999, 747474, 143, 5042,
4663, 988, 4217], listed: true})` with `preLiquidations { items { address preLltv preLiquidationOracle } }`, run by both
passes. Arc's API chain id is 5042. Result: 679 listed markets; 106 have one pre-liquidation contract each, 106 in total.

- By chain: Ethereum 50, Base 37, Arbitrum 8, Polygon 6, Katana 3, Unichain 2; none on the other eight chains.
- By LLTV: 86% 50, 91.5% 21, 94.5% 15, 77% 12, 96.5% 6, 62.5% 2.
- Every preLLTV equals the SDK default for its LLTV (section 5).
- GraphQL schema (introspection, research pass): `Market.preLiquidations` is "Pre-liquidation contracts deployed for this
  market with known default parameters"; not deprecated. No field for whether a wallet authorised a contract. Supports "the
  API only lists contracts with known default parameters".
- Oracle comparison (review pass, 26 Oct 2026, same query with `oracle { address }`): 679 listed markets, 106 contracts;
  `preLiquidationOracle` equals the market's oracle for 106 of 106, 0 differ. Supports "All 106 contracts Morpho's API lists
  use their market's own oracle".

## 5. Default parameter table

From `packages/blue-sdk/src/preLiquidation.ts` lines 10-91 (`defaultPreLiquidationParamsRegistry`), parsed by the writer.
The registry has eight entries (the rows below); `getDefaultPreLiquidationParams` throws `UnsupportedPreLiquidationParamsError`
for any other LLTV (lines 96-116). Hence "a default parameter set for each of eight common LLTVs".
"Starts at" = LLTV / preLLTV; "Blue bonus" = min(1.15, 1 / (1 - 0.3 x (1 - LLTV))), from Morpho.sol lines 365-369 and
ConstantsLib (`LIQUIDATION_CURSOR` 0.3e18, `MAX_LIQUIDATION_INCENTIVE_FACTOR` 1.15e18).

| LLTV | preLLTV | preLCF1 | preLCF2 | preLIF1 = preLIF2 | Blue bonus | Starts at |
| --- | --- | --- | --- | --- | --- | --- |
| 38.5% | 30.151% | 2.264% | 34.967% | 1.15 | 1.15 | 1.2769 (no listed contract; not in the article) |
| 62.5% | 56.259% | 0.754% | 27.954% | 1.12676 | 1.12676 | 1.1109 |
| 77% | 72.737% | 0.371% | 25.664% | 1.07411 | 1.07411 | 1.0586 |
| 86% | 83.260% | 0.200% | 24.531% | 1.04384 | 1.04384 | 1.0329 |
| 91.5% | 89.787% | 0.114% | 23.921% | 1.02617 | 1.02617 | 1.0191 |
| 94.5% | 93.375% | 0.071% | 23.610% | 1.01678 | 1.01678 | 1.0121 |
| 96.5% | 95.777% | 0.044% | 23.411% | 1.01061 | 1.01061 | 1.0075 |
| 98% | 97.584% | 0.025% | 23.266% | 1.00604 | 1.00604 | 1.0043 (no listed contract; not in the article) |

The 94.5% preLLTV from the API is 93.37466%, shown as 93.37% in the article.

## 6. Worked example (Python, writer; illustrative position)

Cluster review: the example moved from 80,097.33 (block 53102692) to 80,000.15 (blocks 53102870 and 53102952) so that
it matches the liquidation guide's identical position. The step table depends only on LTV, so it is unchanged.

1 cbBTC collateral, 50,000 USDC debt, price 80,000.15 (section 2), LLTV 0.86, preLLTV 0.832603694978499652, preLCF1
0.002001493508968667, preLCF2 0.245311807032632372, preLIF 1.043841336116910229.

- HF on the LLTV line 80,000.15 x 0.86 / 50,000 = 1.3760; on the preLLTV line 1.3322; ratio preLLTV / LLTV = 0.96814.
- Pre-liquidation starts below 50,000 / 0.8326037 = 60,052.58 (24.93% below); liquidation below 50,000 / 0.86 = 58,139.53 (27.33%).
  (At 80,097.33 these were 1.3777, 1.3338, 25.03% and 27.41%.)
- quotient = (LTV - preLLTV) / (LLTV - preLLTV); close factor = preLCF1 + quotient x (preLCF2 - preLCF1); repaid = close
  factor x 50,000; collateral taken = repaid x preLIF; LTV after = (50,000 - repaid) / (50,000 / LTV - taken).

| LTV | Price | Close factor | Repaid | Taken | Bonus | LTV after |
| --- | --- | --- | --- | --- | --- | --- |
| 84% | 59,523.81 | 6.769% | 3,384.45 | 3,532.83 | 148.38 | 83.255% |
| 85% | 58,823.53 | 15.650% | 7,825.02 | 8,168.08 | 343.06 | 83.259% |
| 86% | 58,139.53 | 24.531% | 12,265.59 | 12,803.33 | 537.74 | 83.23% |

- Normal Blue liquidation at 87% LTV: collateral value 57,471.26; full repay 50,000 x 1.043841 = 52,192.07 taken; 5,279.20
  left. Bonus on the whole loan 2,192.07.
- Tokenping thresholds on the pre-liquidation line, as market HF (threshold x LLTV / preLLTV): 1.02 -> 1.0536, 1.10 -> 1.1362.

## 7. Mechanics (source code)

| Claim in the article | Source |
| --- | --- |
| One market and one parameter set per contract; immutables only, no owner or admin | `PreLiquidation.sol` lines 31-48, full 195-line source |
| Factory has no access control; CREATE2 salt 0, so a market and parameter set exists once | `PreLiquidationFactory.sol` lines 42-55 |
| Constructor limits: preLLTV < LLTV, preLCF1 <= preLCF2, preLCF1 <= 1, 1 <= preLIF1 <= preLIF2 <= 1/LLTV, market exists | `PreLiquidation.sol` lines 77-89; README lines 41-46 |
| Only preLCF1 is capped at 100%; preLCF2 above 100% makes the whole position pre-liquidatable | `PreLiquidation.sol` line 86 and the comment above `preLCF` in `preLiquidate`; README line 48 |
| The 1/LLTV cap, together with pre-liquidation stopping at LTV <= LLTV, stops a pre-liquidation from worsening health | README line 50 |
| The pre-liquidation oracle's price is used for both LTV checks and to compute the collateral taken (`seizedAssets`) or debt repaid | `PreLiquidation.sol` `preLiquidate`, `collateralPrice` |
| 1 ÷ 0.86 = 1.1628, "a bonus of about 16% on an 86% market" at the cap | arithmetic |
| Allowed only when preLLTV < LTV <= LLTV on the pre-liquidation oracle | `PreLiquidation.sol` lines 145, 147 |
| Linear interpolation of both factors | lines 125-128, 149-151, 166; README lines 25-28 |
| Close factor caps one call (`PreLiquidationTooLarge`) | lines 168-169 |
| Repeated calls can exceed preLCF in total | README lines 69-75 |
| Must leave the position healthy on the market oracle, else revert | lines 121-124; `Morpho.sol` line 337 |
| Oracle may be the market's or another `IOracle` | README lines 58-62 |
| Opt in through Blue's authorisation; `withdrawCollateral` needs `_isSenderAuthorized` | `PreLiquidation.sol` line 187; `Morpho.sol` lines 331, 467-468; README line 11 |
| Authorisation has no market key; covers withdraw, borrow, withdrawCollateral | `Morpho.sol` lines 66, 212, 247, 331 |
| `setAuthorization` reverts `ALREADY_SET` when unchanged | `Morpho.sol` lines 437-443 |
| Authorisation can be given by signature, sent by any caller (`setAuthorizationWithSig`); both paths emit `SetAuthorization(caller, authorizer, authorized, newIsAuthorized)` with all three addresses indexed | `Morpho.sol` lines 442, 446-464; `EventsLib.sol` line 134 |
| The factory answers `isPreLiquidation(address)` true for the contracts it created | `PreLiquidationFactory.sol` lines 26, 52 |
| Blue liquidation needs an unhealthy position (HF below 1) and has no close factor | `Morpho.sol` lines 363, 371-388, 540 |
| Pre-liquidation exists only for Blue | `PreLiquidation.sol` imports Blue's `IMorpho` (line 4) |

## 8. Status and history

| Claim | Source |
| --- | --- |
| Announced 4 Mar 2025; "auto-deleverage and auto-close" as uses; anyone can configure parameters for any market; default liquidation applies if no pre-liquidation happens | morpho.org blog "Introducing pre-liquidations", page date 04 Mar 2025, read by the writer |
| App name Auto-deleverage; article id 12048871 old URL `...-auto-deleverage` answers 301 to `...-sunsetting-auto-deleverage`; page title exactly "Sunsetting Auto-deleverage" (re-read in the review pass) | `curl -w "%{redirect_url}"`, writer; page heading |
| The app shows each position's health factor; a position can be liquidated once it reaches 1 or less, that is once its LTV exceeds the LLTV | help.morpho.org article 12166252 "Liquidation", read in the review pass |
| Sunset: no new positions, users should disable it, manage button on the dashboard position or market page; what the feature did; last updated 2026-05-13T14:05:12Z | help.morpho.org article 12048871, page JSON `lastUpdatedDate` |
| SDK deprecation: PR 1132 "chore: deprecate all pre-liquidation logic", merged 2026-09-22T13:51:24Z; removal in the next major; no successor; shipped in blue-sdk 7.0.0 | `gh api repos/morpho-org/sdks/pulls/1132` (writer); `preLiquidation.ts` lines 8 and 96; blue-sdk CHANGELOG lines 128-137 |
| Docs page gone: `docs.morpho.org/build/borrow/concepts/preliquidation` answers 308 and ends at `/developers/borrow/concepts/liquidation/` | curl, both passes |

## 9. Tokenping (this repo)

| Claim | Code |
| --- | --- |
| Reads `isAuthorized(user, preLiquidation)` and the pre-liquidation oracle's price; alerts on the lower of the LLTV and pre-liquidation lines; no reading when either read fails | `services/morpho/health.ts` lines 50-51, 107-121 |
| Candidate contracts: those Morpho's API lists for the market (plus ones already stored), each checked with the factory and `ID()` | `services/morpho/api.ts` lines 81, 170; `services/morpho/params.ts` lines 69-95, 190 |
| The list is read when an alert is saved (`readListedMarketParams`) and refreshed when it is edited (`refreshMarketParams`), only from the config route; the cron uses the stored list and reads `isAuthorized` and the oracle price for each stored contract. A contract the API does not list is never checked. Hence "When you save or edit an alert, Tokenping notes the pre-liquidation contracts Morpho's API lists" and the unlisted-contract warning | `services/morpho/params.ts` lines 157-197; `app/api/notifications/config/route.ts` lines 68, 77; `services/notifications/morphoAlerts.ts` lines 11-12, 37, 46-48 |
| A contract that is not authorised is skipped, so after revoking, the alert measures against the LLTV line alone | `services/morpho/health.ts` (`if (!authorised) continue`) |
| Threshold 1.02 to 10 for Morpho | `constants/notifications.ts` (`MORPHO_HEALTH_FACTOR_THRESHOLD_MIN`, `HEALTH_FACTOR_THRESHOLD_MAX`) |
| Every 5 minutes, 14 networks, Signal, Telegram, email, price via `<AlertPrice />`, dashboard needs no payment | brief from the repo's code; cron in `vercel.json` |

Cluster review: the save-or-edit and unlisted-contract sentences go beyond the brief's list of Tokenping facts. They
match the code above and were kept, flagged for the owner to confirm.

## 10. Left out

- How many borrowers still have a pre-liquidation authorised, and how many pre-liquidations have happened: no API field, and
  the logs need an archive RPC.
- Whether contracts with non-default parameters exist (the API would not list them): needs a full scan of CreatePreLiquidation
  logs on an archive RPC.
- When the app stopped taking new opt-ins, whether its manage button still shows today, and what health factor the app shows
  for an opted-in position: the app was not inspected. The article states only what the help centre's "Liquidation" article
  says (health factor against the LLTV, liquidatable at 1 or below).
- Proof at contract level that the app's Auto-deleverage used these factory contracts: the evidence (Morpho's blog, the old docs
  title "Pre-Liquidation (Auto-Deleveraging)", the default-only API listing, the matching mechanics) is strong but indirect, and
  the archived docs page could not be re-fetched in the review pass (web.archive.org answered 429). So the article says only that
  the app had a feature called Auto-deleverage that works this way and that the help centre describes in the same terms.
