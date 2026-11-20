export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tasks">
      {/* Stat Skeletons */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-space-lg mb-space-lg md:mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-3 md:p-5 shadow-level1"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="h-3.5 w-16 md:w-24 skeleton rounded-full" />
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-surface-container-high animate-pulse" />
            </div>
            <div className="h-7 md:h-8 w-12 md:w-16 skeleton rounded-lg mb-2 md:mb-3" />
            <div className="hidden md:flex items-center gap-2">
              <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
            </div>
            <div className="shimmer" />
          </div>
        ))}
      </div>

      {/* Syncing Indicator */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-headline-md text-on-surface">Active Backlog</h2>
          <div className="h-5 w-7 rounded-full bg-surface-container-high animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-on-surface-variant">Syncing database state…</span>
          <div className="w-3.5 h-3.5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      {/* 6 Task Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-level1 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 skeleton rounded-full" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-surface-container-high animate-pulse" />
                  <div className="w-6 h-6 rounded bg-surface-container-high animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-4/5 skeleton rounded-md" />
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-full bg-surface-container-high rounded animate-pulse" />
                <div className="h-3.5 w-2/3 bg-surface-container-high rounded animate-pulse" />
              </div>
            </div>
            <div className="mt-6 pt-4 flex items-center justify-between bg-surface-container-low/40 -mx-5 -mb-5 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded skeleton" />
                <div className="h-3 w-20 skeleton rounded" />
              </div>
              <div className="w-6 h-6 rounded-full skeleton" />
            </div>
            <div className="shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
