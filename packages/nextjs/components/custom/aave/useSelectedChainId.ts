import { useEffect, useState } from "react";
import { resolveSelectedChainId } from "~~/components/custom/aave/positionsView";
import type { NetworkPosition } from "~~/services/aave/positions";

/** The network shown in the details panel; it falls back to a default whenever `positions` no longer lists it. */
export const useSelectedChainId = (positions: readonly NetworkPosition[]) => {
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);

  useEffect(() => {
    const nextChainId = resolveSelectedChainId(positions, selectedChainId);
    if (nextChainId !== selectedChainId) setSelectedChainId(nextChainId);
  }, [positions, selectedChainId]);

  return [selectedChainId, setSelectedChainId] as const;
};
