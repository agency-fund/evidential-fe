'use client';

import { useSyncExternalStore } from 'react';

const ID_TOKEN_KEY = 'xu';
const ID_TOKEN_EVENT = 'id_token_event';

const subscribe = (callback: () => void) => {
  window.addEventListener(ID_TOKEN_EVENT, callback);
  return () => {
    window.removeEventListener(ID_TOKEN_EVENT, callback);
  };
};

const getSnapshot = () => localStorage.getItem(ID_TOKEN_KEY);

// Exposes the current authentication token to code outside of the React context.
export const currentIdToken = () => {
  const item = getSnapshot();
  if (typeof item === 'string') {
    // Ignore invalid values that may have been set by previous implementations.
    if (item === 'null' || !item.startsWith('{')) {
      return null;
    }
    return (JSON.parse(item) as IdTokenStored).idToken;
  } else {
    return null;
  }
};

const setIdToken = (newValue: IdTokenStored | null) => {
  if (newValue === null) {
    localStorage.removeItem(ID_TOKEN_KEY);
  } else {
    localStorage.setItem(ID_TOKEN_KEY, JSON.stringify(newValue));
  }
  window.dispatchEvent(new StorageEvent(ID_TOKEN_EVENT));
};

interface IdTokenStored {
  idToken: string;
  email: string;
  isPrivileged?: boolean;
}

export const useAuthStorage = () => {
  const item = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = typeof item === 'string' ? JSON.parse(item) : null;
  if (value !== null && typeof value !== 'object') {
    throw new Error('localStorage corrupted');
  }

  return [value as IdTokenStored | null, setIdToken] as const;
};
