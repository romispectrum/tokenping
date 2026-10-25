"use client";

import { MorphoPositions } from "~~/components/custom/morpho/MorphoPositions";
import { WalletDashboard } from "~~/components/dashboard/WalletDashboard";
import { useMessages } from "~~/i18n/LocaleProvider";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";

/** The wallet-dependent part of /morpho. */
export const MorphoDashboard = () => {
  const t = useMessages(MORPHO_MESSAGES);
  return (
    <WalletDashboard heading={t.positionsHeading} gate={t.gate}>
      <MorphoPositions />
    </WalletDashboard>
  );
};
