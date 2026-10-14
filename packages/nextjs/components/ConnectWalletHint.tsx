"use client";

import { useAccount } from "wagmi";

export const ConnectWalletHint = () => {
  const { isConnected } = useAccount();

  if (isConnected) return null;

  return (
    <p className="mt-4 text-sm text-base-content/60 flex items-center gap-2">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning" aria-hidden />
      Connect your wallet (top right) to see your positions on the Aave page.
    </p>
  );
};
