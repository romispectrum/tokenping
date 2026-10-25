# Data snapshot: aave-market-wind-down

Every on-chain figure, governance date and quoted claim in `content/blog/aave-market-wind-down.mdx` and its Czech
translation `content/blog/cs/ukonceni-trhu-aave.mdx`, written 2026-10-25. All times are UTC. A research pass read every
reserve with viem (scripts and raw output kept outside the repo); the writer then re-read every reserve of the five markets
with `cast` 1.1.0 and found the same values. Governance threads were read on governance.aave.com (each thread's text saved
when read) and the AIPs on vote.onaave.com. The ScopeNote date (14 Oct 2026) is shared by every post, so the figures here
carry their own date in the text.

## 1. Contracts

| Market | Pool | PoolDataProvider | RPC used by the writer |
| --- | --- | --- | --- |
| Scroll | `0x11fCfe756c05AD438e312a7fd934381537D3cFfe` | `0xBEa2B648f05887eCbF1d115da8b7E4A317975A51` | scroll-rpc.publicnode.com |
| ZKsync | `0x78e30497a3c7527d953c6B1E3541b021A98Ac43c` | `0x9057ac7b2D35606F8AD5aE2FCBafcD94E58D9927` | mainnet.era.zksync.io |
| Metis | `0x90df02551bB792286e8D4f13E0e357b4Bf1D6a57` | `0x602BeF1d4c381e5a29f0C562A310416A73D8Be19` | metis-rpc.publicnode.com |
| Soneium | `0xDd3d7A7d03D9fD9ef45f3E587287922eF65CA38B` | `0x4a24b44b252db149B5B9BCec4dc3c2752807d626` | soneium-rpc.publicnode.com; rpc.soneium.org and soneium.drpc.org for January |
| Sonic | `0x5362dBb1e601abF3a4c14c22ffEdA64042E5eAA3` | `0xc0a344397cfa89dF1e1d3e4fb330834D789cF2CD` | sonic-rpc.publicnode.com |

Addresses from `config/aaveConfig.ts`.

## 2. State on 25 Oct 2026 (writer's `cast` reads)

Calls: `Pool.getReservesList()`, `Pool.POOL_REVISION()`, `PoolDataProvider.getReserveConfigurationData(asset)` (ltv, lt,
reserveFactor, isActive, isFrozen), `getPaused(asset)`, `getReserveCaps(asset)`, `getReserveData(asset)` (field 7,
variableBorrowRate, ray ÷ 1e25 = % APR; fields 3 and 5, total aToken and variable debt), `Pool.getVirtualUnderlyingBalance`
and `Pool.getReserveDeficit`.

| Market | Block (time) | POOL_REVISION | Every reserve |
| --- | --- | --- | --- |
| Scroll | 35492432 (11:51:54) | 11 (v3.7) | active, frozen, not paused, LTV 0, caps 1/1 |
| ZKsync | 72632724 (11:52:58) | 10 (v3.6) | same |
| Metis | 23321705 (11:53:56) | 10 (v3.6) | same |
| Soneium | 29897280 (11:55:11) | 10 (v3.6) | same |
| Sonic | 81600241 (11:55:39) | 11 (v3.7) | same |

Revision 10 is v3.6 and 11 is v3.7 (`PoolInstance.sol` at the v3.6.0 and v3.7.0 tags of aave-v3-origin).

Per reserve, liquidation threshold / reserve factor / variable borrow APR:

- Scroll: WETH 83 / 99 / 5.11%, USDC 78 / 99 / 8.26%, wstETH 79 / 99 / 5.15%, weETH 75 / 99 / 6.12%, SCR 0 / 99 / 20.05%.
- ZKsync: USDC 78 / 99 / 50.00% (virtual balance 0; aToken supply 118,314.61 USDC, debt 106,508.46 USDC; deficit
  13,990.46 USDC; strategy `0x57815Ab06D846d7dECd326Ee541CD06144FED237`, `getInterestRateDataBps` = 9000 / 500 / 500 / 4000),
  USDT 78 / 99 / 9.85%, WETH 78 / 99 / 5.05%, wstETH 76 / 99 / 5.02%, ZK 45 / 99 / 5.01%; unborrowed: weETH (RF 45%),
  sUSDe (RF 20%), wrsETH (RF 10%).
