import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App.jsx';
import * as authApi from '../api/authApi.js';
import * as tasksApi from '../api/tasksApi.js';
import { ApiError, TOKEN_KEY } from '../api/client.js';
import { AuthProvider } from '../context/AuthContext.jsx';

vi.mock('../api/authApi.js', () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  getCurrentUser: vi.fn(),
  pingHealth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../api/tasksApi.js', () => ({
  fetchTasks: vi.fn(),
  fetchTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const sampleTasks = [
  {
    _id: 't1',
    title: 'Beta Endpoint Audit',
    description: 'Check rate limiting on public endpoints.',
    status: 'pending',
    createdAt: '2025-10-24T10:00:00.000Z',
  },
  {
    _id: 't2',
    title: 'Alpha Auth Migration',
    description: 'Upgrade JWT secret rotation.',
    status: 'in-progress',
    createdAt: '2025-10-20T10:00:00.000Z',
  },
  {
    _id: 't3',
    title: 'Gamma UI Polish',
    description: 'Verify responsive spacing.',
    status: 'completed',
    createdAt: '2025-10-18T10:00:00.000Z',
  },
];

function renderDashboard() {
  localStorage.setItem(TOKEN_KEY, 'valid-jwt');
  authApi.getCurrentUser.mockResolvedValue({
    _id: 'u1',
    name: 'Sarah Connor',
    email: 'sarah@taskflow.io',
  });

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Phase 5 Search, Filtering, Empty & Error States', () => {
  test('real-time search, status tabs, sort order, active chips, and view switcher', async () => {
    const user = userEvent.setup();
    tasksApi.fetchTasks.mockResolvedValue(sampleTasks);
    renderDashboard();

    await screen.findByText('Beta Endpoint Audit');

    // Search matches description
    const searchInput = screen.getByLabelText(/search tasks/i);
    await user.type(searchInput, 'jwt');
    expect(screen.getByText('Alpha Auth Migration')).toBeInTheDocument();
    expect(screen.queryByText('Beta Endpoint Audit')).not.toBeInTheDocument();
    expect(screen.getByText('1 visible')).toBeInTheDocument();

    // Active filter chip appears and can remove search
    const activeFilters = screen.getByLabelText('Active filters');
    expect(within(activeFilters).getByText(/search:\s*.jwt./i)).toBeInTheDocument();
    await user.click(within(activeFilters).getByRole('button', { name: /remove search filter/i }));
    expect(screen.getAllByText('3 visible').length).toBeGreaterThan(0);

    // Status tab filter
    await user.click(screen.getByRole('tab', { name: /completed \(1\)/i }));
    expect(screen.getByText('Gamma UI Polish')).toBeInTheDocument();
    expect(screen.queryByText('Beta Endpoint Audit')).not.toBeInTheDocument();

    // Reset all restores everything
    await user.click(screen.getByRole('button', { name: /reset all/i }));
    expect(screen.getAllByText('3 visible').length).toBeGreaterThan(0);

    // Sort order: Title (A–Z)
    await user.selectOptions(screen.getByLabelText(/sort tasks/i), 'title-asc');
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Alpha Auth Migration',
      'Beta Endpoint Audit',
      'Gamma UI Polish',
    ]);

    // Grid / List view toggle
    await user.click(screen.getByRole('button', { name: /list view/i }));
    expect(screen.getByTestId('task-row-t1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /grid view/i }));
    expect(screen.getByTestId('task-card-t1')).toBeInTheDocument();
  });

  test('filtered zero-state offers Clear filters and pre-filled Create task CTA', async () => {
    const user = userEvent.setup();
    tasksApi.fetchTasks.mockResolvedValue(sampleTasks);
    renderDashboard();

    await screen.findByText('Beta Endpoint Audit');

    await user.type(screen.getByLabelText(/search tasks/i), 'nonexistent query');
    expect(screen.getByRole('heading', { name: /no tasks match your filters/i })).toBeInTheDocument();

    // Clicking "Create ... task" opens Add modal pre-filled
    await user.click(screen.getByRole('button', { name: /create .*nonexistent query.* task/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText(/task title/i)).toHaveValue('nonexistent query');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    // Clicking Clear filters restores list
    const clearButtons = screen.getAllByRole('button', { name: /^clear filters$/i });
    await user.click(clearButtons[clearButtons.length - 1]);
    expect(screen.getByText('Beta Endpoint Audit')).toBeInTheDocument();
  });

  test('first-time empty workspace renders "No tasks yet" with Add Task CTA', async () => {
    const user = userEvent.setup();
    tasksApi.fetchTasks.mockResolvedValue([]);
    renderDashboard();

    expect(await screen.findByRole('heading', { name: /no tasks yet/i })).toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: /^add task$/i });
    await user.click(addButtons[addButtons.length - 1]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('renders loading skeletons while fetching and ErrorBanner with Retry recovery', async () => {
    const user = userEvent.setup();
    let rejectFirst;
    tasksApi.fetchTasks.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectFirst = reject;
        })
    );

    renderDashboard();

    expect(await screen.findByLabelText(/loading tasks/i)).toBeInTheDocument();

    rejectFirst(new ApiError({ message: 'Network unreachable', isNetworkError: true }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/network unreachable/i);

    tasksApi.fetchTasks.mockResolvedValueOnce(sampleTasks);
    await user.click(within(alert).getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Beta Endpoint Audit')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
