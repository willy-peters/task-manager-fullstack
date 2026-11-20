import { useEffect, useState } from 'react';
import { STATUS_OPTIONS } from '../../utils/formatters.js';

export default function TaskModal({
  isOpen,
  mode = 'add',
  task = null,
  initialTitle = '',
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit' && Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && task) {
      setTitle(task.title ?? '');
      setDescription(task.description ?? '');
      setStatus(task.status ?? 'pending');
    } else {
      setTitle(initialTitle ?? '');
      setDescription('');
      setStatus('pending');
    }
    setFieldErrors({});
    setSubmitError('');
    setIsSaving(false);
  }, [isOpen, isEdit, task, initialTitle]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const trimmedTitle = title.trim();
  const isTitleValid = trimmedTitle.length >= 3 && trimmedTitle.length <= 100;

  const validate = () => {
    const errors = {};
    if (trimmedTitle.length < 3) {
      errors.title = 'Task title must be at least 3 characters.';
    } else if (trimmedTitle.length > 100) {
      errors.title = 'Task title cannot exceed 100 characters.';
    }
    if (description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        status,
      });
      onClose();
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setSubmitError(err?.message || 'Could not save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-space-md bg-inverse-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      {/* Centered modal on sm+, bottom sheet on mobile (< 640px) */}
      <div className="w-full sm:max-w-xl max-h-[90dvh] bg-surface-container-lowest rounded-t-[24px] sm:rounded-xl shadow-sheet sm:shadow-level3 overflow-hidden flex flex-col animate-slide-up sm:animate-scale-in">
        {/* Mobile grab handle */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-surface-container-highest" />
        </div>

        {/* Header */}
        <div className="px-gutter-sm sm:px-space-lg pt-3 sm:pt-space-lg pb-space-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">
                {isEdit ? 'edit_note' : 'add_task'}
              </span>
            </div>
            <h2 id="task-modal-title" className="text-headline-md text-on-surface">
              {isEdit ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            disabled={isSaving}
            onClick={onClose}
            className="focus-ring w-11 h-11 sm:w-8 sm:h-8 rounded-full sm:rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          id="task-modal-form"
          className="px-gutter-sm sm:px-space-lg py-space-sm space-y-space-md overflow-y-auto flex-1"
          noValidate
          onSubmit={handleSubmit}
        >
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-error-container text-on-error-container p-space-sm px-space-md text-body-sm"
            >
              <span className="material-symbols-outlined icon-filled text-[18px] text-error mt-0.5">
                error
              </span>
              <span>{submitError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-label-lg text-on-surface flex items-center gap-1" htmlFor="task-title-input">
                <span>Task Title</span>
                <span className="text-error font-bold">*</span>
              </label>
              <span className="text-body-sm text-on-surface-variant">
                {title.length}/100
              </span>
            </div>
            <div className="relative">
              <input
                id="task-title-input"
                name="title"
                type="text"
                maxLength={100}
                placeholder="e.g., Configure production telemetry pipelines"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.title)}
                className={`input pr-10 ${fieldErrors.title ? 'input-error' : ''}`}
              />
              {isTitleValid && !fieldErrors.title && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
              )}
            </div>
            {fieldErrors.title ? (
              <p className="text-body-sm text-error" role="alert">
                {fieldErrors.title}
              </p>
            ) : (
              <p className="text-body-sm text-on-surface-variant">
                Minimum 3 characters, up to 100 characters.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-label-lg text-on-surface" htmlFor="task-desc-input">
                Description
              </label>
              <span className="text-body-sm text-on-surface-variant">
                {description.length}/500
              </span>
            </div>
            <textarea
              id="task-desc-input"
              name="description"
              rows={3}
              maxLength={500}
              placeholder="Add relevant notes, acceptance criteria, or context..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
              }}
              aria-invalid={Boolean(fieldErrors.description)}
              className={`input resize-none ${fieldErrors.description ? 'input-error' : ''}`}
            />
            {fieldErrors.description && (
              <p className="text-body-sm text-error" role="alert">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Status Pill Radio Selector */}
          <div className="space-y-2 pb-2">
            <span className="text-label-lg text-on-surface block">Status</span>
            <div role="radiogroup" aria-label="Task Status" className="grid grid-cols-3 gap-space-xs">
              {STATUS_OPTIONS.map((opt) => {
                const checked = status === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center h-11 px-space-xs rounded-lg cursor-pointer text-label-md select-none transition-all ${
                      checked
                        ? `${opt.selectedClass} font-semibold shadow-sm`
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setStatus(opt.value)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${opt.dotClass}`} />
                      <span>{opt.label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        {/* Sticky Footer with explicit bottom padding */}
        <div className="px-gutter-sm sm:px-space-lg pt-space-md pb-6 sm:pb-space-lg bg-surface-container-lowest border-t border-surface-container-low flex items-center justify-end gap-space-sm">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="btn-secondary min-h-[48px] sm:min-h-0 px-space-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-modal-form"
            disabled={isSaving}
            className="btn-primary flex-1 sm:flex-initial min-h-[48px] sm:min-h-0 px-space-xl font-semibold"
          >
            {isSaving ? (
              <>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  {isEdit ? 'save' : 'check'}
                </span>
                <span>{isEdit ? 'Save Changes' : 'Create Task'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
