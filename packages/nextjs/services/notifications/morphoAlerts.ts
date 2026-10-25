import type { Address, Hex } from "viem";
import { type MorphoChain, getMorphoChain } from "~~/config/morpho";
import { type MorphoProtocol, isMorphoProtocol } from "~~/config/protocols";
import { type MorphoClient, createMorphoClientCache } from "~~/services/morpho/client";
import { readBlueHealth, readMidnightHealth } from "~~/services/morpho/health";
import { isStoredMarketParams } from "~~/services/morpho/storedParams";
import type { MorphoMarketParams, MorphoReading } from "~~/services/morpho/types";
import { type NotificationConfigRow, rowMarketRef } from "~~/services/notifications/configRepository";
import { isBelowMorphoThreshold } from "~~/services/notifications/morphoMessages";

// What the cron needs to check a Morpho alert, and the reads themselves. Health comes from the chain only (never from
// Morpho's API), with the market parameters stored when the alert was saved.

/** A saved Morpho alert ready to read: its chain, its market and the stored parameters, checked. */
export type MorphoAlert<Row> = {
  row: Row;
  protocol: MorphoProtocol;
  chain: MorphoChain;
  marketId: Hex;
  params: MorphoMarketParams;
};

/**
 * The Morpho alert a row holds, or null when it cannot be read: not a Morpho row, a chain Tokenping does not cover, or
 * stored parameters that are not this protocol's.
 */
export const toMorphoAlert = <
  Row extends Pick<NotificationConfigRow, "chain_id" | "protocol" | "market" | "market_params">,
>(
  row: Row,
): MorphoAlert<Row> | null => {
  const ref = rowMarketRef(row);
  if (!ref || !isMorphoProtocol(ref.protocol)) return null;
  const chain = getMorphoChain(ref.chainId);
  if (!chain || (ref.protocol === "morpho-midnight" && !chain.midnight)) return null;
  if (!isStoredMarketParams(ref.protocol, row.market_params)) return null;
  return { row, protocol: ref.protocol, chain, marketId: ref.market as Hex, params: row.market_params };
};

/** One health reading of `user`'s position in the alert's market; null when it cannot be read. */
export const readMorphoHealth = (
  client: MorphoClient,
  { chain, marketId, params }: MorphoAlert<unknown>,
  user: Address,
): Promise<MorphoReading | null> =>
  params.kind === "blue"
    ? readBlueHealth(client, chain, marketId, user, params)
    : readMidnightHealth(client, chain, marketId, user, params);

export type MorphoNotice =
  | { kind: "health" }
  /** `maturity` is the loan's, in unix seconds. */
  | { kind: "maturity"; stage: "7d" | "1d" | "matured"; maturity: number };

const DAY_SECONDS = 86_400;

/**
 * What a reading calls for. Nothing without debt. A Midnight loan past maturity gets the maturity alert on every check
 * instead of the health alert, since it can be liquidated whatever its health factor. Before maturity, the health
 * alert as on Blue, and the reminder of the window the loan is in (7 days to 1 day before, then the last day), which
 * the caller sends once. Time is the block's, as the contract sees it.
 */
export const morphoNotices = (
  params: MorphoMarketParams,
  reading: MorphoReading,
  threshold: number,
): MorphoNotice[] => {
  if (reading.debt === 0n) return [];
  const notices: MorphoNotice[] = [];
  if (params.kind === "midnight") {
    const { maturity } = params;
    const secondsLeft = maturity - reading.timestamp;
    if (secondsLeft <= 0) return [{ kind: "maturity", stage: "matured", maturity }];
    if (isBelowMorphoThreshold(reading, threshold)) notices.push({ kind: "health" });
    if (secondsLeft <= DAY_SECONDS) notices.push({ kind: "maturity", stage: "1d", maturity });
    else if (secondsLeft <= 7 * DAY_SECONDS) notices.push({ kind: "maturity", stage: "7d", maturity });
    return notices;
  }
  return isBelowMorphoThreshold(reading, threshold) ? [{ kind: "health" }] : [];
};

/** How many positions are read at once on one chain. */
const READ_CONCURRENCY = 4;

/** A position not read before the deadline: the next run reads it. */
export const TIMED_OUT = "timeout";

const beforeDeadline = <T>(promise: Promise<T>, deadline: number) =>
  new Promise<T | typeof TIMED_OUT | null>(resolve => {
    const timer = setTimeout(() => resolve(TIMED_OUT), Math.max(0, deadline - Date.now()));
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });

/**
 * Reads every alert's position, in the order given: chains in parallel, READ_CONCURRENCY positions at a time on each,
 * until `deadline` (epoch ms). Each result is a reading, null when the position could not be read, or TIMED_OUT.
 */
export async function readMorphoPositions<Row extends { user_id: string }>(
  alerts: readonly MorphoAlert<Row>[],
  deadline: number,
  clientFor: (chain: MorphoChain["chain"]) => MorphoClient = createMorphoClientCache(1),
) {
  const results: (MorphoReading | null | typeof TIMED_OUT)[] = alerts.map(() => TIMED_OUT);
  const byChain = new Map<number, number[]>();
  alerts.forEach(({ chain }, index) => byChain.set(chain.chain.id, [...(byChain.get(chain.chain.id) ?? []), index]));

  await Promise.all(
    [...byChain.values()].map(indexes => {
      let next = 0;
      const worker = async () => {
        while (next < indexes.length) {
          const index = indexes[next++];
          if (Date.now() >= deadline) continue;
          const alert = alerts[index];
          results[index] = await beforeDeadline(
            readMorphoHealth(clientFor(alert.chain.chain), alert, alert.row.user_id as Address),
            deadline,
          );
        }
      };
      return Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, indexes.length) }, worker));
    }),
  );
  return results;
}
