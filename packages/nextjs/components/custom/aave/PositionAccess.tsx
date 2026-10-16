import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import type { NetworkPosition } from "~~/services/aave/positions";

type PositionAccessProps = {
  position: NetworkPosition;
  hasNotificationConfig: boolean;
};

/** The paywall for the selected network, or, once the wallet has paid, the line that says until when alerts are unlocked. */
export const PositionAccess = ({ position, hasNotificationConfig }: PositionAccessProps) => (
  <AccessPaywall
    description={
      hasNotificationConfig
        ? `Your saved ${position.chainName} alert settings are still in your account. Pay again to extend access and edit them.`
        : `Pay once to set health factor alerts on ${position.chainName} and other networks. Nothing renews automatically: you pay from your wallet when you want to extend.`
    }
    hasExistingConfig={hasNotificationConfig}
  />
);