- Metis: m.DAI 77 / 99 / 5.14%, METIS 40 / 99 / 5.05%, m.USDC 83 / 99 / 6.85%, m.USDT 78 / 99 / 5.12%, WETH 83 / 99 / 5.15%.
- Soneium: WETH 83 / 99 / 5.11%, USDC.e 78 / 99 / 10.11%, USDT 78 / 99 / 6.88%.
- Sonic: WETH 83 / 99 / 5.08%, USDC 78 / 99 / 18.31% (virtual balance 41,264.88 USDC, aToken supply 1,390,744.35 USDC,
  debt 1,253,229.94 USDC, utilization 96.81%; deficit 96,547.57 USDC; strategy parameters 9000 / 500 / 650 / 1000, which give
  18.31% at that utilization), wS 70 / 99 / 5.58%; unborrowed: stS (RF 10%).

USD totals in the article (supplied / borrowed): Scroll $1.90M / $260k, ZKsync $837k / $135k, Metis $292k / $24k,
Soneium $115k / $24k, Sonic $7.30M / $1.63M, from the research pass with Aave oracle prices at Scroll block 35492284
(11:34:37), ZKsync 72632558 (11:35:19), Metis 23321661 (11:35:51), Soneium 29896718 (11:36:27) and Sonic 81599311
(11:36:41), minutes before the writer's reads.

## 3. No threshold cut since January 2026

Liquidation thresholds at the first block at or after 2026-01-15 00:00 UTC on each chain equal the 25 Oct values above:
Scroll block 28096978, ZKsync 67752157, Metis 21963710 and Sonic 60404701 (research pass); Soneium block 17650225
(2026-01-15 00:00:01, read by the writer against rpc.soneium.org and soneium.drpc.org: WETH 8300, USDC.e 7800, USDT 7800).
LTVs and reserve factors did change (the freezes set LTV 0; AIP 470 and AIP 521 raised reserve factors).

## 4. Health factor example (Python, writer)

ZKsync WETH threshold 78%, illustrative $2,400, 10 WETH against 12,000 USDC: HF 1.56. Debt × e^(0.50 × t), collateral
earnings ignored (99% reserve factor): 30 days 1.4972, 90 days 1.3791, 180 days 1.2191, 365 days 0.9462; crosses 1.00 after
ln(1.56) ÷ 0.5 = 0.889 years, about 325 days.

## 5. Governance timeline

