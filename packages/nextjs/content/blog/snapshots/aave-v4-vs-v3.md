# Data snapshot: aave-v4-vs-v3

Post: `content/blog/aave-v4-vs-v3.mdx` (published 2026-11-04). Every on-chain value, API value, code constant, date and
mechanism the post states, with the call or source, block or time, and URL. All times are UTC. All reads were made on
2026-11-04 between 13:15 and 13:35. No borrower's address is recorded here.

- Tool: Foundry `cast` (read-only `eth_call`), Python `urllib` for the GraphQL API.
- RPCs: Ethereum `https://ethereum-rpc.publicnode.com` (latest block only) and `https://eth-mainnet.public.blastapi.io`
  (archive reads, and the all-Spoke scan), `https://eth.drpc.org` (logs, one archive read that matched blastapi);
  Avalanche `https://api.avax.network/ext/bc/C/rpc`; Base `https://mainnet.base.org`; Arc
  `https://rpc.quicknode.mainnet.arc.io` (the RPC in `config/aaveConfig.ts`).
- `meta.figuresAsOf: "2026-11-04"` makes the ScopeNote show 4 Nov 2026 instead of the Aave default (14 Oct 2026). The
  text also dates live figures where they appear.
- Governance and risk stewards can change any parameter below. Re-read before updating the post.

## 1. Launch dates and size

| Fact in the post                                          | Value                                                                 | Source                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| V4 on Ethereum                                            | 2026-03-30, "Three hubs (Core, Plus, Prime) and eleven spokes"        | https://aave.com/docs/resources/changelog.md (fetched 13:15)                                              |
| V4 on Avalanche, Arc, Base                                | 2026-07-15, 2026-09-16, 2026-10-07                                    | same                                                                                                      |
| Global Dollar (USDG) Hub and Spoke on Ethereum            | 2026-06-25                                                            | same                                                                                                      |
| V4 networks today                                         | Ethereum, Arc, Base, Avalanche                                        | V4 API `chains(request:{query:{filter: MAINNET_ONLY}})`, 13:16:45                                         |
| TVL, excluding borrowed                                   | aave-v3 15,596,209,228 USD (≈ $15.6B); aave-v4 786,388,898 (≈ $0.79B) | `https://api.llama.fi/protocols`, 13:27:52                                                                |
| Borrowed                                                  | aave-v3 11,364,139,889 (≈ $11.4B); aave-v4 469,426,172 (≈ $0.47B)     | same, `chainTvls.borrowed`                                                                                |
| V4 above $1.5B deposits and $450M active loans in October | quoted as Aave Labs' figures                                          | "AL Development Update, October 2026", AaveLabs, 2026-11-02, https://governance.aave.com/t/25979          |
| V3 networks                                               | 21 (24 markets)                                                       | `config/aaveConfig.ts` `AAVE_MARKETS`; DefiLlama `aave-v3.chains` also lists 21 incl. a dust Fantom entry |

The post says V3 holds "about $15.6B" and V4 "about $0.79B" of deposits net of loans (DefiLlama's TVL excludes borrowed
amounts), and "about $11.4B" vs "about $0.47B" of loans.

## 2. Hubs and Spokes (V4 API, `spokes` and `hubs` for chain ids 1, 5042, 8453, 43114; 13:16:45)

Raw: `scratchpad/v4vs3/raw/api_spokes_hubs.json`. 24 Spokes, 8 Hubs.

| Network   | Hubs (API names)                          | Spokes (API names)                                                                                                                                                                                                                                                               |
| --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ethereum  | Core, Prime, Plus, Global Dollar, Sentora | Main, Bluechip (Prime + Core), Lido, Etherfi, Kelp, Lombard, Ethena Ecosystem (Plus + Core), Ethena Correlated (Plus), Gold, PAXG Gold (Global Dollar), Forex, USDG Pendle, Maple SyrupUSDG (Global Dollar + Core); Sentora Hub: RLUSD Yield, OUSD Yield, Bluechip `0xA37e…2c46` |
| Avalanche | Core                                      | Main, AVAX Correlated, Forex, Ethena Ecosystem                                                                                                                                                                                                                                   |
| Arc       | Core                                      | Main, Forex, Maple SyrupUSDC                                                                                                                                                                                                                                                     |
| Base      | Coinbase Stocks                           | Coinbase Stocks                                                                                                                                                                                                                                                                  |

