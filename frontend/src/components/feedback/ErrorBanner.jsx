export default function ErrorBanner({
  title = 'Synchronization Failed',
  message,
  onRetry,
  isRetrying = false,
  onDismiss,
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="w-full bg-error-container text-on-error-container rounded-xl p-space-md shadow-sm mb-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md"
    >
      <div className="flex items-center gap-space-md min-w-0">
        <div className="w-9 h-9 rounded-lg bg-error/15 flex items-center justify-center shrink-0 text-error">
          <span className="material-symbols-outlined icon-filled text-[22px]">error</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-headline-sm text-on-error-container font-semibold truncate">
            {title}
          </span>
          <span className="text-body-md text-on-error-container/85">{message}</span>
        </div>
      </div>

      <div className="flex items-center gap-space-sm shrink-0 self-end sm:self-auto">
        {onRetry && (
          <button
            type="button"
            disabled={isRetrying}
            onClick={onRetry}
            className="btn-danger px-space-md py-1.5"
          >
            <span
              aria-hidden="true"
              className={`material-symbols-outlined text-[16px] ${
                isRetrying ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-error-container/70 hover:text-on-error-container hover:bg-error/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
