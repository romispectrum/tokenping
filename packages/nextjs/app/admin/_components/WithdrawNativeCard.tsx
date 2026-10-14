import { formatEther } from "viem";
import { AdminCard } from "~~/app/admin/_components/AdminCard";
import type { NativeWithdrawForm } from "~~/app/admin/_components/adminForms";

type WithdrawNativeCardProps = {
  form: NativeWithdrawForm;
  onChange: (patch: Partial<NativeWithdrawForm>) => void;
  balance: bigint | undefined;
  isBusy: boolean;
  onSubmit: () => void;
};

export const WithdrawNativeCard = ({ form, onChange, balance, isBusy, onSubmit }: WithdrawNativeCardProps) => (
  <AdminCard
    title="Withdraw native"
    description={<>Contract native balance: {balance === undefined ? "0" : formatEther(balance)} ETH</>}
  >
    <input
      className="input input-bordered w-full"
      placeholder="Destination address"
      value={form.to}
      onChange={event => onChange({ to: event.target.value })}
    />
    <input
      className="input input-bordered w-full"
      placeholder="Amount in ETH"
      value={form.amountEth}
      onChange={event => onChange({ amountEth: event.target.value })}
    />
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy}>
      Withdraw native
    </button>
  </AdminCard>
);
