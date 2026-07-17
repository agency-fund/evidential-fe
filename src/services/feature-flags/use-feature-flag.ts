'use client';

import { FLAG_DEFAULTS, FlagKey } from './feature-flags';
import { useLocalStorage } from '@/providers/use-local-storage';

/**
 * Returns whether a feature flag is enabled.
 *
 * Resolution order:
 * 1. `localStorage` override at `ff_<flagKey>` (developer tooling)
 * 2. Build-time default from `FLAG_DEFAULTS` (env vars or hard-coded)
 *
 * Usage:
 * ```tsx
 * import { FLAGS } from './feature-flags';
 *
 * const clusterExperimentsEnabled = useFeatureFlag(FLAGS.CLUSTER_EXPERIMENTS);
 * ```
 *
 * How to manually override a flag without refreshing:
 *
 * For the most convenient development experience, use the browser console helpers registered on
 * `window` (see `feature-flag-dev-tools.ts`):
 *
 * ```js
 * ff('cluster_experiments');      // read current value
 * ffon('cluster_experiments');    // enable
 * ffoff('cluster_experiments');   // disable
 * ffclear('cluster_experiments'); // clear override, fall back to env default
 * ```
 *
 * Or directly override the flag in localStorage & trigger an event to pick up the change:
 *
 * ```js
 * const key = 'ff_cluster_experiments';
 * const eventKey = `uls_${key}_event`;
 *
 * localStorage.setItem(key, true); // or false
 * window.dispatchEvent(new StorageEvent(eventKey));
 * ```
 *
 * Remove the override to fall back to the build-time default:
 *
 * ```js
 * localStorage.removeItem(key);
 * window.dispatchEvent(new StorageEvent(eventKey));
 * ```
 */
export function useFeatureFlag(flagKey: FlagKey): boolean {
  const [storedValue] = useLocalStorage<boolean>(`ff_${flagKey}`);

  if (storedValue !== undefined && storedValue !== null) {
    return storedValue;
  }
  return FLAG_DEFAULTS[flagKey];
}
