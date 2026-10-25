# Data snapshot: aave-interest-rates

Every on-chain, API and dated off-chain figure used in `content/blog/aave-interest-rates.mdx` and its Czech translation
`content/blog/cs/urokove-sazby-aave.mdx`, with the call, the block and the source. All times are UTC. Reads were made on
2026-10-25 with viem (research scripts) against `https://ethereum-rpc.publicnode.com` and the Arbitrum public RPC, and the
historical blocks with `eth_call` against `https://eth.drpc.org` (archive) and logs from `https://mainnet.gateway.tenderly.co`;
the writer re-read the USDC and GHO parameters, the 25 Oct rates and the 14 Oct peak with `cast` 1.1.0 against
`https://eth.drpc.org`, with identical results. The ScopeNote date (14 Oct 2026) is shared by every post, so the figures
here carry their own blocks and dates in the text.

## Contracts

| Contract | Address | How it was found |
| --- | --- | --- |
| Ethereum Core Pool | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | `config/aaveConfig.ts` |
| Ethereum Core interest rate strategy (one per Pool since v3.4) | `0x9ec6F08190DeA04A54f8Afc53Db96134e5E3FdFB` | `Pool.RESERVE_INTEREST_RATE_STRATEGY()` at block 26269328 |
| Ethereum Core PoolDataProvider | `0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD` | as in the other snapshots |
| Arbitrum interest rate strategy | `0x429F16dBA3B9e1900087Cbaa7b50D38Bc60fB73F` | `Pool.RESERVE_INTEREST_RATE_STRATEGY()` at block 518125419 |
| GHO steward (GhoAaveSteward) | `0x98217A06721Ebf727f2C8d9aD7718ec28b7aAe34` | `updateGhoBorrowRate`, called by its `RISK_COUNCIL` (a 2-of-3 Safe) |

Assets: USDC `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`, USDT `0xdAC17F958D2ee523a2206206994597C13D831ec7`, WETH
`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`, GHO `0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f`, Arbitrum native USDC
`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`.

## 1. Parameters and rates, 25 Oct 2026

Ethereum block **26269328** (2026-10-25 11:15:23), Arbitrum block **518125419** (11:16:02). Parameters from
`strategy.getInterestRateDataBps(asset)` (optimal usage, base, slope 1, slope 2, in bps); reserve factor from
`PoolDataProvider.getReserveConfigurationData`; rates from `PoolDataProvider.getReserveData` fields 6 (liquidityRate) and 7
(variableBorrowRate), ray ÷ 1e25 = % APR. Utilization = total variable debt ÷ (virtual balance + debt), as the contract and the
Aave API compute it.

| Asset | Params (bps) | RF | Utilization | Borrow APR | Supply APR |
| --- | --- | --- | --- | --- | --- |
| Core USDC | 9400 / 0 / 450 / 1000 | 10% | 93.7195% | 4.4866% (44865708859592526719849450) | 3.7843% (37843118406287690557194882) |
| Core USDT | 9200 / 0 / 450 / 1000 | 10% | 87.8114% | 4.2951% | 3.3944% |
| Core WETH | 9200 / 0 / 220 / 600 | 15% | 81.3125% | 1.9444% | 1.3114% |
| Core GHO | 9900 / 450 / 0 / 0 | 100% | (not used) | 4.5000% (45000000000000000000000000) | 0 |
| Arbitrum USDC | 9000 / 0 / 400 / 1000 | 10% | 77.3231% | 3.4366% | 2.3915% |

Cross-check: Aave API `https://api.v3.aave.com/graphql` at 11:27 UTC gave USDC borrow APY 0.0458874 and utilization 0.937194
on Ethereum Core, Arbitrum USDC 0.0349645. Note (not printed): WETH carries a reserve deficit, so its supply-side usage ratio is
lower than its borrow usage ratio; the guide's supply example uses USDC.

## 2. The 14 Oct 2026 USDC spike (Ethereum Core)

