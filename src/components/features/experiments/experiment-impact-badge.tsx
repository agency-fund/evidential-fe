import { Badge, Flex } from '@radix-ui/themes';
import { Impact } from '@/api/methods.schemas';

import { IMPACT_CONFIG } from '@/services/impact-constants';

interface ExperimentImpactBadgeProps {
  impact?: Impact;
  size?: '1' | '2' | '3';
  useShortLabel?: boolean;
}

export function ExperimentImpactBadge({ impact = '', size = '1', useShortLabel = false }: ExperimentImpactBadgeProps) {
  const config = IMPACT_CONFIG[impact];

  return (
    <Badge color={config.color} variant="soft" size={size} style={{ cursor: 'default' }}>
      <Flex width="100%" justify="center">
        {useShortLabel ? config.shortLabel : config.label}
      </Flex>
    </Badge>
  );
}
