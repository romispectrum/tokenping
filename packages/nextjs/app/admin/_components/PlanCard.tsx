import { formatUnits } from "viem";
import { AdminCard } from "~~/app/admin/_components/AdminCard";
import { FALLBACK_TOKEN_DECIMALS, type PlanForm } from "~~/app/admin/_components/adminForms";

type PlanCardProps = {
  form: PlanForm;
  onChange: (patch: Partial<PlanForm>) => void;
  tokenDecimals: number | undefined;
  tokenSymbol: string | undefined;
  currentPlan: readonly [price: bigint, durationSeconds: bigint, enabled: boolean] | undefined;
  isBusy: boolean;
  onSubmit: () => void;
};

export const PlanCard = ({
  form,
  onChange,
  tokenDecimals,
  tokenSymbol,
  currentPlan,
  isBusy,
  onSubmit,
}: PlanCardProps) => (
  <AdminCard title="Update plan" description="Set token plan price, duration, and enable status.">
    <input
      className="input input-bordered w-full"
      placeholder="Token address"
      value={form.tokenAddress}
      onChange={event => onChange({ tokenAddress: event.target.value })}
    />
    <input
      className="input input-bordered w-full"
      placeholder={`Price (${tokenSymbol ?? "token"})`}
      value={form.price}
      onChange={event => onChange({ price: event.target.value })}
    />
    <input
      className="input input-bordered w-full"
      placeholder="Duration seconds"
      value={form.durationSeconds}
      onChange={event => onChange({ durationSeconds: event.target.value })}
    />
    <label className="label cursor-pointer justify-start gap-3">
      <input
        type="checkbox"
        className="checkbox checkbox-primary"
        checked={form.enabled}
        onChange={event => onChange({ enabled: event.target.checked })}
      />
      <span className="label-text">Plan enabled</span>
    </label>
    <div className="text-xs text-base-content/70">
      Detected decimals: {tokenDecimals ?? `${FALLBACK_TOKEN_DECIMALS} (fallback)`}
    </div>
    {currentPlan ? (
      <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3 text-xs">
        <div>
          Current price: {formatUnits(currentPlan[0], tokenDecimals ?? FALLBACK_TOKEN_DECIMALS)} {tokenSymbol ?? ""}
        </div>
        <div>Current duration: {currentPlan[1].toString()} sec</div>
        <div>Current enabled: {currentPlan[2] ? "Yes" : "No"}</div>
      </div>
    ) : null}
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy}>
      Save plan
    </button>
  </AdminCard>
);
