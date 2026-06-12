'use client';

import { useLocalStorage } from '@/providers/use-local-storage';

import {
  type FeatureFlagKey,
  type FeatureFlagValue,
  FEATURE_FLAGS,
  getFeatureFlagDefault,
  parseFeatureFlagStoredValue,
} from './feature-flags';

/**
 * Basic developer feature flag hook.
 *
 * To set a feature flag in dev tools:
 *   localStorage.setItem('my_flag_storagekey', 'true');
 * Then refresh the page, or send the custom event with key defined by userLocalStorage e.g.:
 *   window.dispatchEvent(new StorageEvent('uls_my_flag_storagekey_event'));
 */
export function useFeatureFlag<K extends FeatureFlagKey>(key: K): FeatureFlagValue<K> {
  const { storageKey } = FEATURE_FLAGS[key];
  const [stored] = useLocalStorage<FeatureFlagValue<K>>(storageKey);

  const override = parseFeatureFlagStoredValue(stored, key);
  if (override !== undefined) {
    return override;
  }
  return getFeatureFlagDefault(key);
}
