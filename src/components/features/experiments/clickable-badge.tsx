'use client';

import { GetMetricsResponseElement, GetStrataResponseElement, DataType } from '@/api/methods.schemas';
import { Badge, Flex, HoverCard, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

type MinimalClickableBadgeInput = {
  field_name: string;
  data_type: DataType;
  description: string;
};
type ClickableBadgeInput = MinimalClickableBadgeInput | GetMetricsResponseElement | GetStrataResponseElement;

type ClickableBadgeProps<TInput extends ClickableBadgeInput> = {
  input: TInput;
  color?: 'blue' | 'gray';
  showPlus?: boolean;
  onClick: (input: TInput) => void;
};

export function ClickableBadge<TInput extends ClickableBadgeInput>({
  input,
  onClick,
  color,
  showPlus: showPlus = true,
}: ClickableBadgeProps<TInput>) {
  const badge = (
    <Badge
      key={input.field_name}
      size={'3'}
      variant={'soft'}
      {...(color ? { color } : {})}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(input)}
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
