import { useRef, useCallback, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounceFunction<T extends (...args: any[]) => any>(fn: T, delayMs: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent stale closures without triggering re-creation of debouncedFn by holding the latest ref.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Stable helper to clear the timeout and let the caller manually do so as well if needed.
  const clearPendingDebouncedFn = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Our trigger adapts to dynamic changes in the delay and the function ref.
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      clearPendingDebouncedFn();

      timeoutRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs, clearPendingDebouncedFn],
  );

  // Cleanup on unmount AND if delayMs changes to cancel any pending calls with the old delay.
  useEffect(() => {
    return () => clearPendingDebouncedFn();
  }, [delayMs, clearPendingDebouncedFn]);

  return [debouncedFn, clearPendingDebouncedFn] as const;
}
