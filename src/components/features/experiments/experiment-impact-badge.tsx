import { Badge, Flex } from '@radix-ui/themes';

interface ExperimentImpactBadgeProps {
  impact: string;
  size?: '1' | '2' | '3';
  short?: boolean;
}

interface ImpactValue {
  label: string;
  short: string;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'gray';
}

const impactConfig: Record<string, ImpactValue> = {
  high: { label: 'High Impact', short: 'High', color: 'green' },
  medium: { label: 'Medium Impact', short: 'Medium', color: 'blue' },
  low: { label: 'Low Impact', short: 'Low', color: 'yellow' },
  negative: { label: 'Negative Impact', short: 'Negative', color: 'red' },
  unclear: { label: 'Unclear Impact', short: 'Unclear', color: 'gray' },
};

export function ExperimentImpactBadge({ impact, size = '1', short = false }: ExperimentImpactBadgeProps) {
  const config = impactConfig[impact];

  return (
    <Badge color={config.color} variant="soft" size={size} style={{ cursor: 'default' }}>
      <Flex width="100%" justify="center">
        {short ? config.short : config.label}
      </Flex>
    </Badge>
  );
}
