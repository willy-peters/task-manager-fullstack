export default function StatsGrid({ tasks }) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const active = pending + inProgress;

  return (
    <section aria-label="Task metrics" className="grid grid-cols-3 gap-2.5 md:gap-space-lg mb-space-lg md:mb-8">
      {/* Stat 1: Total Tasks */}
      <div className="card p-3 md:p-space-lg flex flex-col md:flex-row md:items-center justify-between transition-all hover:shadow-level2">
        <div className="w-7 h-7 md:hidden rounded-lg bg-primary-fixed flex items-center justify-center text-primary mb-2">
          <span className="material-symbols-outlined text-[16px]">layers</span>
        </div>
        <div>
          <span className="hidden md:block text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Total Tasks
          </span>
          <div className="flex items-baseline gap-2 md:mt-1">
            <span className="text-headline-md md:text-display-lg text-on-surface leading-none md:leading-tight">
              {total}
            </span>
          </div>
          <span className="md:hidden text-label-sm text-on-surface-variant tracking-normal block mt-1">
            Total Tasks
          </span>
        </div>
        <div className="hidden md:flex w-12 h-12 rounded-xl bg-surface-container-low items-center justify-center text-primary-container">
          <span className="material-symbols-outlined text-[24px]">assignment</span>
        </div>
      </div>

      {/* Stat 2: Active (Pending + In Progress) */}
      <div className="card p-3 md:p-space-lg flex flex-col md:flex-row md:items-center justify-between transition-all hover:shadow-level2">
        <div className="w-7 h-7 md:hidden rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-2">
          <span className="material-symbols-outlined text-[16px]">pending_actions</span>
        </div>
        <div>
          <span className="hidden md:block text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Active
          </span>
          <div className="flex items-baseline gap-2 md:mt-1">
            <span className="text-headline-md md:text-display-lg text-on-surface leading-none md:leading-tight">
              {active}
            </span>
            <span className="hidden lg:inline text-label-sm text-secondary font-medium">
              {pending} pending · {inProgress} in progress
            </span>
          </div>
          <span className="md:hidden text-label-sm text-on-surface-variant tracking-normal block mt-1">
            Active
          </span>
        </div>
        <div className="hidden md:flex w-12 h-12 rounded-xl bg-surface-container-low items-center justify-center text-secondary">
          <span className="material-symbols-outlined text-[24px]">schedule</span>
        </div>
      </div>

      {/* Stat 3: Completed (without completion rate) */}
      <div className="card p-3 md:p-space-lg flex flex-col md:flex-row md:items-center justify-between transition-all hover:shadow-level2">
        <div className="w-7 h-7 md:hidden rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed mb-2">
          <span className="material-symbols-outlined text-[16px]">task_alt</span>
        </div>
        <div>
          <span className="hidden md:block text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Completed
          </span>
          <div className="flex items-baseline gap-2 md:mt-1">
            <span className="text-headline-md md:text-display-lg text-on-surface leading-none md:leading-tight">
              {completed}
            </span>
          </div>
          <span className="md:hidden text-label-sm text-on-surface-variant tracking-normal block mt-1">
            Done
          </span>
        </div>
        <div className="hidden md:flex w-12 h-12 rounded-xl bg-secondary-container items-center justify-center text-tertiary">
          <span className="material-symbols-outlined text-[24px]">task_alt</span>
        </div>
      </div>
    </section>
  );
}
