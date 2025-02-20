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
  return typeof item === 'string' ? (JSON.parse(item) as IdTokenStored).idToken : null;
};

const setIdToken = (newValue: IdTokenStored | null) => {
  localStorage.setItem(ID_TOKEN_KEY, JSON.stringify(newValue));
  window.dispatchEvent(new StorageEvent(ID_TOKEN_EVENT));
};

interface IdTokenStored {
  idToken: string;
  email: string;
}

export const useAuthStorage = () => {
  const item = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = typeof item === 'string' ? JSON.parse(item) : null;
  if (value !== null && typeof value !== 'object') {
    throw new Error('localStorage corrupted');
  }
  console.log('useAuthStorage: ', value);

  return [value as IdTokenStored | null, setIdToken] as const;
};
