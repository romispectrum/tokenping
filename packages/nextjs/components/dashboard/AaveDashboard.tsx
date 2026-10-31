"use client";

import { AavePositions } from "~~/components/custom/AavePositions";
import { WalletDashboard } from "~~/components/dashboard/WalletDashboard";
import { useMessages } from "~~/i18n/LocaleProvider";

/** The wallet-dependent part of /aave. */
export const AaveDashboard = () => {
  const t = useMessages("dashboard");
  return (
    <WalletDashboard heading={t.positionsHeading} gate={t.gate}>
      <AavePositions />
    </WalletDashboard>
  );
};
