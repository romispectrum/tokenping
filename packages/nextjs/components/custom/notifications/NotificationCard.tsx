import type { ReactNode } from "react";
import { ActiveBadge } from "~~/components/custom/notifications/ActiveBadge";
import { BellIcon } from "~~/components/custom/notifications/BellIcon";

export const NotificationCardShell = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 rounded-xl border border-primary/30 bg-base-100 dark:border-purple-500/20 dark:bg-gradient-to-br dark:from-purple-950/30 dark:to-gray-900/50 backdrop-blur-xl p-4">
    {children}
  </div>
);

type NotificationCardProps = {
  isActive: boolean;
  /** Rendered at the right end of the header row. */
  headerRight?: ReactNode;
  children: ReactNode;
};

export const NotificationCard = ({ isActive, headerRight, children }: NotificationCardProps) => (
  <NotificationCardShell>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <BellIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-sm font-semibold text-base-content dark:text-white">Notification Settings</h3>
        {isActive && <ActiveBadge />}
      </div>
      {headerRight}
    </div>
    {children}
  </NotificationCardShell>
);
