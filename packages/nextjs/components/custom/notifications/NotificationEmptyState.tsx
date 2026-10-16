import type { Ref } from "react";
import { BellRing } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "~~/components/ui";

type NotificationEmptyStateProps = {
  chainName: string;
  onCreate: () => void;
  /** The Create button, which takes focus when Cancel closes an unsaved form. */
  createRef?: Ref<HTMLButtonElement>;
};

/** First use on this network. Its button is the view's one pink primary action. */
export const NotificationEmptyState = ({ chainName, onCreate, createRef }: NotificationEmptyStateProps) => (
  <Card>
    <CardContent>
      <EmptyState
        size="inline"
        headingLevel={3}
        icon={BellRing}
        title={`No alerts on ${chainName} yet`}
        description="Get a message when your health factor drops below a threshold you choose."
        action={
          <Button ref={createRef} onClick={onCreate}>
            Create alert
          </Button>
        }
      />
    </CardContent>
  </Card>
);
