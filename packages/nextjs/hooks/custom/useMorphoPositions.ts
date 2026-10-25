"use client";

import { useMemo } from "react";
import { skipToken, useQueries, useQuery } from "@tanstack/react-query";
import type { Hex } from "viem";
import { useAccount } from "wagmi";
import { getMorphoChain } from "~~/config/morpho";
import { isMorphoMarketId, isMorphoProtocol } from "~~/config/protocols";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { type MorphoPositionRef, fetchMorphoPositions } from "~~/services/morpho/api";
import { type MorphoPosition, morphoRefKey, readMorphoPosition } from "~~/services/morpho/positions";
import { normalizeAddress } from "~~/utils/address";

/** One market in the list: the position once read, with its own loading and error state. */
export type MorphoPositionItem = {
  key: string;
  ref: MorphoPositionRef;
  position: MorphoPosition | undefined;
  isLoading: boolean;
  isError: boolean;
};

// As useAavePositions: fetch only on mount, on an account switch and on refetch(), never in the background, since a
// fetch shows the loading state, which unmounts the alert form and its unsaved draft. The readers already retry each
// RPC endpoint, and fetching while the browser reports offline lets an outage reach the error state.
const QUERY_OPTIONS = {
  retry: false,
  networkMode: "always",
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
} as const;

/**
 * The connected wallet's Morpho positions: the listed markets it borrows in, found through Morpho's API, then each
 * one's market and health read from the chain in the browser. Markets with a saved alert that the API does not list
 * (a repaid loan, a market delisted since) are read too, so their alert can still be edited or deleted. Each position
 * is a query of its own, so a market added to the list never reloads the others.
 */
export const useMorphoPositions = () => {
  const { address, isConnected } = useAccount();
  const user = isConnected ? address : undefined;
  const account = user ? normalizeAddress(user) : null;
  const { savedRefs } = useNotificationConfig();

  const discovery = useQuery({
    queryKey: ["morphoDiscovery", account],
    queryFn: user ? () => fetchMorphoPositions(user) : skipToken,
    ...QUERY_OPTIONS,
  });

  const refs = useMemo(() => {
    const found = discovery.data ?? [];
    const keys = new Set(found.map(morphoRefKey));
    const saved = savedRefs.flatMap(({ protocol, chainId, market }): MorphoPositionRef[] =>
      isMorphoProtocol(protocol) && getMorphoChain(chainId) && isMorphoMarketId(market)
        ? [{ protocol, chainId, marketId: market as Hex, preLiquidations: [] }]
        : [],
    );
    return [...found, ...saved.filter(ref => !keys.has(morphoRefKey(ref)))];
  }, [discovery.data, savedRefs]);

  // Without a wallet there is nothing found or saved to read.
  const reads = useQueries({
    queries: user
      ? refs.map(ref => ({
          queryKey: ["morphoPosition", account, morphoRefKey(ref)],
          queryFn: () => readMorphoPosition(ref, user),
          ...QUERY_OPTIONS,
        }))
      : [],
  });

  const items: MorphoPositionItem[] = refs.map((ref, index) => ({
    key: morphoRefKey(ref),
    ref,
    position: reads[index]?.data,
    isLoading: reads[index]?.isFetching ?? true,
    isError: !!reads[index]?.error && !reads[index]?.isFetching,
  }));

  const refetch = () => {
    void discovery.refetch();
    for (const read of reads) void read.refetch();
  };

  return {
    /** The normalized address the positions belong to, or null without a connected wallet. */
    account,
    items,
    /** True while Morpho's API is being asked which markets the wallet borrows in. */
    isDiscovering: discovery.isFetching,
    /** The API did not answer: only the saved alerts' markets are listed. */
    discoveryFailed: !!discovery.error && !discovery.isFetching,
    refetch,
  };
};
