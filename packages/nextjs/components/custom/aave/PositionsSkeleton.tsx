const CARD_COUNT = 4;
const STAT_COUNT = 3;

type PositionsSkeletonProps = {
  columns: 1 | 2;
};

export const PositionsSkeleton = ({ columns }: PositionsSkeletonProps) => (
  <div className={`grid ${columns === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"} gap-4`}>
    {Array.from({ length: CARD_COUNT }, (_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-gray-900/80 dark:to-gray-800/50 p-5 animate-pulse"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-base-300 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-base-300 dark:bg-white/10 rounded" />
              <div className="h-3 w-16 bg-base-300 dark:bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-base-300 dark:bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: STAT_COUNT }, (_, j) => (
            <div key={j} className="bg-base-200 dark:bg-white/5 rounded-xl p-3">
              <div className="h-2 w-12 bg-base-300 dark:bg-white/10 rounded mb-2" />
              <div className="h-5 w-16 bg-base-300 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
