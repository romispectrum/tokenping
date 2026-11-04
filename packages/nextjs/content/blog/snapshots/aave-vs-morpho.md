# Data snapshot: aave-vs-morpho

Every on-chain figure, API figure, contract rule and product fact in `content/blog/aave-vs-morpho.mdx`, written
2026-11-04. All times are UTC. On-chain reads used `cast` (Foundry) against https://ethereum-rpc.publicnode.com; API
reads used `curl`. No borrower's address is recorded here. The ScopeNote of this post (no `protocol`) renders the Aave
figures date (14 Oct 2026); every live figure in the article is dated 4 Nov 2026 in the text.

## 1. Blocks

| Block    | Time                | Used for                                                                              |
| -------- | ------------------- | ------------------------------------------------------------------------------------- |
| 26341682 | 2026-11-04 13:15:23 | Aave V3 Ethereum Core reserve parameters, E-Mode categories, USDC rate, Pool revision |
| 26341689 | 2026-11-04 13:16:47 | Aave V4 Main Spoke liquidation config, Morpho Blue owner, markets, LLTVs, IRM, oracle |

## 2. Aave V3 Ethereum Core (block 26341682)

PoolDataProvider `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD`, Pool `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`.

| Call                                                               | Result                                                                                               | Article                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `getReserveConfigurationData(WETH)`                                | decimals 18, LTV 8100, LT 8400, bonus 10500                                                          | WETH LTV 81%, threshold 84%, bonus 5%          |
| `getReserveConfigurationData(WBTC)`                                | decimals 8, LTV 8100, LT 8500, bonus 10500                                                           | WBTC threshold 85%, bonus 5%                   |
| `getReserveConfigurationData(USDC)`                                | decimals 6, LTV 0, LT 7800, bonus 10450                                                              | not used in the article                        |
| `getLiquidationProtocolFee(WETH / WBTC / USDC)`                    | 2000 each                                                                                            | protocol fee 20% of the bonus                  |
| `getEModeCategoryLabel(1)` / `getEModeCategoryCollateralConfig(1)` | "ETH correlated" / (9300, 9500, 10100)                                                               | LTV 93%, threshold 95%, bonus 1%               |
| `getEModeCategoryBorrowableBitmap(1)`                              | 1 (bit 0); `getReserveAddressById(0)` = WETH                                                         | WETH the only borrowable asset                 |
| `POOL_REVISION()`                                                  | 11                                                                                                   | V3.7 (matches the ScopeNote)                   |
| `getInterestRateStrategyAddress(USDC)`                             | `0x9ec6F08190DeA04A54f8Afc53Db96134e5E3FdFB`                                                         |                                                |
| strategy `getInterestRateDataBps(USDC)`                            | (9400, 0, 450, 1000)                                                                                 | optimal 94%, base 0, slope 1 4.5%, slope 2 10% |
| `getReserveData(USDC)`                                             | totalAToken 2306229338276650, totalVariableDebt 2184030105106865, variableBorrowRate 5.6683e25 (ray) | utilization 94.7%, borrow 5.67% a year         |

Addresses: WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`, WBTC `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`, USDC
`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`.

Worked example (prices illustrative: ETH $2,400, BTC $80,000, USDC $1; interest ignored): 10 × 2,400 × 0.84 = 20,160;
0.2 × 80,000 × 0.85 = 13,600; HF = 33,760 ÷ 20,000 = 1.688. BTC −40%: 0.2 × 48,000 × 0.85 = 8,160; HF = 28,320 ÷
20,000 = 1.416. WBTC at zero: 20,160 ÷ 20,000 = 1.008.

## 3. Aave V4

- Main Spoke `0x94e7A5dCbE816e498b89aB752661904E2F56c485`, `getLiquidationConfig()` at block 26341689: (1.24e18,
  0.9e18, 9000) → target health factor 1.24.
- Aave V4 API `https://api.v4.aave.com/graphql`, 13:19: `spokes(request:{query:{chainIds:[1,43114,5042,8453]}})`
  returned 24 Spokes: Ethereum 16, Avalanche 4, Arc 3, Base 1. `chains(request:{query:{filter:MAINNET_ONLY}})`
  returned Ethereum, Arc, Base, Avalanche.
- Tokenping's `AAVE_V4_SPOKES` (`config/aaveConfig.ts`, checked 16 Oct 2026) lists 20. The four the API lists that
  the config does not: Ethereum "RLUSD Yield" `0x9EbF0C19BF7dFE859820Cc09E846114b53814e52`, Ethereum "OUSD Yield"
  `0xbb97b61Ad6747D337E5805F2d159d275BB1f0828`, a second Ethereum "Bluechip" `0xA37e7cdC557f3C7f745FB3F337b6439979662c46`
  and Avalanche "Ethena Ecosystem" `0xaf22446124e566e54845f65b722E4dCbf12b650A`. The article therefore says Tokenping
  read "20 V4 Spokes", not "every Spoke". Update, same day: the four missing Spokes were added to
  `AAVE_V4_SPOKES` (now 24, matching the API), and the guide now reads "all 24 V4 Spokes".