- Aave's docs list the Ethereum Spokes with the suffix "eSpoke" for Lido, EtherFi and Kelp (https://aave.com/docs/aave-v4/liquidity/spokes.md,
  "Deployed Spokes"). The activation ARFC (AaveLabs, 2026-03-13, https://governance.aave.com/t/24293) labels Lido,
  EtherFi, Kelp and Lombard BTC as "(e-Mode)" Spokes and lists their collateral and borrowable assets (Lido: wstETH
  collateral, WETH borrowable).
- Sentora is "the first external curator on Aave V4" (AL Development Update, October 2026).
- Update, same day: the four Spokes below were added to `AAVE_V4_SPOKES` (now 24, matching the API), after Tokenping's
  reader returned live positions from RLUSD Yield, Sentora Bluechip and Avalanche Ethena Ecosystem. The guide says
  "all 24". Before that, Tokenping read the 20 Spokes in `config/aaveConfig.ts` `AAVE_V4_SPOKES` (from the API on
  2026-10-16). Not in that list
  today: Ethereum RLUSD Yield `0x9EbF0C19BF7dFE859820Cc09E846114b53814e52`, OUSD Yield
  `0xbb97b61Ad6747D337E5805F2d159d275BB1f0828`, Bluechip (Sentora) `0xA37e7cdC557f3C7f745FB3F337b6439979662c46`, and
  Avalanche Ethena Ecosystem `0xaf22446124e566e54845f65b722E4dCbf12b650A`. README "Limits": a new Spoke is read only once it is
  added to `AAVE_V4_SPOKES`.

## 3. Spoke liquidation settings and collateral risk (on-chain, every Spoke)

Scan script: `getLiquidationConfig()` and, for every reserve, `getReserve(uint256)` (field `collateralRisk`) on each Spoke.
Blocks: Ethereum 26341712 (13:21:23), Avalanche 99406393 (13:21:25), Base 53504570 (13:21:27), Arc 29504382 (13:21:27).
Raw: `scratchpad/v4vs3/raw/onchain_spokes.txt`. The API's `liquidationConfig` (13:16:45) gave the same values for all 24.

| Spoke                                                                                     | Target HF | HF for max bonus | Bonus factor |
| ----------------------------------------------------------------------------------------- | --------- | ---------------- | ------------ |
| Main (Ethereum, Avalanche, Arc), Coinbase Stocks (Base)                                   | 1.24      | 0.90             | 90%          |
| Bluechip (Ethereum, Core/Prime)                                                           | 1.174     | 0.90             | 90%          |
| Gold                                                                                      | 1.3075    | 0.90             | 90%          |
| PAXG Gold                                                                                 | 1.20      | 0.90             | 80%          |
| Lido                                                                                      | 1.0137    | 0.99             | 100%         |
| Etherfi                                                                                   | 1.0191    | 0.99             | 100%         |
| Kelp                                                                                      | 1.0218    | 0.99             | 100%         |
| Lombard                                                                                   | 1.0615    | 0.99             | 100%         |
| Ethena Correlated, USDG Pendle, Maple SyrupUSDG, Maple SyrupUSDC, Ethena Ecosystem (Avax) | 1.0277    | 0.99             | 100%         |
| Ethena Ecosystem (Ethereum)                                                               | 1.0332    | 0.99             | 100%         |
| AVAX Correlated                                                                           | 1.035     | 0.99             | 100%         |
| Forex (all three networks)                                                                | 1.0442    | 0.99             | 100%         |
| RLUSD Yield, OUSD Yield (Sentora)                                                         | 1.047     | 0.99             | 100%         |
| Bluechip (Sentora)                                                                        | 1.143     | 0.99             | 100%         |

The post quotes: Main 1.24; Bluechip 1.174; Gold 1.3075 ("about 1.31"); the E-Mode style Spokes "between about 1.01 and
1.06" (Lido 1.0137 to Lombard 1.0615); a bonus factor of 100% (flat bonus) on those.

Collateral risk non-zero on these reserves only (all others 0), read with `getReserve` and `getReserveConfig` keys at the
blocks above, and confirmed in the API `reserves.settings.collateralRisk`:

| Spoke                       | Reserve                              | Collateral risk    | Collateral factor   |
| --------------------------- | ------------------------------------ | ------------------ | ------------------- |
| Arc, Maple SyrupUSDC        | syrupUSDC                            | 2000 (20%)         | 92%                 |
| Avalanche, Ethena Ecosystem | USDe                                 | 1650 (16.5%)       | 93%                 |
| Base, Coinbase Stocks       | SPCXc                                | 1000 (10%)         | 55%                 |
| Ethereum, RLUSD Yield       | USDe 625, PRIME 1875, PST 7500 (bps) | 6.25%, 18.75%, 75% | 91.5%, 89.5%, 87.5% |
| Ethereum, OUSD Yield        | same values as RLUSD Yield           |                    |                     |

The ARFC's LlamaRisk reply says Spokes launch "with collateralRisk = 0 across all assets"; the October update calls
syrupUSDC on Arc "the first reserve to experience the Risk Premium". The post names syrupUSDC, USDe on Avalanche and
SPCXc as examples and says Main and the other launch Spokes have 0.

## 4. Reserve settings used in the post (V4 API `reserves` by Spoke, 13:17:15; on-chain re-read at Ethereum 26341695)

Raw: `scratchpad/v4vs3/raw/api_reserves.json`.

| Spoke    | Reserve | Hub   | Collateral factor | Max liquidation bonus | Liquidation fee | Dynamic config key | On-chain `getDynamicReserveConfig(id,key)` at 26341695 |
| -------- | ------- | ----- | ----------------- | --------------------- | --------------- | ------------------ | ------------------------------------------------------ |
| Main     | WETH    | Core  | 84%               | 5.55%                 | 10%             | 0                  | (8400, 10555, 1000)                                    |
| Main     | wstETH  | Core  | 82%               | 6.66%                 | 10%             | 2                  | (8200, 10666, 1000)                                    |
| Lido     | wstETH  | Core  | 95.5%             | 1%                    | 10%             | 2                  | (9550, 10100, 1000)                                    |
| Lido     | WETH    | Core  | 0 (borrow only)   |                       |                 |                    |                                                        |
| Etherfi  | weETH   | Core  | 95.5%             | 1%                    | 10%             | 2                  | API                                                    |
| Bluechip | WETH    | Prime | 86%               | 4.44%                 | 10%             | 0                  | API                                                    |

Borrow APY (API `summary.borrowApy`, 13:17:15), quoted as dated live figures:

- USDC in the Bluechip Spoke: Core Hub reserve 0.0541 (5.41%), Prime Hub reserve 0.0445 (4.45%).
- USDC in the Arc Maple SyrupUSDC Spoke (Core Hub): 0.030607 (3.06%) at 13:27:33 (`raw/api_arc_maple.json`). With a 20%
  User Risk Premium (syrupUSDC as the only collateral): 3.06% × 1.2 = 3.67%, written "about 3.7%". The premium applies
  to the drawn rate; the API figure is an APY, so the post says "about".

## 5. Collateral factor changed in place on 28 Oct 2026 (AIP 536)

- Main Spoke WETH, key 0: `getDynamicReserveConfig(0,0)` = (8300, 10555, 1000) at Ethereum block 26194078 (14 Oct 2026,
  eth.drpc.org and blastapi agree) and (8400, 10555, 1000) at 26341695.
- Bisection on blastapi: 8300 at block 26290361, 8400 at 26290362 (2026-10-28 09:35:11).
- Tx `0x226c48626ec314b194dfa080e992dcabfa1526f813835f81914e1885d5af1275`, block 26290362: `UpdateDynamicReserveConfig`
  (topic `0x2d4f2760…298d`) on the Main Spoke for reserves 0, 3, 4, 1, 2 at key 0 and reserves 1, 2 at key 2; in the same
  transaction, V3 Core PoolConfigurator `0x64b761D848206f447Fe2dd461b0c635Ec39EbB27` emitted
  `CollateralConfigurationChanged` for WETH (LTV 8100, LT 8400, bonus 10500), WBTC, cbBTC, wstETH and weETH. The
  PayloadsController `0xdAbad81aF85554E9ae636395611C58F7eC1aAEc5` logged payload 477 executed (`getPayloadState(477)` = 3).
- Aave Labs' October update lists "AIP 536: Revision of ETH & BTC Collateral Efficiency on Aave", which "raises the
  loan-to-value (LTV) ratios and liquidation thresholds on Aave V3 Ethereum Core, Arbitrum, and Base, together with the
  collateral factors of the same assets on the Aave V4 Main Spoke".
- The post uses it as the example of one change reaching both versions, and of a V4 update applied to an existing
  configuration (so to positions bound to it) rather than added as a new one.

## 6. Aave V3 values used in the post (Ethereum Core, block 26341695, 13:17:59)

| Value                                                             | Read                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| WETH LTV 8100, LT 8400, bonus 10500                               | PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` `getReserveConfigurationData(WETH)`                   |
| (on 14 Oct: LTV 8050, LT 8300, same bonus)                        | same call at block 26193284 (blastapi)                                                                              |
| Max borrow HF for WETH alone: 84 ÷ 81 = 1.037                     | arithmetic                                                                                                          |
| E-Mode 1 "ETH correlated": LTV 9300, LT 9500, bonus 10100         | Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` `getEModeCategoryCollateralConfig(1)`, `getEModeCategoryLabel(1)` |
| WETH and WBTC liquidation protocol fee 2000 (20%); 1000 on 14 Oct | `getLiquidationProtocolFee(asset)`; AIP 534 in the October update. Not quoted in the post.                          |

V3 liquidation constants, aave-v3-origin main (`8305565…`, 2026-09-09), `LiquidationLogic.sol`:
`DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e4`, `CLOSE_FACTOR_HF_THRESHOLD = 0.95e18` (inclusive), `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8`,
`MIN_LEFTOVER_BASE = 1000e8`. V3 rate curve: `DefaultReserveInterestRateStrategyV2` keeps `_interestRateData` per reserve
address, one strategy per market.

## 7. Aave V4 code and docs

aave/aave-v4 main at `a3ef63ea6415d25237a9775bf66e76e9993561c2` (2026-10-27), latest tag v0.5.11:

- `src/spoke/libraries/LiquidationLogic.sol`: `HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1e18`, `DUST_LIQUIDATION_THRESHOLD =
1000e26` ($1,000); `calculateLiquidationBonus` (max at HF ≤ hfForMaxBonus, else linear from max × factor);
  `_calculateDebtToTargetHealthFactor`: debt to repay = debt × (T − HF) ÷ (T − bonus × CF).
- `src/spoke/Spoke.sol` `_refreshAndValidateUserAccountData`: refreshes the dynamic config, then requires HF ≥ 1 (borrow,
  withdraw, disabling collateral).
- `docs/overview.md`: Hub sets the rate per asset; Spokes hold oracles and liquidation settings; Collateral Risk 0 to
  1000_00 bps per Spoke; User Risk Premium refreshed on borrow, withdraw, collateral changes, liquidation and
  `updateUserRiskPremium`, not on repay or supply; Governor can force an update; Dynamic Risk Configuration (new key on
  `addDynamicReserveConfig`, existing positions keep theirs; `updateDynamicReserveConfig` changes an existing key;
  rebinding blocks a health-decreasing action that the latest key would not allow); liquidation engine and its
  "Key Differences from Aave V3"; users cannot liquidate their own positions; frozen reserves can be liquidated.
- Docs (all fetched 13:15 to 13:20): https://aave.com/docs/aave-v4.md (Hub and Spoke, rates per Hub Asset, User Risk
  Premium, $1,000 dust rule), /positions.md (per-Spoke positions, "new borrows or collateral withdrawals are blocked if
  they would reduce the health factor below 1.0", Spoke isolation, 50% premium on 5% = 7.5%), /positions/borrow.md
  ("users can only borrow against collateral supplied to that same spoke"), /positions/conditions.md (when the premium
  and dynamic config update, `riskPremium.latest` lower than current means an update helps), /positions/liquidations.md
  (Dutch auction), /liquidity/spokes.md (deployed Ethereum Spokes, eSpoke names).

## 8. Worked liquidation example (arithmetic, `scratchpad/v4vs3/bin/liq.py`)

Position: 10 WETH, 12,000 USDC debt, USDC at $1. V3 Core: LT 84%, bonus 5%. V4 Main: CF 84%, max bonus 5.55%, bonus
factor 90%, HF for max bonus 0.90, target 1.24. Liquidation price for both: 12,000 ÷ (10 × 0.84) = $1,428.57.

| ETH    | HF    | Version | Bonus  | Most repaid in one call | Share | Collateral taken | Cost to you (bonus) | HF after | Debt left | Collateral left |
| ------ | ----- | ------- | ------ | ----------------------- | ----- | ---------------- | ------------------- | -------- | --------- | --------------- |
| $1,400 | 0.98  | V3      | 5%     | 6,000.00                | 50%   | 6,300.00         | 300.00              | 1.078    | 6,000.00  | 7,700.00        |
| $1,400 | 0.98  | V4      | 5.106% | 8,736.81                | 72.8% | 9,182.92         | 446.10              | 1.24     | 3,263.19  | 4,817.08        |
| $1,330 | 0.931 | V3      | 5%     | 12,000.00               | 100%  | 12,600.00        | 600.00              |          | 0         | 700.00          |
| $1,330 | 0.931 | V4      | 5.378% | 10,450.22               | 87.1% | 11,012.22        | 562.01              | 1.24     | 1,549.78  | 2,287.78        |

V3 at HF 0.98: above 0.95 and both legs above $2,000, so 50%. At 0.931: at or below 0.95, so 100%. V4 bonus at 0.98:
4.995% + (5.55% − 4.995%) × 0.02 ÷ 0.10 = 5.106%. V4 debt left 1,549.78 > $1,000, so the dust rule does not apply.

## 9. Migration and V3's future

- "[TEMP CHECK] Aave Will Win Framework", AaveLabs, 2026-02-12 (https://governance.aave.com/t/24055, first post read via
  `/t/24055/1.json`): "There is no need for a rushed, or forced, migration"; "users migrate at their own pace"; "V3
  parameters could be gradually adjusted to encourage migration"; "V3 remains open indefinitely for withdrawals";
  "V3 will run alongside V4 until further discussions are held by the DAO".
- No V3 to V4 migration tool in Aave's V4 docs index (https://aave.com/docs/llms.txt, fetched 13:19): the V4 pages cover
  supply, borrow, repay, withdraw, swaps within a position, position managers and liquidations.
- Moving between V4 Spokes: forum question "Migrate from V4 Main vault to Bluechip" (2026-07-04,
  https://governance.aave.com/t/25273) found no documented path. Not quoted in the post beyond "no one-step move".

## 10. Tokenping facts

| Fact                                                                                               | Source                                                                           |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Every V3 market on 21 networks (24 markets) and all 24 V4 Spokes on Ethereum, Avalanche, Arc, Base | `config/aaveConfig.ts` (`AAVE_MARKETS`, `AAVE_V4_SPOKES`), README "What it does" |
| One alert per V3 market or V4 Spoke; threshold 1.1 to 10; Signal, Telegram, email                  | README "Alerts"                                                                  |
| Checked every 5 minutes; repeats on every check while below the threshold                          | README "Checks every 5 minutes", "Limits"                                        |
| A new Spoke is read only once added to `AAVE_V4_SPOKES`                                            | README "Limits"                                                                  |
| Price from `<AlertPrice />`, paid on Arbitrum; beta, no uptime guarantee                           | README, existing guides                                                          |

Lido Spoke illustration (same script): 10 wstETH valued at 0.93 WETH each against 9 WETH of debt, CF 95.5%, flat 1%
bonus, target 1.0137: health factor 0.9868, at most 4.92 WETH repaid (54.7%, written "about 55%"), health factor after
1.0137. The post gives only the health factor and the share.
