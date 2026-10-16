import type { FormEvent, ReactNode } from "react";
import type { AdminTxError } from "~~/app/(en)/admin/_components/adminTxError";
import {
  Alert,
  type AlertVariant,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LiveRegion,
  cx,
} from "~~/components/ui";

/** Where a card's own transaction is: open in the wallet, or sent and waiting (simulation, then mining). */
export type TxPhase = "wallet" | "processing";

/** The pending button's label: where to look while the wallet is open, the action's verb after that. */
export const loadingTextFor = (phase: TxPhase | undefined, verb: string) =>
  phase === "wallet" ? "Waiting for your wallet" : verb;

const ALERT_VARIANT: Record<AdminTxError["tone"], AlertVariant> = {
  neutral: "default",
  warning: "warning",
  destructive: "destructive",
};

type AdminCardProps = {
  /** Unique on the page: the heading id is derived from it and names the card's region. */
  id: string;
  title: string;
  description: ReactNode;
  /** The current on-chain values this card changes, usually a DataList panel. */
  current?: ReactNode;
  /** Makes the card a form, so Enter in a field submits it like the submit button. */
  onSubmit?: () => void;
  /** The last failed transaction of this card's action, shown next to the button that sent it. */
  error?: AdminTxError;
  /** This card's transaction in flight, if any. */
  pending?: TxPhase;
  actions: ReactNode;
  /** "destructive" outlines a block whose action this page cannot undo; it goes last on the page. */
  tone?: "default" | "destructive";
  children?: ReactNode;
};

/**
 * One settings block of the owner console: a flat card with a title, one sentence, the current values, the fields
 * and the action. The message regions stay mounted, so a message rendered into them later is announced: failures
 * interrupt (assertive), a cancel in the wallet and the wallet prompt do not (polite).
 */
export const AdminCard = ({
  id,
  title,
  description,
  current,
  onSubmit,
  error,
  pending,
  actions,
  tone = "default",
  children,
}: AdminCardProps) => {
  const titleId = `${id}-title`;
  const errorAlert = error ? (
    <Alert variant={ALERT_VARIANT[error.tone]} title={error.title} className="mb-4">
      {error.message}
    </Alert>
  ) : null;
  const body = (
    <>
      {current}
      {children}
      <div>
        <LiveRegion politeness="assertive">{error && error.tone !== "neutral" ? errorAlert : null}</LiveRegion>
        <LiveRegion>{error?.tone === "neutral" ? errorAlert : null}</LiveRegion>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {actions}
          {/* Not hidden while empty: a region that is display:none is not announced when its text appears. */}
          <LiveRegion className="text-sm text-muted-foreground">
            {pending === "wallet" ? "Confirm the transaction in your wallet." : null}
          </LiveRegion>
        </div>
      </div>
    </>
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <Card role="region" aria-labelledby={titleId} className={cx(tone === "destructive" && "border-destructive")}>
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {onSubmit ? (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
            {body}
          </form>
        ) : (
          <div className="flex flex-col gap-6">{body}</div>
        )}
      </CardContent>
    </Card>
  );
};
