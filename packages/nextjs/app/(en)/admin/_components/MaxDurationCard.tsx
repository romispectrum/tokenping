import { AdminCard, type TxPhase, loadingTextFor } from "~~/app/(en)/admin/_components/AdminCard";
import { DataList, DataRow, NoData } from "~~/app/(en)/admin/_components/DataList";
import { formatDuration } from "~~/app/(en)/admin/_components/adminFormat";
import type { MaxDurationField } from "~~/app/(en)/admin/_components/adminForms";
import type { AdminTxError } from "~~/app/(en)/admin/_components/adminTxError";
import { Button, Field, Input } from "~~/components/ui";

export const MAX_DURATION_FIELD_IDS: Record<MaxDurationField, string> = {
  maxDurationSeconds: "admin-max-duration-input",
};

type MaxDurationCardProps = {
  maxDuration: bigint | undefined;
  value: string;
  onChange: (value: string) => void;
  /** Any admin transaction is in flight. */
  isBusy: boolean;
  /** This card's transaction in flight. */
  pending?: TxPhase;
  error?: AdminTxError;
  /** The failed submit's message for the field it failed on. */
  fieldErrors?: Partial<Record<MaxDurationField, string>>;
  onSubmit: () => void;
};

export const MaxDurationCard = ({
  maxDuration,
  value,
  onChange,
  isBusy,
  pending,
  error,
  fieldErrors,
  onSubmit,
}: MaxDurationCardProps) => (
  <AdminCard
    id="admin-max-duration"
    title="Max duration"
    description="The longest duration a plan can have."
    current={
      <DataList className="rounded-xl bg-muted p-4">
        <DataRow label="Current max duration">
          {maxDuration === undefined ? <NoData /> : <span className="tabular-nums">{formatDuration(maxDuration)}</span>}
        </DataRow>
      </DataList>
    }
    onSubmit={onSubmit}
    error={error}
    pending={pending}
    actions={
      <Button
        type="submit"
        variant="secondary"
        loading={pending !== undefined}
        loadingText={loadingTextFor(pending, "Updating")}
        disabled={isBusy && pending === undefined}
      >
        Update max duration
      </Button>
    }
  >
    <Field
      id={MAX_DURATION_FIELD_IDS.maxDurationSeconds}
      label="New max duration (seconds)"
      description="Whole seconds, digits only. 365 days is 31,536,000 seconds."
      error={fieldErrors?.maxDurationSeconds}
    >
      {control => (
        <Input
          {...control}
          inputMode="numeric"
          autoComplete="off"
          className="tabular-nums"
          value={value}
          onChange={event => onChange(event.target.value)}
        />
      )}
    </Field>
  </AdminCard>
);
