import { Badge } from '@radix-ui/themes';
import type { ExperimentImpact } from '@/components/features/experiments/types';

interface ExperimentImpactBadgeProps {
  impact: ExperimentImpact;
}

const impactConfig: Record<ExperimentImpact, { label: string; color: 'red' | 'yellow' | 'green' | 'gray' }> = {
  high: { label: 'High Impact', color: 'red' },
  medium: { label: 'Medium Impact', color: 'yellow' },
  low: { label: 'Low Impact', color: 'green' },
  unclear: { label: 'Unclear Impact', color: 'gray' },
};

export function ExperimentImpactBadge({ impact }: ExperimentImpactBadgeProps) {
  const config = impactConfig[impact];

  return (
        <Badge color={config.color} variant="soft" style={{ cursor: 'default' }}>
          {config.label}
        </Badge>
  );
}
