export default function FilterToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  counts,
  visibleCount,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
}) {
  const statusTabs = [
    { value: 'all', label: 'All', count: counts.all },
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'in-progress', label: 'In Progress', count: counts.inProgress },
    { value: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <section
      aria-label="Search and filter tasks"
      className="card p-space-md mb-space-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md"
    >
      <div className="flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap items-stretch md:items-center gap-space-sm md:gap-space-md flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] lg:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            aria-label="Search tasks"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 md:h-10 bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant text-body-md rounded-lg pl-9 pr-9 outline-none transition-all focus:shadow-[0_0_0_2px_rgba(79,70,229,0.25)]"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* Segmented Status Control */}
        <div
          role="tablist"
          aria-label="Filter by status"
          className="inline-flex p-1 bg-surface-container-low rounded-lg overflow-x-auto scrollbar-none shrink-0"
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onStatusChange(tab.value)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-label-md whitespace-nowrap transition-all ${
                  active
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Sort Order Select */}
        <div className="relative w-full md:w-44 shrink-0">
          <select
            aria-label="Sort tasks"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full h-11 md:h-10 appearance-none bg-surface-container-low focus:bg-surface-container-lowest text-on-surface text-body-md rounded-lg pl-3 pr-8 outline-none transition-all cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-asc">Title (A–Z)</option>
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
            expand_more
          </span>
        </div>
      </div>

      {/* Right Controls: Clear + View Switcher */}
      <div className="flex items-center justify-between lg:justify-end gap-space-sm shrink-0">
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-on-surface-variant hover:text-primary text-label-md transition-colors flex items-center gap-1 px-2 py-1 rounded-lg focus-ring"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">close</span>
            <span>Clear filters</span>
          </button>
        ) : (
          <span className="text-body-sm text-on-surface-variant lg:hidden">
            {visibleCount} visible
          </span>
        )}

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md transition-colors focus-ring ${
              viewMode === 'grid'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-md transition-colors focus-ring ${
              viewMode === 'list'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_list</span>
          </button>
        </div>
      </div>
    </section>
  );
}
