export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-space-sm rounded-xl px-space-md py-3 shadow-level3 animate-toast-in ${
        isError
          ? 'bg-error-container text-on-error-container'
          : 'bg-inverse-surface text-inverse-on-surface'
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${
          isError ? 'text-error' : 'text-tertiary-fixed'
        }`}
      >
        {isError ? 'error' : 'check_circle'}
      </span>
      <span className="text-label-lg">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
