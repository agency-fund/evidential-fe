type BooleanFeatureFlagDef = {
  storageKey: string;
  envValue: string | undefined;
  defaultValue: boolean;
};

type NumberFeatureFlagDef = {
  storageKey: string;
  envValue: string | undefined;
  defaultValue: number;
};

type FeatureFlagDef = BooleanFeatureFlagDef | NumberFeatureFlagDef;

/**
 * Registry of client-side feature flags.
 *
 * Add new flags here. Each flag needs:
 * - a unique localStorage `storageKey` (dev override via DevTools)
 * - an explicit `process.env.NEXT_PUBLIC_*` reference (required for Next.js inlining)
 * - a hard-coded `defaultValue` when the env var is unset
 */
export const FEATURE_FLAGS = {
  clusterExperiments: {
    storageKey: 'ff_cluster_experiments',
    envValue: process.env.NEXT_PUBLIC_FF_CLUSTER_EXPERIMENTS,
    defaultValue: false,
  },
  exampleNumericFlag: {
    storageKey: 'ff_example_numeric_flag',
    envValue: process.env.NEXT_PUBLIC_FF_EXAMPLE_NUMERIC_FLAG,
    defaultValue: 0,
  },
} as const satisfies Record<string, FeatureFlagDef>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export type FeatureFlagValue<K extends FeatureFlagKey> = (typeof FEATURE_FLAGS)[K]['defaultValue'];

function resolveBooleanEnv(envValue: string | undefined, defaultValue: boolean): boolean {
  if (envValue === undefined || envValue === '') {
    return defaultValue;
  }
  return envValue === 'true' || envValue === '1';
}

function resolveNumberEnv(envValue: string | undefined, defaultValue: number): number {
  if (envValue === undefined || envValue === '') {
    return defaultValue;
  }
  const parsed = Number(envValue);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function parseFeatureFlagStoredValue<K extends FeatureFlagKey>(
  stored: unknown,
  key: K,
): FeatureFlagValue<K> | undefined {
  if (stored === null) {
    return undefined;
  }

  const def = FEATURE_FLAGS[key];

  if (typeof def.defaultValue === 'boolean' && (typeof stored === 'boolean' || typeof stored === 'number')) {
    return (stored === true || stored === 1) as FeatureFlagValue<K>;
  }

  if (typeof def.defaultValue === 'number' && typeof stored === 'number' && !Number.isNaN(stored)) {
    return stored as FeatureFlagValue<K>;
  }

  return undefined;
}

export function getFeatureFlagDefault<K extends FeatureFlagKey>(key: K): FeatureFlagValue<K> {
  const def = FEATURE_FLAGS[key];
  if (typeof def.defaultValue === 'boolean') {
    return resolveBooleanEnv(def.envValue, def.defaultValue) as FeatureFlagValue<K>;
  }
  return resolveNumberEnv(def.envValue, def.defaultValue) as FeatureFlagValue<K>;
}
