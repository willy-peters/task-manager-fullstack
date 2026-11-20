import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import apiClient, { COLD_START_THRESHOLD_MS, coldStartTracker } from '../api/client.js';
import useColdStart from '../hooks/useColdStart.js';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  coldStartTracker.reset();
  vi.restoreAllMocks();
});

describe('useColdStart', () => {
  test('uses a 2.5s threshold', () => {
    expect(COLD_START_THRESHOLD_MS).toBe(2500);
  });

  test('fast responses never trigger the cold-start state', async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    const { result } = renderHook(() => useColdStart());
    await act(async () => {
      await apiClient.get('/tasks');
    });

    expect(result.current).toEqual({ isColdStarting: false, elapsedSeconds: 0 });
  });

  test('slow responses flip to cold-start when threshold elapses and reset on settle', async () => {
    // Capture the cold-start timer callback registered by client.js without freezing React timers
    const realSetTimeout = globalThis.setTimeout;
    const scheduled = [];
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, delay, ...args) => {
      if (delay === COLD_START_THRESHOLD_MS) {
        scheduled.push(fn);
        return 999999;
      }
      return realSetTimeout(fn, delay, ...args);
    });
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {});

    let resolveAdapter;
    let notifyReady;
    const ready = new Promise((r) => {
      notifyReady = r;
    });
    apiClient.defaults.adapter = (config) => {
      notifyReady();
      return new Promise((resolve) => {
        resolveAdapter = () =>
          resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
      });
    };

    const { result } = renderHook(() => useColdStart());
    const req = apiClient.get('/tasks');
    await ready;

    expect(result.current.isColdStarting).toBe(false);
    expect(scheduled.length).toBe(1);

    // Simulate the 2.5s threshold firing
    act(() => {
      scheduled[0]();
    });
    expect(result.current.isColdStarting).toBe(true);

    // Settle the request and verify reset
    await act(async () => {
      resolveAdapter();
      await req;
    });
    expect(result.current).toEqual({ isColdStarting: false, elapsedSeconds: 0 });
  });

  test('stays active until every slow request has settled', async () => {
    const realSetTimeout = globalThis.setTimeout;
    const scheduled = [];
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, delay, ...args) => {
      if (delay === COLD_START_THRESHOLD_MS) {
        scheduled.push(fn);
        return 999990 + scheduled.length;
      }
      return realSetTimeout(fn, delay, ...args);
    });
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => {});

    const resolvers = [];
    const readies = [];
    apiClient.defaults.adapter = (config) => {
      const r = readies.shift();
      if (r) r();
      return new Promise((resolve) => {
        resolvers.push(() =>
          resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
        );
      });
    };

    const { result } = renderHook(() => useColdStart());
    const ready1 = new Promise((r) => readies.push(r));
    const req1 = apiClient.get('/auth/me');
    await ready1;

    const ready2 = new Promise((r) => readies.push(r));
    const req2 = apiClient.get('/tasks');
    await ready2;

    act(() => {
      scheduled.forEach((fn) => fn());
    });
    expect(result.current.isColdStarting).toBe(true);

    await act(async () => {
      resolvers[0]();
      await req1;
    });
    expect(result.current.isColdStarting).toBe(true);

    await act(async () => {
      resolvers[1]();
      await req2;
    });
    expect(result.current.isColdStarting).toBe(false);
  });
});
