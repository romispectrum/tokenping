import { CirclePause, CirclePlay } from "lucide-react";
import { AdminCard, type TxPhase, loadingTextFor } from "~~/app/(en)/admin/_components/AdminCard";
import { PaymentsStatus } from "~~/app/(en)/admin/_components/ContractOverview";
import { DataList, DataRow } from "~~/app/(en)/admin/_components/DataList";
import type { AdminTxError } from "~~/app/(en)/admin/_components/adminTxError";
import { Button } from "~~/components/ui";

type PauseCardProps = {
  paused: boolean | undefined;
  /** Any admin transaction is in flight. */
  isBusy: boolean;
  /** This card's pause or unpause in flight. */
  pending?: TxPhase;
  error?: AdminTxError;
  onPause: () => void;
  onUnpause: () => void;
};

// One button offers the action the current status allows: no button sits disabled without a reason, and the
// focused button stays enabled (keeping focus) when its transaction confirms and the status flips.
export const PauseCard = ({ paused, isBusy, pending, error, onPause, onUnpause }: PauseCardProps) => (
  <AdminCard
    id="admin-payments"
    title="Payments"
    description="Pausing stops new payments until you unpause. Withdrawals keep working while paused."
    current={
      <DataList className="rounded-xl bg-muted p-4">
        <DataRow label="Current status">
          <PaymentsStatus paused={paused} />
        </DataRow>
      </DataList>
    }
    error={error}
    pending={pending}
    actions={
      <Button
        variant="secondary"
        onClick={paused ? onUnpause : onPause}
        loading={pending !== undefined}
        loadingText={loadingTextFor(pending, paused ? "Unpausing" : "Pausing")}
        disabled={(isBusy && pending === undefined) || paused === undefined}
      >
        {paused ? <CirclePlay aria-hidden="true" /> : <CirclePause aria-hidden="true" />}
        {paused ? "Unpause payments" : "Pause payments"}
      </Button>
    }
  />
);
