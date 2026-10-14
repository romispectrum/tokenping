import { AdminCard } from "~~/app/admin/_components/AdminCard";

type PauseCardProps = {
  paused: boolean | undefined;
  isBusy: boolean;
  onPause: () => void;
  onUnpause: () => void;
};

export const PauseCard = ({ paused, isBusy, onPause, onUnpause }: PauseCardProps) => (
  <AdminCard title="Pause control" description="Emergency switch for paywall payments.">
    <div className="flex gap-3 pt-2">
      <button className="btn btn-warning" onClick={onPause} disabled={isBusy || Boolean(paused)}>
        Pause
      </button>
      <button className="btn btn-success" onClick={onUnpause} disabled={isBusy || !paused}>
        Unpause
      </button>
    </div>
  </AdminCard>
);
