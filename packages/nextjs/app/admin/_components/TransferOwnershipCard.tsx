import { AdminCard } from "~~/app/admin/_components/AdminCard";
import { HexAddressInput } from "~~/app/admin/_components/HexAddressInput";
import { LabeledField } from "~~/app/admin/_components/LabeledField";

type TransferOwnershipCardProps = {
  value: string;
  onChange: (value: string) => void;
  isBusy: boolean;
  onSubmit: () => void;
};

export const TransferOwnershipCard = ({ value, onChange, isBusy, onSubmit }: TransferOwnershipCardProps) => (
  <AdminCard
    title="Transfer ownership"
    description="Move contract admin rights to another wallet."
    className="xl:col-span-2"
  >
    <LabeledField label="New owner address" className="md:max-w-xl">
      <HexAddressInput placeholder="New owner address" value={value} onChange={onChange} />
    </LabeledField>
    <button className="btn btn-error w-fit" onClick={onSubmit} disabled={isBusy}>
      Transfer ownership
    </button>
  </AdminCard>
);
