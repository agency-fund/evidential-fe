'use client';

import { GetMetricsResponseElement, GetStrataResponseElement } from '@/api/methods.schemas';
import { Badge, Flex, HoverCard, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

type ClickableBadgeProps = {
  input: GetMetricsResponseElement | GetStrataResponseElement;
  color?: 'blue' | 'gray';
  isMetric?: boolean;
  onClick: (field_name: string) => void;
};

export function ClickableBadge({ input: metric, onClick, color, isMetric = true }: ClickableBadgeProps) {
  const badge = (
    <Badge
      key={metric.field_name}
      size={'3'}
      variant={'soft'}
      {...(color ? { color } : {})}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(metric.field_name)}
    >
      {isMetric ? <PlusIcon /> : null} {metric.field_name}
    </Badge>
  );
  return (
    <HoverCard.Root key={metric.field_name}>
      <HoverCard.Trigger>
        <Text>{badge}</Text>
      </HoverCard.Trigger>
      <HoverCard.Content maxWidth="300px">
        <Flex gap="4">
          <DataTypeBadge type={metric.data_type} /> {metric.description}
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  );
}
