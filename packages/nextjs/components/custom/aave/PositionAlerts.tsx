import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { NotificationConfig } from "~~/components/custom/NotificationConfig";
import type { NetworkPosition } from "~~/services/aave/positions";

type PositionAlertsProps = {
  position: NetworkPosition;
  hasNotificationConfig: boolean;
};

/** The alert settings of the selected network, behind the paywall until the wallet has paid. */
export const PositionAlerts = ({ position, hasNotificationConfig }: PositionAlertsProps) => (
  <AccessPaywall
    description={
      hasNotificationConfig
        ? `Your saved ${position.chainName} alert settings are still in your account. Pay again to extend access and edit them.`
        : `Pay once to set health factor alerts on ${position.chainName} and other networks. Nothing renews automatically: you pay from your wallet when you want to extend.`
    }
    hasExistingConfig={hasNotificationConfig}
  >
    {/* Keyed by chain so switching networks discards the previous network's unsaved form. */}
    <NotificationConfig
      key={position.chainId}
      chainId={position.chainId}
      chainName={position.chainName}
      currentHealthFactor={position.healthFactor}
    />
  </AccessPaywall>
);
