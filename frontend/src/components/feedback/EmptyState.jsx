export default function EmptyState({
  variant = 'empty',
  searchQuery = '',
  onAddTask,
  onClearFilters,
  onCreateFromSearch,
}) {
  if (variant === 'filtered') {
    const trimmed = searchQuery.trim();
    return (
      <div className="w-full card p-space-xl md:py-20 flex flex-col items-center justify-center text-center">
        <div className="relative w-24 h-24 mb-space-lg flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary-fixed/40" />
          <div className="relative w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[32px]">search_off</span>
          </div>
        </div>

        <h2 className="text-headline-lg text-on-surface font-semibold mb-space-xs">
          No tasks match your filters
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-md mx-auto mb-space-lg">
          Try adjusting your search keywords, clearing your active status filter, or creating a new
          task.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-space-md">
          <button
            type="button"
            onClick={onClearFilters}
            className="btn-secondary px-space-lg py-2"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">filter_alt_off</span>
            <span>Clear filters</span>
          </button>
          {trimmed && onCreateFromSearch && (
            <button
              type="button"
              onClick={() => onCreateFromSearch(trimmed)}
              className="btn-primary px-space-lg py-2"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add_task</span>
              <span>Create &ldquo;{trimmed}&rdquo; task</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full card p-space-xl md:py-20 flex flex-col items-center justify-center text-center">
      <div className="relative w-24 h-24 mb-space-lg flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-secondary-container/35 -rotate-6" />
        <div className="relative w-16 h-20 rounded-xl bg-surface-container-low shadow-sm flex flex-col items-center pt-3 px-3">
          <div className="w-8 h-1.5 rounded-full bg-secondary mb-2.5" />
          <div className="w-full h-1.5 rounded-full bg-outline-variant/60 mb-2" />
          <div className="w-3/4 h-1.5 rounded-full bg-outline-variant/40 mb-2 self-start" />
          <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center mt-auto mb-1">
            <span className="material-symbols-outlined text-[12px]">add</span>
          </div>
        </div>
      </div>

      <h2 className="text-headline-lg text-on-surface font-semibold mb-space-xs">No tasks yet</h2>
      <p className="text-body-lg text-on-surface-variant max-w-sm mx-auto mb-space-lg">
        Create your first task to get started organizing your backlog and tracking progress.
      </p>

      <button
        type="button"
        onClick={onAddTask}
        className="btn-primary px-space-xl py-2.5 shadow-md"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">add</span>
        <span>Add Task</span>
      </button>
    </div>
  );
}
