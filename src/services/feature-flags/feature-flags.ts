/** Feature flags for the application are all defined in this file. Only boolean flags support. */
export const FLAGS = {
  CLUSTER_EXPERIMENTS: 'cluster_experiments',
} as const;

// Extract the union type of the FLAGS keys
export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

function isTrue(val: string | undefined | null): boolean {
  return val === 'true' || val === '1';
}

/**
 * Require FLAG_DEFAULTS to include every key defined in FlagKey.
 * To permanently enable a feature, we require a code change that sets the default to true.
 */
export const FLAG_DEFAULTS: Record<FlagKey, boolean> = {
  [FLAGS.CLUSTER_EXPERIMENTS]: isTrue(process.env.NEXT_PUBLIC_FF_CLUSTER_EXPERIMENTS),
};
