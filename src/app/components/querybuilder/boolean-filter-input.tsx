'use client';

import { Checkbox, Flex, Select, Text } from '@radix-ui/themes';
import { AudienceSpecFilter } from '@/api/methods.schemas';

export interface BooleanFilterInputProps {
  filter: AudienceSpecFilter;
  onChange: (filter: AudienceSpecFilter) => void;
}

export function BooleanFilterInput({ filter, onChange }: BooleanFilterInputProps) {
  const hasTrue = filter.value.some((v) => v === true);
  const hasNull = filter.value.some((v) => v === null);

  const handleValueChange = (newValue: boolean) => {
    onChange({
      ...filter,
      relation: 'includes',
      value: hasNull ? [newValue, null] : [newValue],
    });
  };

  const handleNullChange = (includeNull: boolean) => {
    const value = filter.value.filter((v) => v !== null);
    const newValue = includeNull ? [...value, null] : value;
    onChange({
      ...filter,
      value: newValue,
    });
  };

  return (
    <Flex gap="2" align="center">
      <Select.Root value={hasTrue ? 'true' : 'false'} onValueChange={(v) => handleValueChange(v === 'true')}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="true">Is True</Select.Item>
          <Select.Item value="false">Is False</Select.Item>
        </Select.Content>
      </Select.Root>

      <Flex gap="1" align="center">
        <Checkbox checked={hasNull} onCheckedChange={(checked) => handleNullChange(checked === true)} />
        <Text size="2">Include NULL values</Text>
      </Flex>
    </Flex>
  );
}
