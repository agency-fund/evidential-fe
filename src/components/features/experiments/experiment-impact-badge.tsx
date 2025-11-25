import { Badge, Tooltip } from '@radix-ui/themes';
import type { ExperimentImpact } from '@/components/features/experiments/types';

interface ExperimentImpactBadgeProps {
  impact?: ExperimentImpact | string;
}

const impactConfig: Record<ExperimentImpact, { label: string; tooltipLabel: string; color: 'red' | 'yellow' | 'green' | 'orange' | 'gray' }> = {
  high: { label: 'High', tooltipLabel: 'High Impact', color: 'red' },
  medium: { label: 'Medium', tooltipLabel: 'Medium Impact', color: 'yellow' },
  low: { label: 'Low', tooltipLabel: 'Low Impact', color: 'green' },
  unclear: { label: 'Unclear', tooltipLabel: 'Unclear Impact', color: 'orange' },
  unknown: { label: 'Unknown', tooltipLabel: 'Unknown Impact', color: 'gray' },
};

export function ExperimentImpactBadge({ impact }: ExperimentImpactBadgeProps) {
  const normalizedImpact = (impact as ExperimentImpact) ?? 'unknown';
  const config = impactConfig[normalizedImpact] ?? impactConfig.unknown;

  return (
    <Tooltip content={config.tooltipLabel}>
      <Badge color={config.color} variant="soft" style={{ cursor: 'default' }}>
        {config.label}
      </Badge>
    </Tooltip>
  );
}
