import { getStatusMeta } from '../../utils/formatters.js';

export default function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`shrink-0 px-2 py-0.5 rounded-full text-label-sm uppercase font-semibold tracking-wide inline-flex items-center gap-1 ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}