| Block (time, UTC) | Utilization | variableBorrowRate (% APR) | Event |
| --- | --- | --- | --- |
| 26194052 (2026-10-14 23:32:47) | 93.9211% | 4.4962% | before |
| 26194053 (23:32:59) | 99.5016% | 13.6693% | Withdraw 133,898,000 USDC by `0x56957E411Ea83a0B4A0689C1fB0D1e5eA0d20149`, tx `0x70edabcd3af0b2abfad001fc59ec61fc1cf192d16e261004102aed8c522c0e5e` |
| 26194088 (23:39:59) | about 99.81% (derived from the rate) | 14.1846% (141846412485223274182280950) | highest rate in the window; re-read by the writer |
| 26194230 (2026-10-15 00:08:23) | 99.7638% | 14.1063% | |
| 26194231 (00:08:35) | 94.1570% | 4.7617% | Supply 133,898,000 USDC by the same address, tx `0x5fd4ae8285ef710dd30599998684f6a098f76146c8f091e0d89ffadd148171e4` |

The curve formula with 9400/0/450/1000 reproduces each rate from its utilization (recomputed with Python `decimal`).
These blocks also back the existing guide `why-aave-health-factor-dropped` (Cause 3), whose wording was corrected on
2026-10-25 to say the rate reached 14.18% within seven minutes.

## 3. Worked arithmetic (Python, recomputed by the writer)

- Curve, USDC Core: 50% 2.3936%, 80% 3.8298%, 90% 4.3085%, 94% 4.5000%, 95% 6.1667%, 96% 7.8333%, 98% 11.1667%, 100% 14.5000%.
- Supply: 4.4866% × 0.937195 × 0.9 = 3.7843%.
- APY: (1 + 0.044865708859592527 ÷ 31,536,000)^31,536,000 − 1 = 4.5887%; at 14% APR, 15.03%.
- Health factor example: 10 WETH, LT 83% (14 Oct 2026 read, `why-aave-health-factor-dropped` snapshot), illustrative $2,400,
  12,000 USDC debt: 1.66. Debt grows by e^(rate × t), WETH by e^(1.3114% × t):
  36 minutes at 4.4866% +0.037 USDC, at 14% +0.115 USDC (HF 1.66); 30 days at 4.4866% 1.6557, at 14.5% 1.6421;
  one year at 4.4866% 1.6081, at 14.5% 1.4549.

## 4. Web and code sources (fetched 2026-10-25)

| Claim | Source |
| --- | --- |
| Piecewise formula, usage ratio D ÷ (V + D), supply rate × (1 − RF), deficit on the supply side | `DefaultReserveInterestRateStrategyV2.sol`, `ReserveLogic.sol` (aave-v3-origin main) |
| Rates recalculated on each action, interest accrues per second in between | `ReserveLogic.updateInterestRatesAndVirtualBalance`, `MathUtils.sol` |
| Risk Stewards may change base, slope 1, slope 2 and optimal point, capped per update, with a minimum delay | `aave-dao/aave-v3-risk-stewards` README |
| APR to APY | `aave-utilities` `calculateCompoundedRate` (interface uses `@aave/math-utils` 1.38.0) |
| Debt swap markets (listed: Ethereum Core, Prime, EtherFi, Arbitrum, Avalanche, Base, BNB, Optimism, Polygon, Gnosis, Sonic; not: Metis, Scroll, ZKsync, Celo, Soneium, Linea, Plasma, Ink; Horizon not listed) | `aave.com/docs/aave-v3/smart-contracts/swap-features.md` |
| GHO: steward limits 500 bps per update, 1 day minimum delay; last change block 26114552 (2026-10-03 21:37:59) 425 to 450 bps; 44 `RateDataUpdate` events since 2024-11-07, base between 300 and 1450 bps | GhoAaveSteward contract, strategy `RateDataUpdate` logs; TokenLogic forum post, 2 Oct 2026 |
| stkAAVE discount removed in v3.4; `getDiscountRateStrategy()` and `getDiscountToken()` on vGHO revert | `docs/3.4/Aave-v3.4-features.md`; on-chain |
| Stable rate fully deprecated (BGD, 31 Jan 2024, after a 4 Nov 2023 bug report); code removed in v3.2; never enabled on V3 Ethereum | governance forum; `docs/3.2/Aave-v3.2-features.md` |
| V4: curve "configured per hub asset"; User Risk Premium a surcharge on the shared rate, 0% to 1000%, example 50% on 5% = 7.5% | `aave.com/docs/aave-v4.md`, `aave.com/docs/aave-v4/positions.md`. One V4 page (`liquidity.md`) says Spokes define interest rate models; the guide follows the overview and positions pages. Not checked on-chain. |
