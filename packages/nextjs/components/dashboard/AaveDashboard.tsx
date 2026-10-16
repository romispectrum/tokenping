"use client";

import { useIsClient } from "usehooks-ts";
import { useAccount } from "wagmi";
import { AavePositions } from "~~/components/custom/AavePositions";
import { DashboardSkeleton } from "~~/components/custom/aave/PositionsSkeleton";
import { ConnectWalletGate } from "~~/components/dashboard/ConnectWalletGate";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";

/** The wallet-dependent part of /aave. The page around it is server-rendered, so crawlers still get its text. */
export const AaveDashboard = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const isClient = useIsClient();
  const t = useMessages(DASHBOARD_MESSAGES);

  // Wallet state is only known on the client, and a returning wallet reconnects after load. Until then the server and
  // the first client render show the same placeholder (no hydration mismatch), never a "Connect wallet" flash.
  if (!isClient || (isReconnecting && !address)) return <DashboardSkeleton />;

  if (isConnected && address) {
    // The dashboard's own headings are h3s (networks, the selected position, notification settings), so this h2
    // keeps the page outline h1 → h2 → h3, like the disconnected state's visible h2.
    return (
      <section aria-labelledby="your-positions" className="w-full">
        <h2 id="your-positions" className="sr-only">
          {t.positionsHeading}
        </h2>
        <AavePositions />
      </section>
    );
  }

  return <ConnectWalletGate isConnecting={Boolean(isConnecting)} />;
};
