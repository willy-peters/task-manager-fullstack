import { formatDate, getStatusMeta } from '../../utils/formatters.js';
import StatusBadge from './StatusBadge.jsx';

export default function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isMutating,
}) {
  const isCompleted = task.status === 'completed';
  const meta = getStatusMeta(task.status);

  return (
    <article
      data-testid={`task-card-${task._id}`}
      className={`rounded-xl p-space-md shadow-level1 hover:shadow-level2 transition-all flex flex-col justify-between ${
        isCompleted ? 'bg-surface-container-lowest/70 opacity-75' : 'bg-surface-container-lowest'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-space-sm mb-2.5">
          <h3
            className={`text-headline-sm font-semibold tracking-tight break-words ${
              isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'
            }`}
          >
            {task.title}
          </h3>
          <StatusBadge status={task.status} />
        </div>

        <p
          className={`text-body-md line-clamp-2 mb-4 break-words ${
            task.description ? 'text-on-surface-variant' : 'text-outline italic'
          } ${isCompleted ? 'line-through' : ''}`}
        >
          {task.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-3 border-t border-surface-container-low">
        <div className="flex items-center justify-between mb-2 text-body-sm text-on-surface-variant">
          <label className="flex items-center gap-2 cursor-pointer select-none min-h-[36px]">
            <input
              type="checkbox"
              checked={isCompleted}
              disabled={isMutating}
              onChange={() => onToggleComplete(task)}
              aria-label={isCompleted ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
              className="w-4 h-4 rounded text-primary-container accent-primary-container cursor-pointer focus-ring"
            />
            <span
              className={`text-label-md ${
                isCompleted ? 'text-tertiary font-semibold' : 'text-on-surface'
              }`}
            >
              {isCompleted ? 'Done' : meta.label}
            </span>
          </label>

          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>{formatDate(task.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit "${task.title}"`}
              className="focus-ring min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2.5 sm:py-1 rounded-lg text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors inline-flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[16px]">edit</span>
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label={`Delete "${task.title}"`}
              className="focus-ring min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-2.5 sm:py-1 rounded-lg text-label-md text-error hover:bg-error-container transition-colors inline-flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[16px]">delete</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
