'use client';

import { Badge } from '@radix-ui/themes';

export const ExperimentTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { name: string; color: 'green' | 'blue' | 'red' | 'orange'; variant?: 'soft' | 'outline' }> = {
    freq_preassigned: { name: 'Preassigned', color: 'orange' },
    freq_online: { name: 'Online', color: 'orange' },
    unknown: { name: 'Unknown', color: 'red', variant: 'outline' },
  };

  const { name, color, variant = 'soft' } = typeMap[type] || typeMap.unknown;
  return (
    <Badge color={color} variant={variant}>
      {name}
    </Badge>
  );
};