'use client';

import { Badge, Tooltip } from '@radix-ui/themes';

export const ExperimentTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<
    string,
    { name: string; tooltipName: string; color: 'green' | 'blue' | 'red' | 'purple'; variant?: 'soft' | 'outline' }
  > = {
    freq_preassigned: { name: 'A/B PreAs', tooltipName: 'A/B Preassigned', color: 'blue', variant: 'soft' },
    freq_online: { name: 'A/B Online', tooltipName: 'A/B Online', color: 'blue', variant: 'soft' },
    mab_online: { name: 'MAB', tooltipName: 'Multi-Armed Bandit', color: 'green', variant: 'soft' },
    cmab_online: { name: 'CMAB', tooltipName: 'Contextual Multi-Armed Bandit', color: 'purple', variant: 'soft' },
  };

  const { name, tooltipName, color, variant } = typeMap[type] || {
    name: type,
    tooltipName: type,
    color: 'red' as const,
    variant: 'outline' as const,
  };

  return (
    <Tooltip content={tooltipName}>
      <Badge color={color} variant={variant} style={{ cursor: 'default' }}>
        {name}
      </Badge>
    </Tooltip>
  );
};
