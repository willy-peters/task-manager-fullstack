import { formatElapsed } from '../../utils/formatters.js';

export default function ColdStartBanner({ elapsedSeconds = 0 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full mb-space-lg relative overflow-hidden rounded-xl bg-surface-container-high px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5 z-10">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary-fixed text-primary shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <span className="text-headline-sm text-on-surface">Waking up the server…</span>
          <span className="text-body-md text-on-surface-variant">
            Cold start in progress on Render free tier (takes ~15–30s)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm z-10">
        <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
        <span className="text-label-md text-on-surface-variant font-mono">
          {formatElapsed(elapsedSeconds)} elapsed
        </span>
      </div>

      <div className="shimmer" />
    </div>
  );
}
