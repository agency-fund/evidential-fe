'use client';

import { useSyncExternalStore } from 'react';

const SESSION_TOKEN_KEY = 'xu';
const SESSION_TOKEN_EVENT = 'session_token_event';

const subscribe = (callback: () => void) => {
  window.addEventListener(SESSION_TOKEN_EVENT, callback);
  return () => {
    window.removeEventListener(SESSION_TOKEN_EVENT, callback);
  };
};

const getSnapshot = () => localStorage.getItem(SESSION_TOKEN_KEY);

// Exposes the current authentication token to code outside of the React context.
export const currentSessionToken = () => {
  const item = getSnapshot();
  if (typeof item === 'string') {
    // Ignore invalid values that may have been set by previous implementations.
    if (item === 'null' || !item.startsWith('{')) {
      return null;
    }
    return (JSON.parse(item) as SessionTokenStored).sessionToken;
  } else {
    return null;
  }
};

const setSessionToken = (newValue: SessionTokenStored | null) => {
  if (newValue === null) {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } else {
    localStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(newValue));
  }
  window.dispatchEvent(new StorageEvent(SESSION_TOKEN_EVENT));
};

interface SessionTokenStored {
  sessionToken: string;
  email: string;
  isPrivileged?: boolean;
}

export const useAuthStorage = () => {
  const item = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = typeof item === 'string' ? JSON.parse(item) : null;
  if (value !== null && typeof value !== 'object') {
    throw new Error('localStorage corrupted');
  }

  return [value as SessionTokenStored | null, setSessionToken] as const;
};