- aave/aave-v4 `docs/overview.md` at `a3ef63ea6415d25237a9775bf66e76e9993561c2` (27 Oct 2026): dynamic risk
  configuration (new CF, max bonus and fee apply to new positions; snapshot refreshed on borrow, withdraw and disabling
  collateral; Governor can force updates), target health factor replacing the close factor, variable bonus,
  deficit elimination by another Spoke, "oracles are spoke-specific".
- aave.com/docs/aave-v4/positions: User Risk Premium from 0% to 1000%, example 50% on 5% = 7.5%.

## 4. Aave V3 source and docs

- aave-dao/aave-v3-origin `main` at `8305565ae342f1773c42cd2e4593f175fe5968a0` (9 Sep 2026): `LiquidationLogic.sol`
  `DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e4`, `CLOSE_FACTOR_HF_THRESHOLD = 0.95e18` (50% only while HF > 0.95),
  `MIN_BASE_MAX_CLOSE_FACTOR_THRESHOLD = 2000e8`, `executeEliminateDeficit`; `GenericLogic.sol` reads the current
  reserve configuration's liquidation threshold (so a change applies to every position); `ValidationLogic.sol`
  `require(!isPaused)`; `PoolConfigurator.sol` `MAX_GRACE_PERIOD = 4 hours`; `docs/3.2/Aave-v3.2-features.md` removes
  stable rate mode.
- aave-dao/aave-v3-risk-stewards README at `d45f2fe329ae6f5f38dea18fba750dfc9ace7bfa`: stewards can change caps, LTV,
  LT, bonus, rate parameters and E-Mode collateral params within `maxPercentChange` and `minDelay`.
- aave.com/docs/aave-v3/umbrella: Umbrella active only on Ethereum, for USDC, USDT, WETH and GHO.
- bgd-labs/aave-address-book `main` at `09ffd9eaa8dd1a11863de0aad62d0b56b0f96c81` (3 Nov 2026): `src/AaveV3*.sol`
  for 23 mainnet networks (Arbitrum, Avalanche, BNB, Base, Celo, Ethereum, Fantom, Gnosis, Harmony, Ink, Linea,
  Mantle, MegaETH, Metis, Monad, Optimism, Plasma, Polygon, Scroll, Soneium, Sonic, X Layer, ZKsync) → "more than 20".

## 5. Morpho Blue (Ethereum, block 26341689)

Morpho Blue `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`; `owner()` = `0xcBa28b38103307Ec8dA98377ffF9816C164f9AFa`.

`isLltvEnabled`: true for 0, 0.385, 0.625, 0.77, 0.86, 0.915, 0.945, 0.965, 0.98 (e18); false for 0.5, 0.9, 0.95, 0.99.
Matches docs.morpho.org/learn/concepts/blue ("Governance-approved" list).

| Market                                                                             | `idToMarketParams`                                                                                                            | Other reads                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| USDC / cbBTC `0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64`  | USDC, cbBTC, oracle `0xA6D6950c9F177F1De7f7757FB33539e3Ec60182a`, IRM `0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC`, LLTV 0.86 | `market`: supply 333210973054399, borrow 300927895393475 (utilization 90.31%); `rateAtTarget` 1575019366/s = 4.97% a year; `borrowRateView` 1722221126/s = 5.43% a year (APR, per second × 31,536,000) |
| USDC / WBTC `0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49`   | USDC, WBTC, oracle `0xDddd770BADd886dF3864029e4B377B5F6a2B6b83`, same IRM, LLTV 0.86                                          | listed (API)                                                                                                                                                                                           |
| USDC / WETH `0x94b823e6bd8ea533b4e33fbc307faea0b307301bc48763acc4d4aa4def7636cd`   | USDC, WETH, oracle `0x0F948CBa8231Db7898ef36A4212581Ad7b1B4580`, same IRM, LLTV 0.86                                          | listed (API), about 8.28M USD borrowed                                                                                                                                                                 |
| WETH / wstETH `0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e` | WETH, wstETH, oracle `0xbD60A6770b27E084E8617335ddE769241B0e71D8`, same IRM, LLTV 0.965                                       | listed (API)                                                                                                                                                                                           |

Listing check: Morpho API GraphQL `markets(where:{chainId_in:[1], listed:true, collateralAssetAddress_in:[…],
loanAssetAddress_in:[USDC]})`, 13:22-13:24.

