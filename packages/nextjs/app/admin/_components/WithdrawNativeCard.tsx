import { AddressInput, EtherInput } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { AdminCard } from "~~/app/admin/_components/AdminCard";
import { LabeledField } from "~~/app/admin/_components/LabeledField";
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
    <LabeledField label="Destination address">
      <AddressInput placeholder="Destination address" value={form.to} onChange={to => onChange({ to })} />
    </LabeledField>
    <LabeledField label="Amount (ETH)">
      {/* Uncontrolled: defaultValue restores the typed amount when the card remounts after a wallet switch. */}
      <EtherInput
        placeholder="Amount in ETH"
        defaultValue={form.amountEth}
        onValueChange={({ valueInEth }) => onChange({ amountEth: valueInEth })}
      />
    </LabeledField>
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy}>
      Withdraw native
    </button>
  </AdminCard>
);
