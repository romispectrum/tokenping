import { KeyRound } from "lucide-react";
import { Alert, Button, Card, CardContent, EmptyState, LiveRegion } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type NotificationSignInProps = {
  /** The view's pink primary action: true once the wallet has paid, when the paywall is gone. */
  isPrimary: boolean;
  isSigningIn: boolean;
  /** Why the last attempt failed (a declined signature, or anything else), or null. */
  errorMessage: string | null;
  onSignIn: () => void;
};

/**
 * Before the alerts load: the wallet signs a sign-in message once, so the API knows the address is the visitor's own.
 * For a wallet with paid access its button is the view's one pink action; for one whose access lapsed it is secondary,
 * since the paywall's button is.
 */
export const NotificationSignIn = ({ isPrimary, isSigningIn, errorMessage, onSignIn }: NotificationSignInProps) => {
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
            <Button
              variant={isPrimary ? "default" : "secondary"}
              onClick={onSignIn}
              loading={isSigningIn}
              loadingText={t.signingIn}
            >
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
