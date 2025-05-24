'use client';

import { GetMetricsResponseElement } from '@/api/methods.schemas';
import { Badge, Flex, HoverCard, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

type ClickableBadgeProps = {
  metric: GetMetricsResponseElement;
  onClick: (field_name: string) => void;
};

export function ClickableBadge({ metric, onClick }: ClickableBadgeProps) {
  const badge = (
    <Badge
      key={metric.field_name}
      size={'3'}
      variant={'soft'}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(metric.field_name)}
    >
      <PlusIcon /> {metric.field_name}
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
