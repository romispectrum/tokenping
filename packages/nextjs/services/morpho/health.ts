import { type Address, type ContractFunctionParameters, type Hex, isAddressEqual, zeroAddress } from "viem";
import type { MorphoChain } from "~~/config/morpho";
import {
  MORPHO_BLUE_ABI,
  MORPHO_IRM_ABI,
  MORPHO_MIDNIGHT_ABI,
  MORPHO_ORACLE_ABI,
  MULTICALL3_BLOCK_ABI,
} from "~~/services/morpho/abis";
import type { MorphoClient } from "~~/services/morpho/client";
import {
  NO_DEBT_HEALTH_FACTOR,
  accrueTotalBorrowAssets,
  collateralValue,
  healthFactorWad,
  maxBorrowAt,
  midnightMaxDebt,
  toAssetsUp,
} from "~~/services/morpho/math";
import type { BlueMarketParams, MidnightMarketParams, MorphoReading } from "~~/services/morpho/types";

// A borrower's health on Morpho, computed from the chain the way the contracts decide liquidations: Blue's _isHealthy
// (interest accrued to the block, shares rounded up) and Midnight's isHealthy. A price that cannot be read makes the
// health unknown (null), never 0 and never safe, unless there is no debt to price.

type Result<T> = { status: "success"; result: T } | { status: "failure"; error: Error };

const ok = <T>(result: Result<unknown> | undefined) =>
  result?.status === "success" ? (result.result as T) : undefined;

const multicall3 = (client: MorphoClient) => client.chain.contracts?.multicall3?.address as Address;

type BlueMarketState = readonly [bigint, bigint, bigint, bigint, bigint, bigint];

/** Health of a Morpho Blue borrow position; null when a needed read fails. */
export const readBlueHealth = async (
  client: MorphoClient,
  chain: MorphoChain,
  marketId: Hex,
  user: Address,
  params: BlueMarketParams,
): Promise<MorphoReading | null> => {
  const { preLiquidations } = params;
  const contracts: ContractFunctionParameters[] = [
    { address: chain.blue, abi: MORPHO_BLUE_ABI, functionName: "position", args: [marketId, user] },
    { address: chain.blue, abi: MORPHO_BLUE_ABI, functionName: "market", args: [marketId] },
    { address: params.oracle, abi: MORPHO_ORACLE_ABI, functionName: "price" },
    { address: multicall3(client), abi: MULTICALL3_BLOCK_ABI, functionName: "getCurrentBlockTimestamp" },
    ...preLiquidations.flatMap(({ address, oracle }) => [
      { address: chain.blue, abi: MORPHO_BLUE_ABI, functionName: "isAuthorized", args: [user, address] },
      { address: oracle, abi: MORPHO_ORACLE_ABI, functionName: "price" },
    ]),
  ];
  const results = (await client.multicall({ allowFailure: true, contracts })) as Result<unknown>[];

  const position = ok<readonly [bigint, bigint, bigint]>(results[0]);
  const market = ok<BlueMarketState>(results[1]);
  const timestamp = ok<bigint>(results[3]);
  if (!position || !market || timestamp === undefined) return null;

  const [, borrowShares, collateral] = position;
  if (borrowShares === 0n)
    return {
      healthFactor: NO_DEBT_HEALTH_FACTOR,
      line: "lltv",
      debt: 0n,
      collateralValue: 0n,
      timestamp: Number(timestamp),
    };

  const price = ok<bigint>(results[2]);
  if (price === undefined) return null;

  const [totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares, lastUpdate, fee] = market;
  const elapsed = timestamp > lastUpdate ? timestamp - lastUpdate : 0n;
  let borrowRate = 0n;
  if (!isAddressEqual(params.irm, zeroAddress) && elapsed > 0n && totalBorrowAssets > 0n) {
    try {
      borrowRate = await client.readContract({
        address: params.irm,
        abi: MORPHO_IRM_ABI,
        functionName: "borrowRateView",
        args: [
          {
            loanToken: params.loanToken.address,
            collateralToken: params.collateralToken.address,
            oracle: params.oracle,
            irm: params.irm,
            lltv: BigInt(params.lltv),
          },
          { totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares, lastUpdate, fee },
        ],
      });
    } catch {
      return null;
    }
  }

  const borrowed = toAssetsUp(
    borrowShares,
    accrueTotalBorrowAssets(totalBorrowAssets, borrowRate, elapsed),
    totalBorrowShares,
  );
  let healthFactor = healthFactorWad(maxBorrowAt(collateral, price, BigInt(params.lltv)), borrowed);
  let line: MorphoReading["line"] = "lltv";

  // A pre-liquidation the borrower authorised can start before the LLTV, priced by its own oracle: alert on the lower line.
  // Not knowing whether it is authorised, or its price when it is, gives no reading: the LLTV line alone could read safe
  // while the position is being pre-liquidated.
  for (const [index, { preLltv }] of preLiquidations.entries()) {
    const authorised = ok<boolean>(results[4 + index * 2]);
    if (authorised === undefined) return null;
    if (!authorised) continue;
    const prePrice = ok<bigint>(results[5 + index * 2]);
    if (prePrice === undefined) return null;
    const preHealthFactor = healthFactorWad(maxBorrowAt(collateral, prePrice, BigInt(preLltv)), borrowed);
    if (preHealthFactor < healthFactor) {
      healthFactor = preHealthFactor;
      line = "pre-liquidation";
    }
  }

  return {
    healthFactor,
    line,
    debt: borrowed,
    collateralValue: collateralValue(collateral, price),
    timestamp: Number(timestamp),
  };
};

