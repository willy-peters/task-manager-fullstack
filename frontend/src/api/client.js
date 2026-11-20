import axios from 'axios';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://task-api-yhl4.onrender.com/api/v1'
).replace(/\/+$/, '');

export const TOKEN_KEY = 'taskflow_token';
export const USER_KEY = 'taskflow_user';
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

/** A request pending longer than this is treated as a Render free-tier cold start. */
export const COLD_START_THRESHOLD_MS = 2500;
/** Render cold starts can take 30-60s; give requests enough time to complete. */
export const REQUEST_TIMEOUT_MS = 60000;

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

/* ------------------------------------------------------------------ */
/* Token storage                                                      */
/* ------------------------------------------------------------------ */

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/* ------------------------------------------------------------------ */
/* Cold-start tracker (external store consumed by useColdStart)       */
/* ------------------------------------------------------------------ */

const listeners = new Set();
const slowRequests = new Map(); // requestId -> start timestamp
let snapshot = { isColdStarting: false, startedAt: null };

function emit() {
  const starts = [...slowRequests.values()];
  const next = {
    isColdStarting: starts.length > 0,
    startedAt: starts.length > 0 ? Math.min(...starts) : null,
  };
  if (next.isColdStarting !== snapshot.isColdStarting || next.startedAt !== snapshot.startedAt) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }
}

export const coldStartTracker = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => snapshot,
  /** Test helper: forget every tracked request. */
  reset() {
    slowRequests.clear();
    emit();
  },
};

let requestCounter = 0;

/* ------------------------------------------------------------------ */
/* Error normalization                                                */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor({ message, status = null, fieldErrors = {}, isNetworkError = false, isTimeout = false }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
  }
}

export function normalizeError(error) {
  if (error instanceof ApiError) return error;

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new ApiError({
      message: 'The server took too long to respond. It may still be waking up — please try again.',
      isTimeout: true,
    });
  }

  const response = error?.response;
  if (!response) {
    return new ApiError({
      message: 'Unable to reach the server. Check your internet connection and try again.',
      isNetworkError: true,
    });
  }

  const { status, data } = response;
  const fieldErrors = {};
  if (Array.isArray(data?.errors)) {
    for (const { field, message } of data.errors) {
      if (field && !fieldErrors[field]) fieldErrors[field] = message;
    }
  }

  let message = data?.message;
  if (!message) {
    message =
      status >= 500
        ? 'Something went wrong on the server. Please try again in a moment.'
        : 'The request could not be completed.';
  }

  return new ApiError({ message, status, fieldErrors });
}

/* ------------------------------------------------------------------ */
/* Axios instance                                                     */
/* ------------------------------------------------------------------ */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

function settle(config) {
  const meta = config?.metadata;
  if (!meta) return;
  clearTimeout(meta.timer);
  if (slowRequests.delete(meta.id)) emit();
}

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const id = ++requestCounter;
  const startedAt = Date.now();
  config.metadata = {
    id,
    startedAt,
    timer: setTimeout(() => {
      slowRequests.set(id, startedAt);
      emit();
    }, COLD_START_THRESHOLD_MS),
  };
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    settle(response.config);
    return response;
  },
  (error) => {
    settle(error?.config);
    const normalized = normalizeError(error);

    const url = error?.config?.url ?? '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
    if (normalized.status === 401 && !isAuthEndpoint) {
      tokenStorage.clear();
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, { detail: { message: normalized.message } })
      );
    }

    return Promise.reject(normalized);
  }
);

export default apiClient;
