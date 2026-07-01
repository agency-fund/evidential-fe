'use client';

/**
 * Browser-console helpers for toggling feature flags at runtime.
 *
 * Imported once from `layout.tsx`; no app code needs to call these directly.
 * Open DevTools on a running page and use the flag keys declared in `feature-flags.ts`.
 * Changes apply immediately (no refresh). Remove a key from localStorage to fall back to the env
 * default in `FLAG_DEFAULTS`.
 *
 * @example
 * ff('cluster_experiments');      // read
 * ffon('cluster_experiments');    // enable
 * ffoff('cluster_experiments');   // disable
 * ffclear('cluster_experiments'); // clear override, fall back to env default
 */

import { FLAG_DEFAULTS, FlagKey } from './feature-flags';

function storageKey(flagKey: FlagKey): string {
  return `ff_${flagKey}`;
}

/** Format of key is defined by `useLocalStorage` in `use-local-storage.ts`. */
function storageEventKey(flagKey: FlagKey): string {
  return `uls_${storageKey(flagKey)}_event`;
}

export function ff(flagKey: FlagKey): boolean {
  const stored = localStorage.getItem(storageKey(flagKey));
  if (stored !== null) {
    return JSON.parse(stored) as boolean;
  }
  return FLAG_DEFAULTS[flagKey];
}

export function ffon(flagKey: FlagKey): void {
  localStorage.setItem(storageKey(flagKey), JSON.stringify(true));
  window.dispatchEvent(new StorageEvent(storageEventKey(flagKey)));
}

export function ffoff(flagKey: FlagKey): void {
  localStorage.setItem(storageKey(flagKey), JSON.stringify(false));
  window.dispatchEvent(new StorageEvent(storageEventKey(flagKey)));
}

export function ffclear(flagKey: FlagKey): boolean {
  localStorage.removeItem(storageKey(flagKey));
  window.dispatchEvent(new StorageEvent(storageEventKey(flagKey)));
  return FLAG_DEFAULTS[flagKey];
}

declare global {
  interface Window {
    ff: (flagKey: FlagKey) => boolean;
    ffon: (flagKey: FlagKey) => void;
    ffoff: (flagKey: FlagKey) => void;
    ffclear: (flagKey: FlagKey) => boolean;
  }
}

if (typeof window !== 'undefined') {
  window.ff = ff;
  window.ffon = ffon;
  window.ffoff = ffoff;
  window.ffclear = ffclear;
}
