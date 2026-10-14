import { ChainIcon } from "~~/components/custom/aave/ChainIcon";
import type { NetworkPosition } from "~~/services/aave/positions";
import { formatUSD } from "~~/utils/format";

type NetworkSummaryRowProps = {
  position: NetworkPosition;
  isSelected: boolean;
  onSelect: () => void;
  hasNotification: boolean;
};

export const NetworkSummaryRow = ({ position, isSelected, onSelect, hasNotification }: NetworkSummaryRowProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={[
      "w-full text-left rounded-xl border backdrop-blur-xl transition-all",
      "px-2.5 py-1.5 flex items-center justify-between gap-2",
      isSelected
        ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10 dark:border-purple-500/40 dark:bg-purple-500/10 dark:shadow-purple-500/10"
        : "border-base-300 bg-base-200 hover:bg-base-300 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20",
    ].join(" ")}
  >
    <div className="flex items-center gap-2 min-w-0">
      <ChainIcon icon={position.chainIcon} color={position.chainColor} size="sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-base-content dark:text-white truncate text-[13px] leading-none">
            {position.chainName}
          </p>
          {position.hasPosition ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 leading-none">
              Active
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-base-300 bg-base-200 text-base-content/70 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 leading-none">
              Empty
            </span>
          )}
          {hasNotification && (
            <svg
              className="w-3.5 h-3.5 text-primary dark:text-purple-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          )}
        </div>
        <p className="hidden sm:block text-[10px] text-base-content/70 dark:text-gray-400 truncate leading-tight mt-0.5">
          {formatUSD(position.totalCollateralUSD)} supplied · {formatUSD(position.totalDebtUSD)} borrowed
        </p>
      </div>
    </div>

    <div className="shrink-0">
      {position.hasPosition ? (
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-base-300 bg-base-200 text-base-content dark:bg-white/5 dark:border-white/10 dark:text-gray-200 leading-none">
          HF {position.healthFactor}
        </span>
      ) : null}
    </div>
  </button>
);