| Date (UTC) | Event | Source |
| --- | --- | --- |
| 2025-09-11 | ACI Direct-to-AIP: Scroll reserve factor 50%, caps cut, "governance instability within the Scroll ecosystem" | governance thread 23113 |
| 2025-11-19 | TEMP CHECK "Focussing the Aave V3 Multichain Strategy" (ACI): wind down zkSync, Metis and Soneium; "lack product market fit", "annualized revenue of approximately $3,000-50,000"; Snapshot passed 2025-12-05 | thread 23434 |
| 2026-01-29 | ARFC Phase 1 (ACI); Snapshot passed 2026-02-08 | thread 23954 |
| 2026-02-10 | Chaos Labs risk stewards: broad cap reduction across underutilized instances incl. zkSync, Metis, Soneium, Sonic | thread 24037 |
| 2026-02-27 / 03-03 | AIP 451 executed: Soneium 19:45:09, ZKsync 20:23:54 (payload only set LTV 0, per BGD on 2026-02-24), Metis 2026-03-03 12:07:08; ZKsync USDC and WETH first read frozen at block 68827013 (2026-02-28 16:48:06) | vote.onaave.com 451 |
| 2026-04-10 | LlamaRisk risk stewards: Scroll caps to 1; TVL "from approximately $227M to $23.3M" in 7 days after ether.fi moved to OP Mainnet; loopers at "~1.00-1.05" | thread 24430 |
| 2026-04-20 | AIP 470 executed on Scroll 07:15:39: all reserves frozen, RF 85% (WETH 50%); AIP 473 the same day moved Scroll and Sonic to v3.7 | vote.onaave.com 470, 473; thread 24432 |
| 2026-07-29 | LlamaRisk ARFC "Low Adoption Asset Deprecation on Aave V3": whole-market deprecation of Sonic, Scroll, zkSync, Metis, Soneium and Aptos; Sonic deposits "fallen from $28.9M to $7.6M", "under $5k per quarter"; sequence: RF and rates, then "the IRM curves are increased", "the Liquidation Threshold can be gradually reduced", then oracles "fixing each feed so the market can be retired completely" | thread 25401 |
| 2026-09-20 | AIP 521 executed: Metis 15:06:55, Soneium 15:07:25, Scroll 15:25:34, ZKsync 15:25:42, Sonic 15:27:26; frozen, caps 1, borrowed reserves RF 99% and base rate 5% | vote.onaave.com 521 |
| 2026-10-12 | AIP 526 executed on Scroll 11:35:36: SCR price fixed at $0.0335, SCR rate model 20% base, 40% slope 2 | vote.onaave.com 526 |

## 6. Mechanics (aave-v3-origin `main` at 8305565, matching the v3.7.0 tag; v3.6.0 behaves the same for these checks)

- `ValidationLogic.sol`: supply and borrow `require(!isFrozen)`; withdraw, repay (also with aTokens), collateral toggle and
  liquidation check only active and not paused; `validateHFAndLtvzero` keeps the health factor at 1 or more on withdrawals
  and collateral disables; borrowing needs a non-zero LTV.
- `IPoolConfigurator.sol`: a frozen reserve "allows repayments, liquidations, rate rebalances and withdrawals" and sets LTV 0;
  a paused reserve allows no interaction.

## 7. Precedents

| Claim | Source |
| --- | --- |
| Fantom V3: ARC 2 Aug 2022, "~30$ of daily fees for the Aave treasury"; Guardian freeze confirmed by BGD 16 Sep 2022, allowing only withdrawals, repayments and liquidations | thread 9166 |
| Harmony V3: frozen after the Horizon bridge exploit (ARC 13 Jul 2022); users can "withdraw according to available liquidity" (5 Dec 2022) | thread 8863 |
| V2 Ethereum and Polygon: deprecation plan with stepwise LT reductions (18 Sep 2023); Chaos Labs 14 Dec 2023: "111 total accounts amounting to ~$110K are at risk of liquidation on Ethereum, and 64 total accounts amounting to ~10.8K … on Polygon" | threads 14870, 15747 |
| V2 Polygon and Avalanche: frozen by AIP 333 (executed 2025-07-01); Aug 2025 ARFC: RF 85%, base rates 5%, "stronger economic incentives to migrate"; Mar 2026 Chaos Labs ARFC: "uniform 4% LT reduction across all collateral assets on Ethereum", matching LT reductions on Avalanche and Polygon, higher liquidation bonus for collateral tied to hardcoded stablecoin prices. Which AIP executed the March 2026 changes was not verified, so the guide says "proposed" | threads 22445, 23008, 24351 |

## 8. Leaving

Repay works on a frozen reserve and is the only way left to raise a health factor (supply is blocked). The Aave docs' swap
features page lists repay with collateral and debt swap for Sonic, not for Metis, Scroll, ZKsync or Soneium
(`aave.com/docs/aave-v3/smart-contracts/swap-features.md`, fetched 2026-10-25); the guide states the listing only. No Aave
post found mentions bridging out of these networks.
