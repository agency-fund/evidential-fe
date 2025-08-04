'use client';

import { Badge } from '@radix-ui/themes';

export const ExperimentTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { name: string; color: 'green' | 'blue'; variant?: 'soft' | 'outline' }> = {
    freq_preassigned: { name: 'Preassigned', color: 'blue', variant: 'soft' },
    freq_online: { name: 'Online', color: 'green', variant: 'soft' },
  };

  const { name, color, variant } = typeMap[type] || { name: type, color: 'red' as const, variant: 'outline' as const };
  return (
    <Badge color={color} variant={variant}>
      {name}
    </Badge>
  );
};
