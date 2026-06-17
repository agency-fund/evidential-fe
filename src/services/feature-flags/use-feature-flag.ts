'use client';

import { FLAG_DEFAULTS, FlagKey } from './feature-flags';
import { useLocalStorage } from '@/providers/use-local-storage';

/**
 * Returns whether a feature flag is enabled.
 *
 * Resolution order:
 * 1. `localStorage` override at `ff_<flagKey>` (developer tooling)
 * 2. Build-time default from `FLAG_DEFAULTS` (env vars)
 *
 * @example
 * ```tsx
 * import { FLAGS } from './feature-flags';
 *
 * const clusterExperimentsEnabled = useFeatureFlag(FLAGS.CLUSTER_EXPERIMENTS);
 * ```
 *
 * Override a flag from the browser console without refreshing:
 *
 * @example
 * ```js
 * const key = 'ff_cluster_experiments';
 * const eventKey = `uls_${key}_event`;
 *
 * localStorage.setItem(key, true); // or false
 * window.dispatchEvent(new StorageEvent(eventKey));
 * ```
 *
 * Remove the override to fall back to the env default:
 *
 * @example
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
