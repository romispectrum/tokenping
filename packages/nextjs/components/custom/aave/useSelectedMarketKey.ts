import { useCallback, useEffect, useState } from "react";
import { resolveSelectedMarketKey } from "~~/components/custom/aave/positionsView";
import type { NetworkPosition } from "~~/services/aave/positions";

type Selection = { account: string | null; key: string | null };

/**
 * The market (position.key) shown in the details panel; it falls back to a default whenever `positions` no longer
 * lists it. A pick belongs to the account it was made for: every account lists the same V3 markets, so another
 * account (or the same one coming back) starts from its own default instead of keeping the previous pick.
 */
export const useSelectedMarketKey = (positions: readonly NetworkPosition[], account: string | null) => {
  const [selection, setSelection] = useState<Selection>({ account, key: null });
  // Derived during render, so not even the first render after a switch shows the previous account's pick.
  const selectedKey = selection.account === account ? selection.key : null;

  useEffect(() => {
    const nextKey = resolveSelectedMarketKey(positions, selectedKey);
    const isOutdated = selection.account !== account || nextKey !== selectedKey;
    if (isOutdated) setSelection({ account, key: nextKey });
  }, [positions, account, selection.account, selectedKey]);

  const setSelectedKey = useCallback((key: string | null) => setSelection({ account, key }), [account]);

  return [selectedKey, setSelectedKey] as const;
};
