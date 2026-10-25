"use client";

import type { ReactNode } from "react";
import { useIsClient } from "usehooks-ts";
import { useAccount } from "wagmi";
import { DashboardSkeleton } from "~~/components/custom/aave/PositionsSkeleton";
import { ConnectWalletGate, type GateMessages } from "~~/components/dashboard/ConnectWalletGate";

type WalletDashboardProps = {
  /** The positions region's name, read by screen readers. */
  heading: string;
  /** What the gate says before a wallet is connected. */
  gate: GateMessages;
  /** The positions view, rendered once a wallet is connected. */
  children: ReactNode;
};

/**
 * The wallet-dependent part of a dashboard page (/aave, /morpho). The page around it is server-rendered, so crawlers
 * still get its text.
 */
export const WalletDashboard = ({ heading, gate, children }: WalletDashboardProps) => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const isClient = useIsClient();

  // Wallet state is only known on the client, and a returning wallet reconnects after load. Until then the server and
  // the first client render show the same placeholder (no hydration mismatch), never a "Connect wallet" flash.
  if (!isClient || (isReconnecting && !address)) return <DashboardSkeleton />;

  if (isConnected && address) {
    // The dashboard's own headings are h3s (networks, the selected position, notification settings), so this h2
    // keeps the page outline h1 → h2 → h3, like the disconnected state's visible h2.
    return (
      <section aria-labelledby="your-positions" className="w-full">
        <h2 id="your-positions" className="sr-only">
          {heading}
        </h2>
        {children}
      </section>
    );
  }

  return <ConnectWalletGate isConnecting={Boolean(isConnecting)} messages={gate} />;
};
