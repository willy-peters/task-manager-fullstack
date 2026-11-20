/* ------------------------------------------------------------------ */
/* Dates                                                              */
/* ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

/** "2025-10-24T10:00:00Z" → "Oct 24, 2025" (matches the dashboard mock) */
export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
}

/** Short relative time used for "updated" hints. */
export function formatRelative(value, now = Date.now()) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(date);
}

/** "00:07s" style timer label used by the cold-start banner. */
export function formatElapsed(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}s`;
}

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

/** "Ada Lovelace" → "AL", "Ada" → "AD", "" → "?" */
export function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Task status metadata (mapped onto the Stitch pill styles)           */
/* ------------------------------------------------------------------ */

export const STATUS_META = {
  pending: {
    value: 'pending',
    label: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-900',
    dotClass: 'bg-amber-500',
    selectedClass: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300',
    icon: 'schedule',
    hint: 'Queued in the backlog',
  },
  'in-progress': {
    value: 'in-progress',
    label: 'In Progress',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed-variant',
    dotClass: 'bg-primary-container',
    selectedClass: 'bg-primary-fixed text-on-primary-fixed-variant ring-1 ring-primary-fixed-dim',
    icon: 'autorenew',
    hint: 'Actively being worked on',
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    dotClass: 'bg-tertiary',
    selectedClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant ring-1 ring-tertiary-fixed-dim',
    icon: 'task_alt',
    hint: 'Done and delivered',
  },
};

export const STATUS_OPTIONS = Object.values(STATUS_META);

export function getStatusMeta(status) {
  return STATUS_META[status] ?? STATUS_META.pending;
}

/* ------------------------------------------------------------------ */
/* CSV export (RFC 4180)                                              */
/* ------------------------------------------------------------------ */

function escapeCsvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function tasksToCsv(tasks) {
  const header = ['Title', 'Description', 'Status', 'Created', 'Updated'];
  const rows = tasks.map((task) => [
    task.title,
    task.description ?? '',
    getStatusMeta(task.status).label,
    task.createdAt ? new Date(task.createdAt).toISOString() : '',
    task.updatedAt ? new Date(task.updatedAt).toISOString() : '',
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

export function downloadCsv(tasks, filename = `tasks-${new Date().toISOString().slice(0, 10)}.csv`) {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(['\ufeff', tasksToCsv(tasks)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return filename;
}
