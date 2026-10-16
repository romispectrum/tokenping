import { AccessPaywall } from "~~/components/custom/AccessPaywall";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import type { NetworkPosition } from "~~/services/aave/positions";

type PositionAccessProps = {
  position: NetworkPosition;
  hasNotificationConfig: boolean;
};

/** The paywall for the selected market, or, once the wallet has paid, the line that says until when alerts are unlocked. */
export const PositionAccess = ({ position, hasNotificationConfig }: PositionAccessProps) => {
  const t = useMessages(DASHBOARD_MESSAGES).paywall;
  return (
    <AccessPaywall
      description={
        hasNotificationConfig
          ? t.networkDescriptionExtend(position.marketName)
          : t.networkDescriptionNew(position.marketName)
      }
      hasExistingConfig={hasNotificationConfig}
    />
  );
};