Liquidation incentive, contract integer math `min(1.15, 1 ÷ (1 − 0.3 × (1 − LLTV)))`: 0.86 → 1.043841; 0.965 → 1.010611.

Worked example (same illustrative prices): WETH loan 24,000 × 0.86 ÷ 10,000 = 2.064; WBTC loan 16,000 × 0.86 ÷ 10,000 =
1.376; liquidation price 10,000 ÷ (0.2 × 0.86) = 58,139.53 (27.3% below 80,000); at 48,000: 9,600 × 0.86 ÷ 10,000 = 0.826.

## 6. Morpho source and docs

- morpho-org/morpho-blue at `b5b8bf77a09e724831206d693ed9f9471d67ed3b` (3 Nov 2026): `ConstantsLib.sol`
  `MAX_FEE = 0.25e18`, `LIQUIDATION_CURSOR = 0.3e18`, `MAX_LIQUIDATION_INCENTIVE_FACTOR = 1.15e18`; `Morpho.sol`
  owner-only functions `setOwner`, `enableIrm`, `enableLltv`, `setFee`, `setFeeRecipient` (none edits a market); bad
  debt subtracted from `totalBorrowAssets` and `totalSupplyAssets` (L390-401).
- morpho-org/morpho-blue-irm at `216214a6c98daef2018f394bf071076c7c0aeb1e` (2 Nov 2026), `ConstantsLib.sol`:
  `CURVE_STEEPNESS = 4`, `ADJUSTMENT_SPEED = 50/year`, `TARGET_UTILIZATION = 0.9`, `INITIAL_RATE_AT_TARGET = 4%`,
  `MIN_RATE_AT_TARGET = 0.1%`, `MAX_RATE_AT_TARGET = 200%`. "Doubles in about five days at 100% utilization" is the
  writer's derivation: error = 1, rate at target grows as e^(50t), ln 2 ÷ 50 years = 5.06 days.
- morpho-org/midnight at `137d083824d0bf07afcc7c9011674cb30036a147` (4 Nov 2026): `ConstantsLib.sol`
  `MAX_COLLATERALS = 128`, `MAX_COLLATERALS_PER_BORROWER = 16`, `TIME_TO_MAX_LIF = 60 minutes`; `Midnight.sol` post-maturity
  mode (liquidatable after maturity, LIF ramps from 1 to maxLif over `TIME_TO_MAX_LIF`), no debt increase after
  maturity.
- docs.morpho.org: Blue (five immutable parameters, permissionless creation, approved LLTVs and IRM), oracle (chosen
  by the market's creator, cannot be modified, defines the market's risk profile), Midnight (units, prices below 1,
  1 to 128 collaterals, APR quoting), interface listing policy (Morpho Association lists at its discretion; markets
  shown when a listed vault allocates to them; "a discovery decision"; unlisted contracts stay usable on-chain).
- help.morpho.org "Sunsetting Auto-deleverage" (dated 13 May 2026): no new positions; existing users should disable it.

## 7. Morpho API (4 Nov 2026)

- GraphQL `{ chains { id network } }` at 13:17: 14 chains (Ethereum, Base, Katana, HyperEVM, Arbitrum One, Polygon,
  Unichain, OP Mainnet, World Chain, Monad, Stable, Tempo Mainnet, Robinhood Chain, Arc). Matches `MORPHO_CHAINS`.
- `GET /v0/midnight/markets?chain_ids=<id>&listed=true&limit=5` at 13:17: data for 1 and 8453; empty for 5042, 4663
  and 4217 → listed Midnight markets on Ethereum and Base only.

## 8. Tokenping product facts (code, 4 Nov 2026)

| Fact                                                                                   | Where                                                                   |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Checks every 5 minutes                                                                 | `constants/notifications.ts` `NOTIFICATION_CHECK_INTERVAL_MINUTES`      |
| Aave threshold 1.1 to 10; Morpho down to 1.02                                          | `HEALTH_FACTOR_THRESHOLD_MIN/MAX`, `MORPHO_HEALTH_FACTOR_THRESHOLD_MIN` |
| 24 V3 markets on 21 networks, all 24 V4 Spokes on Ethereum, Avalanche, Arc and Base    | `config/aaveConfig.ts` (`AAVE_MARKETS`, `AAVE_V4_SPOKES`), README       |
| Morpho Blue on 14 networks, listed markets; Midnight where the API lists markets       | `config/morpho.ts`, README                                              |
| Pre-liquidation measured against the earlier line; Midnight reminders 7 days and 1 day | README "Morpho"                                                         |
| Same paid access covers Aave and Morpho; channels Signal, Telegram, email              | README                                                                  |
