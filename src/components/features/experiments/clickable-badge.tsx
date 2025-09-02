'use client';

import { GetMetricsResponseElement, GetStrataResponseElement } from '@/api/methods.schemas';
import { Badge, Flex, HoverCard, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

type ClickableBadgeProps = {
  input: GetMetricsResponseElement | GetStrataResponseElement;
  color?: 'blue' | 'gray';
  showPlus?: boolean;
  onClick: (field_name: string) => void;
};

export function ClickableBadge({ input, onClick, color, showPlus: showPlus = true }: ClickableBadgeProps) {
  const badge = (
    <Badge
      key={input.field_name}
      size={'3'}
      variant={'soft'}
      {...(color ? { color } : {})}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(input.field_name)}
    >
      {showPlus ? <PlusIcon /> : null} {input.field_name}
    </Badge>
  );
  return (
    <HoverCard.Root key={input.field_name}>
      <HoverCard.Trigger>
        <Text>{badge}</Text>
      </HoverCard.Trigger>
      <HoverCard.Content maxWidth="300px">
        <Flex gap="4">
          <DataTypeBadge type={input.data_type} /> {input.description}
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  );
}
