import { useCallback, useEffect, useState } from "react";
import { resolveSelectedChainId } from "~~/components/custom/aave/positionsView";
import type { NetworkPosition } from "~~/services/aave/positions";

type Selection = { account: string | null; chainId: number | null };

/**
 * The network shown in the details panel; it falls back to a default whenever `positions` no longer lists it.
 * A pick belongs to the account it was made for: every account lists the same markets, so another account (or the
 * same one coming back) starts from its own default instead of keeping the previous pick.
 */
export const useSelectedChainId = (positions: readonly NetworkPosition[], account: string | null) => {
  const [selection, setSelection] = useState<Selection>({ account, chainId: null });
  // Derived during render, so not even the first render after a switch shows the previous account's pick.
  const selectedChainId = selection.account === account ? selection.chainId : null;

  useEffect(() => {
    const nextChainId = resolveSelectedChainId(positions, selectedChainId);
    const isOutdated = selection.account !== account || nextChainId !== selectedChainId;
    if (isOutdated) setSelection({ account, chainId: nextChainId });
  }, [positions, account, selection.account, selectedChainId]);

  const setSelectedChainId = useCallback((chainId: number | null) => setSelection({ account, chainId }), [account]);

  return [selectedChainId, setSelectedChainId] as const;
};
