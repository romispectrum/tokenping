import { AdminCard } from "~~/app/admin/_components/AdminCard";

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
    <input
      className="input input-bordered w-full md:max-w-xl"
      placeholder="New owner address"
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    <button className="btn btn-error w-fit" onClick={onSubmit} disabled={isBusy}>
      Transfer ownership
    </button>
  </AdminCard>
);
