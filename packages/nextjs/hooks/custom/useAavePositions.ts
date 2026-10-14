"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { type NetworkPosition, fetchAavePositions, sumUsd } from "~~/services/aave/positions";
import { getErrorMessage } from "~~/utils/errors";

export const useAavePositions = () => {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<NetworkPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!address || !isConnected) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setPositions(await fetchAavePositions(address));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch Aave positions"));
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

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
    isLoading,
    error,
    ...totals,
    refetch: fetchPositions,
  };
};
