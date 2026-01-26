import { useRef, useCallback, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedFunction<T extends (...args: any[]) => any>(fn: T, delayMs: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to clear the timeout and let the caller manually do so as well if needed.
  const clearPendingDebouncedFn = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // debounced trigger
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      clearPendingDebouncedFn();

      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delayMs);
    },
    [fn, delayMs],
  );

  // Unmount Cleanup to run only when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedFn, clearPendingDebouncedFn] as const;
}
