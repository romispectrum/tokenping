import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";

type InlineErrorProps = {
  /** What failed, in the user's terms ("Positions did not load"). */
  title: string;
  /** Why, if known, and what to do. */
  detail: string;
  onRetry?: () => void;
};

/** Shown in place of content that failed to load: icon and words, never colour alone, and a way to try again. */
export const InlineError = ({ title, detail, onRetry }: InlineErrorProps) => {
  const t = useMessages(DASHBOARD_MESSAGES);
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive-subtle text-destructive">
        <CircleAlert aria-hidden="true" className="size-6" strokeWidth={1.5} />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="m-0 text-base font-medium text-foreground">{title}</p>
        <p className="m-0 text-sm text-muted-foreground">{detail}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          {t.errors.tryAgain}
        </Button>
      ) : null}
    </div>
  );
};
