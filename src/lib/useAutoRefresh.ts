"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Lightweight polling hook for auto-refreshing data.
 * Calls `fetcher` every `intervalMs` milliseconds, cleans up on unmount.
 * Prevents duplicate in-flight requests.
 */
export function useAutoRefresh<T>(
  fetcher: () => Promise<T>,
  onData: (data: T) => void,
  intervalMs = 30000,
) {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await fetcher();
      onData(data);
      setLastRefreshed(new Date());
    } catch {
      // silently ignore network errors
    } finally {
      inFlightRef.current = false;
    }
  }, [fetcher, onData]);

  useEffect(() => {
    timerRef.current = setInterval(poll, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll, intervalMs]);

  return { lastRefreshed };
}
