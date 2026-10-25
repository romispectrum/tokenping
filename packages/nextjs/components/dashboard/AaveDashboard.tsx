"use client";

import { AavePositions } from "~~/components/custom/AavePositions";
import { WalletDashboard } from "~~/components/dashboard/WalletDashboard";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";

/** The wallet-dependent part of /aave. */
export const AaveDashboard = () => {
  const t = useMessages(DASHBOARD_MESSAGES);
  return (
    <WalletDashboard heading={t.positionsHeading} gate={t.gate}>
      <AavePositions />
    </WalletDashboard>
  );
};
