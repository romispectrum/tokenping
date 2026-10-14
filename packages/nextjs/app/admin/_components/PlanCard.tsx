import { AddressInput } from "@scaffold-ui/components";
import { formatUnits } from "viem";
import { AdminCard } from "~~/app/admin/_components/AdminCard";
import { DecimalsHint } from "~~/app/admin/_components/DecimalsHint";
import { LabeledField } from "~~/app/admin/_components/LabeledField";
import { FALLBACK_TOKEN_DECIMALS, type PlanForm } from "~~/app/admin/_components/adminForms";

type PlanCardProps = {
  form: PlanForm;
  onChange: (patch: Partial<PlanForm>) => void;
  tokenDecimals: number | undefined;
  isDecimalsLoading: boolean;
  tokenSymbol: string | undefined;
  currentPlan: readonly [price: bigint, durationSeconds: bigint, enabled: boolean] | undefined;
  isBusy: boolean;
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
  onSubmit,
}: PlanCardProps) => (
  <AdminCard title="Update plan" description="Set token plan price, duration, and enable status.">
    <LabeledField label="Token address">
      <AddressInput
        placeholder="Token address"
        value={form.tokenAddress}
        onChange={tokenAddress => onChange({ tokenAddress })}
      />
    </LabeledField>
    <LabeledField label={`Price (${tokenSymbol ?? "token"})`}>
      <input
        className="input input-bordered w-full"
        placeholder={`Price (${tokenSymbol ?? "token"})`}
        value={form.price}
        onChange={event => onChange({ price: event.target.value })}
      />
    </LabeledField>
    <LabeledField label="Duration (seconds)">
      <input
        className="input input-bordered w-full"
        placeholder="Duration seconds"
        value={form.durationSeconds}
        onChange={event => onChange({ durationSeconds: event.target.value })}
      />
    </LabeledField>
    <label className="label cursor-pointer justify-start gap-3">
      <input
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={form.enabled}
        onChange={event => onChange({ enabled: event.target.checked })}
      />
      <span className="label-text">Plan enabled</span>
    </label>
    <DecimalsHint decimals={tokenDecimals} isLoading={isDecimalsLoading} action="Saving" />
    {currentPlan ? (
      <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3 text-xs">
        <div>
          Current price: {formatUnits(currentPlan[0], tokenDecimals ?? FALLBACK_TOKEN_DECIMALS)} {tokenSymbol ?? ""}
        </div>
        <div>Current duration: {currentPlan[1].toString()} sec</div>
        <div>Current enabled: {currentPlan[2] ? "Yes" : "No"}</div>
      </div>
    ) : null}
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy || tokenDecimals === undefined}>
      Save plan
    </button>
  </AdminCard>
);
