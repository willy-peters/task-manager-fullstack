import { useEffect, useState } from 'react';

export default function DeleteConfirmModal({ task, onCancel, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!task) return undefined;
    setIsDeleting(false);
    setError('');
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [task, isDeleting, onCancel]);

  if (!task) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm(task);
    } catch (err) {
      setError(err?.message || 'Failed to delete task.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-inverse-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-level3 p-space-lg animate-scale-in">
        <div className="flex items-start gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">delete_forever</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="delete-modal-title" className="text-headline-md text-on-surface">
              Delete Task
            </h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-on-surface">&ldquo;{task.title}&rdquo;</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-space-sm text-body-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-space-lg flex items-center justify-end gap-space-sm">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="btn-secondary min-h-[44px] sm:min-h-0"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="btn-danger min-h-[44px] sm:min-h-0"
          >
            {isDeleting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Task</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
