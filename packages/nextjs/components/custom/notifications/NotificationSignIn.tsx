import { KeyRound } from "lucide-react";
import { Alert, Button, Card, CardContent, EmptyState, LiveRegion } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type NotificationSignInProps = {
  isSigningIn: boolean;
  /** Why the last attempt failed (a declined signature, or anything else), or null. */
  errorMessage: string | null;
  onSignIn: () => void;
};

/**
 * Before the alerts load: the wallet signs a sign-in message once, so the API knows the address is the visitor's own.
 * Shown only to a wallet with paid access, where the paywall is gone, so its button is the view's one pink action.
 */
export const NotificationSignIn = ({ isSigningIn, errorMessage, onSignIn }: NotificationSignInProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <Card>
      <CardContent>
        <EmptyState
          size="inline"
          headingLevel={3}
          icon={KeyRound}
          title={t.signInTitle}
          description={t.signInDescription}
          action={
            <Button onClick={onSignIn} loading={isSigningIn} loadingText={t.signingIn}>
              {t.signIn}
            </Button>
          }
        />
        {/* Mounted before any failure, so the message is announced when it appears. */}
        <LiveRegion politeness="assertive">
          {errorMessage ? <Alert variant="destructive" title={errorMessage} /> : null}
        </LiveRegion>
      </CardContent>
    </Card>
  );
};
