import { describe, expect, test } from 'vitest';
import {
  STATUS_OPTIONS,
  formatDate,
  formatElapsed,
  formatRelative,
  getInitials,
  getStatusMeta,
  tasksToCsv,
} from '../utils/formatters.js';

describe('formatDate', () => {
  test('formats like the dashboard mock ("Oct 24, 2025")', () => {
    expect(formatDate(new Date(2025, 9, 24, 12))).toBe('Oct 24, 2025');
    expect(formatDate(new Date(2025, 10, 2, 12).toISOString())).toBe('Nov 02, 2025');
  });

  test('returns an empty string for missing or invalid input', () => {
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('not a date')).toBe('');
  });
});

describe('formatRelative', () => {
  const now = new Date(2025, 9, 24, 12).getTime();
  test.each([
    [now - 10_000, 'just now'],
    [now - 5 * 60_000, '5 min ago'],
    [now - 3 * 3_600_000, '3 h ago'],
    [now - 24 * 3_600_000, 'yesterday'],
    [now - 3 * 86_400_000, '3 days ago'],
  ])('%s → %s', (value, expected) => {
    expect(formatRelative(value, now)).toBe(expected);
  });

  test('falls back to the absolute date after a week', () => {
    expect(formatRelative(new Date(2025, 9, 1, 12), now)).toBe('Oct 01, 2025');
  });
});

describe('formatElapsed', () => {
  test('pads minutes and seconds', () => {
    expect(formatElapsed(0)).toBe('00:00s');
    expect(formatElapsed(8)).toBe('00:08s');
    expect(formatElapsed(75)).toBe('01:15s');
    expect(formatElapsed(-3)).toBe('00:00s');
  });
});

describe('getInitials', () => {
  test.each([
    ['Ada Lovelace', 'AL'],
    ['  sarah   jane connor ', 'SC'],
    ['Ada', 'AD'],
    ['', '?'],
    [undefined, '?'],
  ])('%s → %s', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});

describe('status metadata', () => {
  test('covers exactly the three API statuses in order', () => {
    expect(STATUS_OPTIONS.map((s) => s.value)).toEqual(['pending', 'in-progress', 'completed']);
    expect(STATUS_OPTIONS.map((s) => s.label)).toEqual(['Pending', 'In Progress', 'Completed']);
  });

  test('maps statuses onto the Stitch semantic colors', () => {
    expect(getStatusMeta('pending').badgeClass).toContain('amber');
    expect(getStatusMeta('in-progress').badgeClass).toContain('primary-fixed');
    expect(getStatusMeta('completed').badgeClass).toContain('tertiary-fixed');
  });

  test('falls back to pending for unknown values', () => {
    expect(getStatusMeta('archived').value).toBe('pending');
  });
});

describe('tasksToCsv', () => {
  test('produces an RFC 4180 compliant document', () => {
    const csv = tasksToCsv([
      {
        title: 'Write "docs", then ship',
        description: 'Line one\nLine two',
        status: 'in-progress',
        createdAt: '2025-10-24T10:00:00.000Z',
        updatedAt: '2025-10-25T10:00:00.000Z',
      },
      { title: 'Plain', status: 'completed' },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Title,Description,Status,Created,Updated');
    expect(csv).toContain('"Write ""docs"", then ship","Line one\nLine two",In Progress,2025-10-24T10:00:00.000Z,2025-10-25T10:00:00.000Z');
    expect(lines[lines.length - 1]).toBe('Plain,,Completed,,');
  });

  test('returns only the header for an empty list', () => {
    expect(tasksToCsv([])).toBe('Title,Description,Status,Created,Updated');
  });
});
