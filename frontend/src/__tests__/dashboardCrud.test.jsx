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
    title: 'Database Migration to Aurora',
    description: 'Migrate production read-replicas.',
    status: 'pending',
    createdAt: '2025-10-24T10:00:00.000Z',
    updatedAt: '2025-10-24T10:00:00.000Z',
  },
  {
    _id: 't2',
    title: 'Revamp Authentication Flows',
    description: 'Implement token rotation.',
    status: 'in-progress',
    createdAt: '2025-10-22T10:00:00.000Z',
    updatedAt: '2025-10-22T10:00:00.000Z',
  },
  {
    _id: 't3',
    title: 'Security Audit Remediation',
    description: 'Update CORS whitelist.',
    status: 'completed',
    createdAt: '2025-10-18T10:00:00.000Z',
    updatedAt: '2025-10-18T10:00:00.000Z',
  },
];

function renderDashboard(initialTasks = sampleTasks) {
  localStorage.setItem(TOKEN_KEY, 'valid-jwt');
  authApi.getCurrentUser.mockResolvedValue({
    _id: 'u1',
    name: 'Sarah Connor',
    email: 'sarah@taskflow.io',
  });
  tasksApi.fetchTasks.mockResolvedValue(initialTasks);

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

describe('Phase 4 Dashboard CRUD & Metrics', () => {
  test('renders tasks and calculates KPI metrics accurately', async () => {
    renderDashboard();

    expect(await screen.findByText('Database Migration to Aurora')).toBeInTheDocument();
    expect(screen.getByText('Revamp Authentication Flows')).toBeInTheDocument();
    expect(screen.getByText('Security Audit Remediation')).toBeInTheDocument();

    const stats = screen.getByLabelText('Task metrics');
    expect(within(stats).getByText('3')).toBeInTheDocument(); // Total
    expect(within(stats).getByText('2')).toBeInTheDocument(); // Active (1 pending + 1 in-progress)
    expect(within(stats).getByText('1')).toBeInTheDocument(); // Completed
    expect(within(stats).queryByText(/rate/i)).not.toBeInTheDocument();

    // Dark/light mode toggle
    const darkToggle = screen.getAllByRole('button', { name: /switch to dark mode/i })[0];
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await userEvent.click(darkToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const lightToggle = screen.getAllByRole('button', { name: /switch to light mode/i })[0];
    await userEvent.click(lightToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('validates and creates a new task', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Database Migration to Aurora');

    await user.click(screen.getByRole('button', { name: /^add task$/i }));
    const dialog = screen.getByRole('dialog');

    // Client validation blocks < 3 char title
    await user.type(within(dialog).getByLabelText(/task title/i), 'Hi');
    await user.click(within(dialog).getByRole('button', { name: /create task/i }));
    expect(within(dialog).getByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(tasksApi.createTask).not.toHaveBeenCalled();

    // Valid submit
    const createdTask = {
      _id: 't4',
      title: 'Deploy Vercel Frontend',
      description: 'Configure SPA rewrites.',
      status: 'in-progress',
      createdAt: '2025-10-26T10:00:00.000Z',
      updatedAt: '2025-10-26T10:00:00.000Z',
    };
    tasksApi.createTask.mockResolvedValueOnce(createdTask);

    await user.clear(within(dialog).getByLabelText(/task title/i));
    await user.type(within(dialog).getByLabelText(/task title/i), 'Deploy Vercel Frontend');
    await user.type(within(dialog).getByLabelText(/description/i), 'Configure SPA rewrites.');
    await user.click(within(dialog).getByLabelText(/in progress/i));
    await user.click(within(dialog).getByRole('button', { name: /create task/i }));

    expect(tasksApi.createTask).toHaveBeenCalledWith({
      title: 'Deploy Vercel Frontend',
      description: 'Configure SPA rewrites.',
      status: 'in-progress',
    });
    expect(await screen.findByText('Deploy Vercel Frontend')).toBeInTheDocument();

    const stats = screen.getByLabelText('Task metrics');
    expect(within(stats).getByText('4')).toBeInTheDocument();
  });

  test('edits an existing task and updates the card', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Database Migration to Aurora');

    await user.click(screen.getByRole('button', { name: /edit "database migration to aurora"/i }));
    const dialog = screen.getByRole('dialog');
    const titleInput = within(dialog).getByLabelText(/task title/i);
    expect(titleInput).toHaveValue('Database Migration to Aurora');

    const updatedTask = {
      ...sampleTasks[0],
      title: 'Aurora Serverless v2 Migration',
      status: 'completed',
    };
    tasksApi.updateTask.mockResolvedValueOnce(updatedTask);

    await user.clear(titleInput);
    await user.type(titleInput, 'Aurora Serverless v2 Migration');
    await user.click(within(dialog).getByLabelText(/completed/i));
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(tasksApi.updateTask).toHaveBeenCalledWith('t1', {
      title: 'Aurora Serverless v2 Migration',
      description: 'Migrate production read-replicas.',
      status: 'completed',
    });
    expect(await screen.findByText('Aurora Serverless v2 Migration')).toBeInTheDocument();
  });

  test('toggles task completion optimistically and rolls back on failure', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Database Migration to Aurora');

    // Success toggle
    tasksApi.updateTask.mockResolvedValueOnce({ ...sampleTasks[0], status: 'completed' });
    const checkbox = screen.getByRole('checkbox', {
      name: /mark "database migration to aurora" complete/i,
    });
    await user.click(checkbox);

    expect(tasksApi.updateTask).toHaveBeenCalledWith('t1', { status: 'completed' });
    expect(
      screen.getByRole('checkbox', { name: /mark "database migration to aurora" incomplete/i })
    ).toBeChecked();

    // Failure rollback
    tasksApi.updateTask.mockRejectedValueOnce(new ApiError({ message: 'Server error', status: 500 }));
    await user.click(
      screen.getByRole('checkbox', { name: /mark "database migration to aurora" incomplete/i })
    );

    expect(
      await screen.findByRole('checkbox', {
        name: /mark "database migration to aurora" incomplete/i,
      })
    ).toBeChecked();
  });

  test('deletes a task only after confirmation and supports mobile user menu logout', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Database Migration to Aurora');

    // Cancel delete
    await user.click(screen.getByRole('button', { name: /delete "database migration to aurora"/i }));
    const confirmDialog = screen.getByRole('dialog');
    await user.click(within(confirmDialog).getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('Database Migration to Aurora')).toBeInTheDocument();

    // Confirm delete
    tasksApi.deleteTask.mockResolvedValueOnce({ success: true, message: 'Task deleted' });
    await user.click(screen.getByRole('button', { name: /delete "database migration to aurora"/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /delete task/i }));

    expect(tasksApi.deleteTask).toHaveBeenCalledWith('t1');
    expect(screen.queryByText('Database Migration to Aurora')).not.toBeInTheDocument();

    // Mobile overflow menu opens & logs out
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('sarah@taskflow.io')).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: /logout/i }));
    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });
});
