"use client";

import { useCallback, useMemo } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { type NetworkPosition, fetchAavePositions, sumUsd } from "~~/services/aave/positions";
import { normalizeAddress } from "~~/utils/address";
import { getErrorMessage } from "~~/utils/errors";

const NO_POSITIONS: NetworkPosition[] = [];

export const useAavePositions = () => {
  const { address, isConnected } = useAccount();
  const user = isConnected ? address : undefined;

  // Keyed by account, so switching wallets never shows the previous account's positions or lets its late response win.
  const {
    data: positions = NO_POSITIONS,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["aavePositions", user ? normalizeAddress(user) : null],
    queryFn: user ? () => fetchAavePositions(user) : skipToken,
    // viem's fallback transport already retries every RPC endpoint; retrying the query would only delay the error.
    retry: false,
    // react-query would pause a fetch while the browser reports offline, leaving no data, no error and no loading
    // state: the "no positions" message. Fetching anyway lets a total outage reach the error box and Try Again.
    networkMode: "always",
    // Fetch only on mount, on an account switch and on refetch(). Any fetch shows the loading state, which unmounts the
    // notification form, so a background fetch would throw away an unsaved draft.
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const totals = useMemo(
    () => ({
      totalNetWorthUSD: sumUsd(positions, "netWorthUSD"),
      totalCollateralUSD: sumUsd(positions, "totalCollateralUSD"),
      totalDebtUSD: sumUsd(positions, "totalDebtUSD"),
    }),
    [positions],
  );

  return {
    positions,
    // A refresh shows the loading state too, and hides the previous attempt's error while it runs.
    isLoading: isFetching,
    error: error && !isFetching ? getErrorMessage(error, "Failed to fetch Aave positions") : null,
    ...totals,
    refetch: refresh,
  };
};
