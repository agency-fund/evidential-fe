'use client';

import { GetMetricsResponseElement, GetStrataResponseElement, DataType } from '@/api/methods.schemas';
import { Badge, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import FieldDataCard from '@/components/ui/cards/field-data-card';

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

  return <FieldDataCard field={input} trigger={<Text>{badge}</Text>} />;
}
