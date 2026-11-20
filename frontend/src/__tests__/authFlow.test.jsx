import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppRoutes } from '../App.jsx';
import * as authApi from '../api/authApi.js';
import * as tasksApi from '../api/tasksApi.js';
import { ApiError, TOKEN_KEY, UNAUTHORIZED_EVENT, USER_KEY } from '../api/client.js';
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

function renderWithRouter(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  tasksApi.fetchTasks.mockResolvedValue([]);
});

describe('Phase 3 Authentication & Routing', () => {
  test('unauthenticated visit to /dashboard redirects to /login', async () => {
    renderWithRouter(['/dashboard']);
    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  test('authenticated session restores via /auth/me and blocks /login', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid-jwt');
    authApi.getCurrentUser.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    renderWithRouter(['/login']);

    expect(await screen.findByRole('heading', { name: /overview & tasks/i })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  test('401 on /auth/me clears storage and redirects to /login with session notice', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-jwt');
    localStorage.setItem(USER_KEY, JSON.stringify({ name: 'Ada' }));
    authApi.getCurrentUser.mockRejectedValueOnce(
      new ApiError({ message: 'Token expired', status: 401 })
    );

    renderWithRouter(['/dashboard']);

    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/session has expired/i);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  test('RegisterPage validates fields, handles 409 conflict, and registers with { name, email, password }', async () => {
    const user = userEvent.setup();
    renderWithRouter(['/register']);

    await user.type(screen.getByLabelText(/full name/i), 'A');
    await user.type(screen.getByLabelText(/^email$/i), 'bad-email');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'mismatch');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/between 2 and 50 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/between 8 and 72 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(authApi.registerUser).not.toHaveBeenCalled();

    // Password visibility toggle
    const pwdInput = screen.getByLabelText(/^password$/i);
    expect(pwdInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /^show password$/i }));
    expect(pwdInput).toHaveAttribute('type', 'text');

    // Fix inputs and test 409 conflict
    await user.clear(screen.getByLabelText(/full name/i));
    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
    await user.clear(screen.getByLabelText(/^email$/i));
    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.clear(pwdInput);
    await user.type(pwdInput, 'password123');
    await user.clear(screen.getByLabelText(/^confirm password$/i));
    await user.type(screen.getByLabelText(/^confirm password$/i), 'password123');

    authApi.registerUser.mockRejectedValueOnce(
      new ApiError({ message: 'Email is already registered', status: 409 })
    );
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email is already registered/i);

    // Valid registration
    authApi.registerUser.mockResolvedValueOnce({
      token: 'new-jwt',
      user: { _id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(authApi.registerUser).toHaveBeenLastCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    });
    expect(await screen.findByRole('heading', { name: /overview & tasks/i })).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-jwt');
  });

  test('LoginPage pings health, shows 401 error, logs in with Welcome back toast, and logout shows Logged out successfully', async () => {
    const user = userEvent.setup();
    renderWithRouter(['/login']);

    expect(authApi.pingHealth).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');

    authApi.loginUser.mockRejectedValueOnce(
      new ApiError({ message: 'Invalid email or password', status: 401 })
    );
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);

    // Valid login
    authApi.loginUser.mockResolvedValueOnce({
      token: 'login-jwt',
      user: { _id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
    });
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('heading', { name: /overview & tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Welcome back, Ada Lovelace');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('login-jwt');

    // Logout
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(await screen.findByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Logged out successfully');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  test('auth:unauthorized event logs the user out from protected routes', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt');
    authApi.getCurrentUser.mockResolvedValueOnce({ _id: 'u1', name: 'Ada' });

    renderWithRouter(['/dashboard']);
    expect(await screen.findByRole('heading', { name: /overview & tasks/i })).toBeInTheDocument();

    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
