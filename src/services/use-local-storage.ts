'use client';

import { useCallback, useSyncExternalStore } from 'react';

export function useLocalStorage<T>(key: string) {
  const eventKey = `uls_${key}_event`;

  const subscribe = (callback: () => void) => {
    window.addEventListener(eventKey, callback);
    return () => {
      window.removeEventListener(eventKey, callback);
    };
  };

  const getSnapshot = () => localStorage.getItem(key);

  const item = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = typeof item === 'string' ? JSON.parse(item) : null;
  if (value !== null && typeof value !== 'object') {
    throw new Error('localStorage corrupted');
  }

  const setValue = useCallback(
    (newValue: T | null) => {
      localStorage.setItem(key, JSON.stringify(newValue));
      window.dispatchEvent(new StorageEvent(eventKey));
    },
    [key, eventKey],
  );

  return [value as T | null, setValue, eventKey] as const;
}
