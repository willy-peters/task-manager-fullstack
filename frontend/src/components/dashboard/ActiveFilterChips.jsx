import { getStatusMeta } from '../../utils/formatters.js';

const SORT_LABELS = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  'title-asc': 'Title (A–Z)',
};

export default function ActiveFilterChips({
  searchQuery,
  statusFilter,
  sortBy,
  onClearSearch,
  onClearStatus,
  onClearSort,
  onResetAll,
}) {
  const hasSearch = Boolean(searchQuery.trim());
  const hasStatus = statusFilter !== 'all';
  const hasSort = sortBy !== 'newest';

  if (!hasSearch && !hasStatus && !hasSort) return null;

  return (
    <div
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-space-sm mb-space-md"
    >
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
        Active filters:
      </span>

      {hasSearch && (
        <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 bg-surface-container-high rounded-full text-label-sm text-on-surface">
          <span>Search: &ldquo;{searchQuery.trim()}&rdquo;</span>
          <button
            type="button"
            aria-label="Remove search filter"
            onClick={onClearSearch}
            className="hover:text-error text-on-surface-variant inline-flex items-center"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </span>
      )}

      {hasStatus && (
        <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 bg-surface-container-high rounded-full text-label-sm text-on-surface">
          <span>Status: {getStatusMeta(statusFilter).label}</span>
          <button
            type="button"
            aria-label="Remove status filter"
            onClick={onClearStatus}
            className="hover:text-error text-on-surface-variant inline-flex items-center"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </span>
      )}

      {hasSort && (
        <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 bg-surface-container-high rounded-full text-label-sm text-on-surface">
          <span>Sort: {SORT_LABELS[sortBy] ?? sortBy}</span>
          <button
            type="button"
            aria-label="Reset sort order"
            onClick={onClearSort}
            className="hover:text-error text-on-surface-variant inline-flex items-center"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onResetAll}
        className="text-label-sm text-primary font-semibold hover:underline ml-space-xs"
      >
        Reset all
      </button>
    </div>
  );
}
