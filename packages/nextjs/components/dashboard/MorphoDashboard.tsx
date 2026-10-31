"use client";

import { MorphoPositions } from "~~/components/custom/morpho/MorphoPositions";
import { WalletDashboard } from "~~/components/dashboard/WalletDashboard";
import { useMessages } from "~~/i18n/LocaleProvider";

/** The wallet-dependent part of /morpho. */
export const MorphoDashboard = () => {
  const t = useMessages("morpho");
  return (
    <WalletDashboard heading={t.positionsHeading} gate={t.gate}>
      <MorphoPositions />
    </WalletDashboard>
  );
};
