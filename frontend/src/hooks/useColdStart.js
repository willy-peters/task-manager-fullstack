import { useEffect, useState, useSyncExternalStore } from 'react';
import { coldStartTracker } from '../api/client.js';

/**
 * Reports whether any API request has been pending longer than the cold-start
 * threshold (Render free tier spinning up) and how long the oldest one has waited.
 */
export default function useColdStart() {
  const { isColdStarting, startedAt } = useSyncExternalStore(
    coldStartTracker.subscribe,
    coldStartTracker.getSnapshot,
    coldStartTracker.getSnapshot
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isColdStarting) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isColdStarting]);

  const elapsedSeconds =
    isColdStarting && startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  return { isColdStarting, elapsedSeconds };
}
