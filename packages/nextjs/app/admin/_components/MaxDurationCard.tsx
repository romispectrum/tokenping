import { AdminCard } from "~~/app/admin/_components/AdminCard";

type MaxDurationCardProps = {
  maxDuration: bigint | undefined;
  value: string;
  onChange: (value: string) => void;
  isBusy: boolean;
  onSubmit: () => void;
};

export const MaxDurationCard = ({ maxDuration, value, onChange, isBusy, onSubmit }: MaxDurationCardProps) => (
  <AdminCard title="Max duration" description={<>Current: {maxDuration?.toString() ?? "0"} seconds</>}>
    <input
      className="input input-bordered w-full"
      placeholder="New max duration (seconds)"
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    <button className="btn btn-primary w-fit" onClick={onSubmit} disabled={isBusy}>
      Update max duration
    </button>
  </AdminCard>
);
