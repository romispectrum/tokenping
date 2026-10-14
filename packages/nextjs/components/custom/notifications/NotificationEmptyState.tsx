import { BellIcon } from "~~/components/custom/notifications/BellIcon";
import { NotificationCardShell } from "~~/components/custom/notifications/NotificationCard";

type NotificationEmptyStateProps = {
  chainName: string;
  onCreate: () => void;
};

export const NotificationEmptyState = ({ chainName, onCreate }: NotificationEmptyStateProps) => (
  <NotificationCardShell>
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
        <BellIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
      </div>
      <h3 className="text-sm font-semibold text-base-content dark:text-white mb-1">Notification Settings</h3>
      <p className="text-xs text-base-content/70 dark:text-gray-400 mb-4 max-w-[240px]">
        Get alerts when your Health Factor on {chainName} drops below a threshold you choose.
      </p>
      <button
        onClick={onCreate}
        className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/20"
      >
        Create notification config
      </button>
    </div>
  </NotificationCardShell>
);