/** Health of a Morpho Midnight borrow position; null when a needed read fails. */
export const readMidnightHealth = async (
  client: MorphoClient,
  chain: MorphoChain,
  marketId: Hex,
  user: Address,
  params: MidnightMarketParams,
): Promise<MorphoReading | null> => {
  if (!chain.midnight) return null;
  const midnight = chain.midnight;
  const firstRound: ContractFunctionParameters[] = [
    { address: midnight, abi: MORPHO_MIDNIGHT_ABI, functionName: "debt", args: [marketId, user] },
    { address: midnight, abi: MORPHO_MIDNIGHT_ABI, functionName: "collateralBitmap", args: [marketId, user] },
    { address: multicall3(client), abi: MULTICALL3_BLOCK_ABI, functionName: "getCurrentBlockTimestamp" },
  ];
  const first = (await client.multicall({ allowFailure: true, contracts: firstRound })) as Result<unknown>[];

  const debt = ok<bigint>(first[0]);
  const bitmap = ok<bigint>(first[1]);
  const timestamp = ok<bigint>(first[2]);
  if (debt === undefined || bitmap === undefined || timestamp === undefined) return null;
  if (debt === 0n)
    return {
      healthFactor: NO_DEBT_HEALTH_FACTOR,
      line: "lltv",
      debt: 0n,
      collateralValue: 0n,
      timestamp: Number(timestamp),
    };

  const indexes = params.collaterals.flatMap((_, index) => ((bitmap >> BigInt(index)) & 1n ? [index] : []));
  // A collateral the stored parameters don't know means they are stale: no number rather than a wrong one.
  if (bitmap >> BigInt(params.collaterals.length) !== 0n) return null;

  const second = (await client.multicall({
    allowFailure: true,
    contracts: indexes.flatMap(index => [
      {
        address: midnight,
        abi: MORPHO_MIDNIGHT_ABI,
        functionName: "collateral",
        args: [marketId, user, BigInt(index)],
      },
      { address: params.collaterals[index].oracle, abi: MORPHO_ORACLE_ABI, functionName: "price" },
    ]),
  })) as Result<unknown>[];

  const collaterals = indexes.map((index, position) => ({
    amount: ok<bigint>(second[position * 2]),
    price: ok<bigint>(second[position * 2 + 1]),
    lltv: BigInt(params.collaterals[index].lltv),
  }));
  if (collaterals.some(({ amount, price }) => amount === undefined || price === undefined)) return null;
  const priced = collaterals as { amount: bigint; price: bigint; lltv: bigint }[];

  return {
    healthFactor: healthFactorWad(midnightMaxDebt(priced), debt),
    line: "lltv",
    debt,
    collateralValue: priced.reduce((sum, { amount, price }) => sum + collateralValue(amount, price), 0n),
    timestamp: Number(timestamp),
  };
};
