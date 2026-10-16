"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { Button, EmptyState, LiveRegion } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";

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
  const { gate } = useMessages(DASHBOARD_MESSAGES);
  // Busy only while the visitor is in the wallet list. wagmi also says "connecting" during its mount-time check for a
  // wallet that already trusts the site, when no wallet prompt exists, and closing the list ends the attempt.
  const isAwaitingWallet = isConnecting && connectModalOpen;

  return (
    <div className="flex flex-col gap-3">
      <EmptyState
        icon={Wallet}
        title={gate.title}
        description={gate.description}
        action={
          <Button onClick={openConnectModal} loading={isAwaitingWallet} loadingText={gate.connecting}>
            <Wallet aria-hidden="true" />
            {gate.connect}
          </Button>
        }
      />
      <LiveRegion className="sr-only">{isAwaitingWallet ? gate.approveInWallet : ""}</LiveRegion>
    </div>
  );
};
