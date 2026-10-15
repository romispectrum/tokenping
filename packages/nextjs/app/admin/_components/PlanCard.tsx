import { CircleCheck, CircleOff } from "lucide-react";
import { AddressField } from "~~/app/admin/_components/AddressField";
import { AdminCard, type TxPhase, loadingTextFor } from "~~/app/admin/_components/AdminCard";
import { DataList, DataRow } from "~~/app/admin/_components/DataList";
import { DecimalsHint } from "~~/app/admin/_components/DecimalsHint";
import { formatDuration, formatExactAmount } from "~~/app/admin/_components/adminFormat";
import { FALLBACK_TOKEN_DECIMALS, type PlanField, type PlanForm } from "~~/app/admin/_components/adminForms";
import type { AdminTxError } from "~~/app/admin/_components/adminTxError";
import { Badge, Button, Checkbox, Field, Input } from "~~/components/ui";

export const PLAN_FIELD_IDS: Record<PlanField, string> = {
  tokenAddress: "admin-plan-token",
  price: "admin-plan-price",
  durationSeconds: "admin-plan-duration",
};

type PlanCardProps = {
  form: PlanForm;
  onChange: (patch: Partial<PlanForm>) => void;
  tokenDecimals: number | undefined;
  isDecimalsLoading: boolean;
  tokenSymbol: string | undefined;
  currentPlan: readonly [price: bigint, durationSeconds: bigint, enabled: boolean] | undefined;
  /** Any admin transaction is in flight. */
  isBusy: boolean;
  /** This card's transaction in flight. */
  pending?: TxPhase;
  error?: AdminTxError;
  /** The failed submit's message for the field it failed on. */
  fieldErrors?: Partial<Record<PlanField, string>>;
  onSubmit: () => void;
};

export const PlanCard = ({
  form,
  onChange,
  tokenDecimals,
  isDecimalsLoading,
  tokenSymbol,
  currentPlan,
  isBusy,
  pending,
  error,
  fieldErrors,
  onSubmit,
}: PlanCardProps) => (
  <AdminCard
    id="admin-plan"
    title="Update plan"
    description="The price of one payment in a token and the access time it buys."
    current={
      currentPlan ? (
        <DataList className="rounded-xl bg-muted p-4">
          <DataRow label="Current price">
            <span className="font-data">
              {formatExactAmount(currentPlan[0], tokenDecimals ?? FALLBACK_TOKEN_DECIMALS)} {tokenSymbol ?? ""}
            </span>
          </DataRow>
          <DataRow label="Current duration">
            <span className="tabular-nums">{formatDuration(currentPlan[1])}</span>
          </DataRow>
          <DataRow label="Plan status">
            {currentPlan[2] ? (
              <Badge variant="success">
                <CircleCheck aria-hidden="true" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="neutral">
                <CircleOff aria-hidden="true" />
                Disabled
              </Badge>
            )}
          </DataRow>
        </DataList>
      ) : null
    }
    onSubmit={onSubmit}
    error={error}
    pending={pending}
    actions={
      <Button
        type="submit"
        variant="secondary"
        loading={pending !== undefined}
        loadingText={loadingTextFor(pending, "Saving")}
        disabled={(isBusy && pending === undefined) || tokenDecimals === undefined}
      >
        Save plan
      </Button>
    }
  >
    <AddressField
      id={PLAN_FIELD_IDS.tokenAddress}
      label="Token address"
      value={form.tokenAddress}
      onChange={tokenAddress => onChange({ tokenAddress })}
      description={<DecimalsHint decimals={tokenDecimals} isLoading={isDecimalsLoading} action="Saving" />}
      error={fieldErrors?.tokenAddress}
    />
    <Field id={PLAN_FIELD_IDS.price} label={`Price (${tokenSymbol ?? "token"})`} error={fieldErrors?.price}>
      {control => (
        <Input
          {...control}
          inputMode="decimal"
          autoComplete="off"
          className="font-data"
          value={form.price}
          onChange={event => onChange({ price: event.target.value })}
        />
      )}
    </Field>
    <Field
      id={PLAN_FIELD_IDS.durationSeconds}
      label="Duration (seconds)"
      description="Whole seconds, digits only. 30 days is 2,592,000 seconds."
      error={fieldErrors?.durationSeconds}
    >
      {control => (
        <Input
          {...control}
          inputMode="numeric"
          autoComplete="off"
          className="tabular-nums"
          value={form.durationSeconds}
          onChange={event => onChange({ durationSeconds: event.target.value })}
        />
      )}
    </Field>
    <Field
      id="admin-plan-enabled"
      orientation="horizontal"
      label="Plan enabled"
      description="A disabled plan rejects payments in this token."
    >
      {control => (
        <Checkbox {...control} checked={form.enabled} onChange={event => onChange({ enabled: event.target.checked })} />
      )}
    </Field>
  </AdminCard>
);
