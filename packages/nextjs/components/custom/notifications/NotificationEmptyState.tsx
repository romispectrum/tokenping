import type { Ref } from "react";
import { BellRing } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type NotificationEmptyStateProps = {
  chainName: string;
  onCreate: () => void;
  /** The Create button, which takes focus when Cancel closes an unsaved form. */
  createRef?: Ref<HTMLButtonElement>;
};

/** First use on this network. Its button is the view's one pink primary action. */
export const NotificationEmptyState = ({ chainName, onCreate, createRef }: NotificationEmptyStateProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <Card>
      <CardContent>
        <EmptyState
          size="inline"
          headingLevel={3}
          icon={BellRing}
          title={t.emptyTitle(chainName)}
          description={t.emptyDescription}
          action={
            <Button ref={createRef} onClick={onCreate}>
              {t.createAlert}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
};
