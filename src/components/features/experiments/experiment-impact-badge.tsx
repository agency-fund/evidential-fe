import { Badge, Flex } from '@radix-ui/themes';
import type { ExperimentImpact } from '@/components/features/experiments/types';

interface ExperimentImpactBadgeProps {
  impact: ExperimentImpact;
  size?: '1' | '2' | '3';
}

const impactConfig: Record<ExperimentImpact, { label: string; color: 'red' | 'yellow' | 'green' | 'blue' | 'gray' }> = {
  high: { label: 'High Impact', color: 'green' },
  medium: { label: 'Medium Impact', color: 'blue' },
  low: { label: 'Low Impact', color: 'yellow' },
  negative: { label: 'Negative Impact', color: 'red' },
  unclear: { label: 'Unclear Impact', color: 'gray' },
};

export function ExperimentImpactBadge({ impact, size = '1' }: ExperimentImpactBadgeProps) {
  const config = impactConfig[impact];

  return (
    <Badge color={config.color} variant="soft" size={size} style={{ cursor: 'default' }}>
      <Flex width="100%" justify="center">
      {config.label}
      </Flex>
    </Badge>
  );
}
