"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { Button, EmptyState, LiveRegion } from "~~/components/ui";

type ConnectWalletGateProps = {
  /** wagmi's isConnecting: true for a connection the visitor asked for, and also for wagmi's own checks. */
  isConnecting: boolean;
};

/**
 * The dashboard needs a wallet address, and connecting is the only thing to do here, so "Connect wallet" is this
 * view's one pink button. It opens the same wallet list as the header button.
 */
export const ConnectWalletGate = ({ isConnecting }: ConnectWalletGateProps) => {
  const { connectModalOpen, openConnectModal } = useConnectModal();
  // Busy only while the visitor is in the wallet list. wagmi also says "connecting" during its mount-time check for a
  // wallet that already trusts the site, when no wallet prompt exists, and closing the list ends the attempt.
  const isAwaitingWallet = isConnecting && connectModalOpen;

  return (
    <div className="flex flex-col gap-3">
      <EmptyState
        icon={Wallet}
        title="Connect a wallet to continue"
        description="Tokenping needs your wallet address to show your Aave V3 positions. Connecting does not move funds or cost a fee."
        action={
          <Button onClick={openConnectModal} loading={isAwaitingWallet} loadingText="Connecting">
            <Wallet aria-hidden="true" />
            Connect wallet
          </Button>
        }
      />
      <LiveRegion className="sr-only">{isAwaitingWallet ? "Approve the connection in your wallet." : ""}</LiveRegion>
    </div>
  );
};
