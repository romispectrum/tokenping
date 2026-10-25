import type { Address, Hex } from "viem";
import { type MorphoChain, getMorphoChain } from "~~/config/morpho";
import { type MorphoProtocol, marketRefKey } from "~~/config/protocols";
import type { MorphoPositionRef } from "~~/services/morpho/api";
import { type MorphoClient, createMorphoClient } from "~~/services/morpho/client";
import { readBlueHealth, readMidnightHealth } from "~~/services/morpho/health";
import { readBlueMarketParams, readMidnightMarketParams } from "~~/services/morpho/params";
import type { MorphoMarketParams, MorphoReading } from "~~/services/morpho/types";

// One Morpho position as the dashboard shows it, read in the browser with the same readers the cron uses, so the page
// shows the number the alerts are checked against.

export type MorphoPosition = {
  /** marketRefKey: "morpho-blue:8453:0x3a85...". */
  key: string;
  protocol: MorphoProtocol;
  chain: MorphoChain;
  marketId: Hex;
  /** Null when the market cannot be read on its chain. */
  params: MorphoMarketParams | null;
  /** Null without params, or when the position cannot be read. */
  reading: MorphoReading | null;
};

/** The key of a found position or a saved alert's market, as the alert API keys configs. */
export const morphoRefKey = ({
  protocol,
  chainId,
  marketId,
}: Pick<MorphoPositionRef, "protocol" | "chainId" | "marketId">) =>
  marketRefKey({ protocol, chainId, market: marketId });

/**
 * Reads the market and `user`'s position in it. Throws when the chain cannot be reached, so the dashboard can offer to
 * try again; a market the chain does not have reads as params null.
 */
export const readMorphoPosition = async (
  ref: MorphoPositionRef,
  user: Address,
  clientFor: (chain: MorphoChain) => MorphoClient = chain => createMorphoClient(chain.chain, 1),
): Promise<MorphoPosition> => {
  const chain = getMorphoChain(ref.chainId);
  if (!chain) throw new Error(`Morpho is not covered on chain ${ref.chainId}`);
  const client = clientFor(chain);
  const base = { key: morphoRefKey(ref), protocol: ref.protocol, chain, marketId: ref.marketId };

  const params =
    ref.protocol === "morpho-blue"
      ? await readBlueMarketParams(client, chain, ref.marketId, ref.preLiquidations)
      : await readMidnightMarketParams(client, chain, ref.marketId);
  if (!params) return { ...base, params: null, reading: null };

  const reading =
    params.kind === "blue"
      ? await readBlueHealth(client, chain, ref.marketId, user, params)
      : await readMidnightHealth(client, chain, ref.marketId, user, params);
  if (!reading) throw new Error("The position could not be read");
  return { ...base, params, reading };
};
