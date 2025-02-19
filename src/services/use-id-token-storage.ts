'use client';

import { useCallback, useSyncExternalStore } from 'react';

const ID_TOKEN_KEY = 'id_token_';
const ID_TOKEN_EVENT = 'id_token_event';

const subscribe = (callback: () => void) => {
  window.addEventListener(ID_TOKEN_EVENT, callback);
  return () => {
    window.removeEventListener(ID_TOKEN_EVENT, callback);
  };
};

const getSnapshot = () => localStorage.getItem(ID_TOKEN_KEY);

export const currentIdToken = () => {
  const item = getSnapshot();
  return typeof item === 'string' ? JSON.parse(item) : null;
};

export const useIdTokenStorage = () => {
  const item = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = typeof item === 'string' ? JSON.parse(item) : null;
  if (value !== null && typeof value !== 'string') {
    throw new Error('localStorage corrupted');
  }
  const setValue = useCallback((newValue: string | null) => {
    localStorage.setItem(ID_TOKEN_KEY, JSON.stringify(newValue));
    window.dispatchEvent(new StorageEvent(ID_TOKEN_EVENT));
  }, []);
  return [value, setValue] as const;
};
