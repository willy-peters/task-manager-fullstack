import { formatDate } from '../../utils/formatters.js';
import StatusBadge from './StatusBadge.jsx';

export default function TaskListRow({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isMutating,
}) {
  const isCompleted = task.status === 'completed';

  return (
    <article
      data-testid={`task-row-${task._id}`}
      className={`bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container-low last:border-b-0 ${
        isCompleted ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={isCompleted}
          disabled={isMutating}
          onChange={() => onToggleComplete(task)}
          aria-label={isCompleted ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
          className="mt-1 sm:mt-0 w-4 h-4 rounded text-primary-container accent-primary-container cursor-pointer shrink-0 focus-ring"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-headline-sm font-semibold truncate ${
                isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'
              }`}
            >
              {task.title}
            </h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p
              className={`text-body-sm text-on-surface-variant truncate mt-0.5 ${
                isCompleted ? 'line-through' : ''
              }`}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-space-md shrink-0 pl-7 sm:pl-0">
        <span className="text-body-sm text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
          {formatDate(task.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            className="focus-ring min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2 sm:py-1 rounded-lg text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors inline-flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[16px]">edit</span>
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Delete "${task.title}"`}
            className="focus-ring min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2 sm:py-1 rounded-lg text-label-md text-error hover:bg-error-container transition-colors inline-flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[16px]">delete</span>
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
