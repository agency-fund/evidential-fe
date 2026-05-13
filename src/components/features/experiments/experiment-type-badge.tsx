'use client';

import { Badge, Tooltip } from '@radix-ui/themes';

/**
 * Renders the small badge that labels each experiment by type on the list/card
 * views and the experiment details header.
 *
 * `isCluster` (issue #217) is an FE-only override: the backend stores cluster-
 * randomized experiments as `freq_preassigned` (with `cluster_column` set on
 * the design spec), so we can't distinguish them from regular preassigned
 * experiments by `type` alone. Callers should pass `isCluster` when the
 * underlying experiment's design spec has `cluster_column` populated.
 */
export const ExperimentTypeBadge = ({ type, isCluster }: { type: string; isCluster?: boolean }) => {
  const typeMap: Record<
    string,
    {
      name: string;
      tooltipName: string;
      color: 'green' | 'blue' | 'red' | 'purple' | 'orange';
      variant?: 'soft' | 'outline';
    }
  > = {
    freq_preassigned: {
      name: 'A/B PreAs',
      tooltipName: 'A/B Preassigned',
      color: 'blue',
      variant: 'soft',
    },
    freq_online: {
      name: 'A/B Online',
      tooltipName: 'A/B Online',
      color: 'blue',
      variant: 'soft',
    },
    mab_online: {
      name: 'MAB',
      tooltipName: 'Multi-Armed Bandit',
      color: 'green',
      variant: 'soft',
    },
    cmab_online: {
      name: 'CMAB',
      tooltipName: 'Contextual Multi-Armed Bandit',
      color: 'purple',
      variant: 'soft',
    },
  };

  const baseEntry = typeMap[type] || {
    name: type,
    tooltipName: type,
    color: 'red' as const,
    variant: 'outline' as const,
  };

  // Issue #217: cluster-randomized preassigned experiments get a distinct
  // label but stay in the same blue family as regular A/B PreAs for visual
  // consistency.
  const { name, tooltipName, color, variant } =
    isCluster && type === 'freq_preassigned'
      ? {
          name: 'Cluster',
          tooltipName: 'Cluster Preassigned A/B Testing',
          color: 'blue' as const,
          variant: 'soft' as const,
        }
      : baseEntry;

  return (
    <Tooltip content={tooltipName}>
      <Badge color={color} variant={variant} style={{ cursor: 'default' }}>
        {name}
      </Badge>
    </Tooltip>
  );
};
