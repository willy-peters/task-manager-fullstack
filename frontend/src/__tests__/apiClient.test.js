import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient, {
  ApiError,
  API_BASE_URL,
  REQUEST_TIMEOUT_MS,
  TOKEN_KEY,
  UNAUTHORIZED_EVENT,
  USER_KEY,
  coldStartTracker,
  normalizeError,
} from '../api/client.js';
import { getCurrentUser, loginUser, pingHealth, registerUser } from '../api/authApi.js';
import { createTask, deleteTask, fetchTaskById, fetchTasks, updateTask } from '../api/tasksApi.js';

const originalAdapter = apiClient.defaults.adapter;
let calls;

/** Route every request through `handler(config)` → { status, data }. */
function mockServer(handler) {
  apiClient.defaults.adapter = async (config) => {
    calls.push(config);
    const { status = 200, data = {} } = (await handler(config)) ?? {};
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, {}, response);
    }
    return response;
  };
}

const body = (config) => (config.data ? JSON.parse(config.data) : undefined);

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  coldStartTracker.reset();
});

describe('axios instance configuration', () => {
  test('targets the hosted API with a cold-start friendly timeout', () => {
    expect(apiClient.defaults.baseURL).toBe(API_BASE_URL);
    expect(API_BASE_URL).toBe('https://task-api-yhl4.onrender.com/api/v1');
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(60000);
  });
});

describe('JWT injection', () => {
  test('attaches Authorization: Bearer <token> when a token is stored', async () => {
    localStorage.setItem(TOKEN_KEY, 'abc.def.ghi');
    mockServer(() => ({ data: { success: true, user: { name: 'Ada' } } }));
    await getCurrentUser();
    expect(calls[0].headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('omits the Authorization header when logged out', async () => {
    mockServer(() => ({ data: { success: true } }));
    await pingHealth();
    expect(calls[0].headers.Authorization).toBeUndefined();
  });
});

describe('401 handling', () => {
  test('clears the session and dispatches auth:unauthorized for protected endpoints', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired');
    localStorage.setItem(USER_KEY, '{}');
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    mockServer(() => ({ status: 401, data: { success: false, message: 'Token expired, please log in again' } }));

    await expect(fetchTasks()).rejects.toMatchObject({ status: 401, message: 'Token expired, please log in again' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  test('does NOT dispatch auth:unauthorized for a failed login', async () => {
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    mockServer(() => ({ status: 401, data: { success: false, message: 'Invalid email or password' } }));

    await expect(loginUser({ email: 'a@b.co', password: 'wrongpass' })).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
});

describe('error normalization', () => {
  test('maps Joi validation errors to a fieldErrors object', async () => {
    mockServer(() => ({
      status: 400,
      data: {
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'name length must be at least 2 characters long' },
          { field: 'password', message: 'password length must be at least 8 characters long' },
        ],
      },
    }));
    const error = await registerUser({ name: 'A', email: 'a@b.co', password: 'x' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({
      name: 'name length must be at least 2 characters long',
      password: 'password length must be at least 8 characters long',
    });
  });

  test('keeps the server message for conflicts (409)', async () => {
    mockServer(() => ({ status: 409, data: { success: false, message: 'Email is already registered' } }));
    await expect(registerUser({ name: 'Ada', email: 'a@b.co', password: 'password123' })).rejects.toMatchObject({
      status: 409,
      message: 'Email is already registered',
    });
  });

  test('flags timeouts and network failures with friendly messages', () => {
    const timeout = normalizeError(new AxiosError('timeout of 60000ms exceeded', 'ECONNABORTED'));
    expect(timeout.isTimeout).toBe(true);
    expect(timeout.message).toMatch(/waking up/i);

    const offline = normalizeError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(offline.isNetworkError).toBe(true);
    expect(offline.message).toMatch(/unable to reach the server/i);
  });

  test('falls back to a generic message for 5xx responses without a body', () => {
    const error = normalizeError({ response: { status: 503, data: '' } });
    expect(error.status).toBe(503);
    expect(error.message).toMatch(/something went wrong/i);
  });
});

describe('endpoint mapping matches /api-docs.json', () => {
  test('auth endpoints', async () => {
    mockServer((config) => {
      if (config.url === '/auth/me') return { data: { success: true, user: { _id: 'u1' } } };
      if (config.url === '/health') return { data: { success: true, message: 'API is running' } };
      return { status: config.url === '/auth/register' ? 201 : 200, data: { success: true, token: 't', user: { _id: 'u1' } } };
    });

    await expect(registerUser({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' })).resolves.toEqual({
      token: 't',
      user: { _id: 'u1' },
    });
    await loginUser({ email: 'ada@example.com', password: 'password123' });
    await expect(getCurrentUser()).resolves.toEqual({ _id: 'u1' });
    await expect(pingHealth()).resolves.toMatchObject({ message: 'API is running' });

    expect(calls.map((c) => [c.method, c.url])).toEqual([
      ['post', '/auth/register'],
      ['post', '/auth/login'],
      ['get', '/auth/me'],
      ['get', '/health'],
    ]);
    expect(body(calls[0])).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' });
    expect(body(calls[1])).toEqual({ email: 'ada@example.com', password: 'password123' });
  });

  test('pingHealth never throws', async () => {
    mockServer(() => ({ status: 503 }));
    await expect(pingHealth()).resolves.toBeNull();
  });

  test('task endpoints', async () => {
    const task = { _id: '6718c1f2a3b4c5d6e7f80912', title: 'Learn Express', status: 'pending' };
    mockServer((config) => {
      if (config.method === 'get' && config.url === '/tasks') return { data: { success: true, count: 1, data: [task] } };
      if (config.method === 'delete') return { data: { success: true, message: 'Task deleted' } };
      return { status: config.method === 'post' ? 201 : 200, data: { success: true, data: task } };
    });

    await expect(fetchTasks()).resolves.toEqual([task]);
    await fetchTasks('completed');
    await fetchTasks('bogus');
    await expect(fetchTaskById(task._id)).resolves.toEqual(task);
    await createTask({ title: 'Learn Express' });
    await updateTask(task._id, { status: 'completed', user: 'hacker', title: undefined });
    await expect(deleteTask(task._id)).resolves.toEqual({ success: true, message: 'Task deleted' });

    expect(calls.map((c) => [c.method, c.url, c.params])).toEqual([
      ['get', '/tasks', undefined],
      ['get', '/tasks', { status: 'completed' }],
      ['get', '/tasks', undefined],
      ['get', `/tasks/${task._id}`, undefined],
      ['post', '/tasks', undefined],
      ['put', `/tasks/${task._id}`, undefined],
      ['delete', `/tasks/${task._id}`, undefined],
    ]);
    expect(body(calls[4])).toEqual({ title: 'Learn Express', description: '', status: 'pending' });
    expect(body(calls[5])).toEqual({ status: 'completed' });
  });
});
