'use client';

import { Checkbox, Flex, Select, Text } from '@radix-ui/themes';
import { AudienceSpecFilterInput } from '@/api/methods.schemas';
import { useState } from 'react';

export interface BooleanFilterInputProps {
  filter: AudienceSpecFilterInput;
  onChange: (filter: AudienceSpecFilterInput) => void;
}

export function BooleanFilterInput({ filter, onChange }: BooleanFilterInputProps) {
  // For boolean, we just need to track if it's true or false
  const [isTrue, setIsTrue] = useState(() => {
    const nonNullValue = filter.value.find(v => v !== null);
    return nonNullValue === true;
  });
  
  const includesNull = filter.value.includes(null);

  const handleValueChange = (newValue: boolean) => {
    setIsTrue(newValue);
    onChange({
      ...filter,
      relation: 'includes',
      value: includesNull ? [newValue, null] : [newValue],
    });
  };

  const handleNullChange = (includeNull: boolean) => {
    onChange({
      ...filter,
      value: includeNull ? [isTrue, null] : [isTrue],
    });
  };

  return (
    <Flex gap="2" align="center">
      <Select.Root value={String(value)} onValueChange={(v) => handleValueChange(v === 'true')}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="true">Is True</Select.Item>
          <Select.Item value="false">Is False</Select.Item>
        </Select.Content>
      </Select.Root>

      <Flex gap="1" align="center">
        <Checkbox checked={includesNull} onCheckedChange={(checked) => handleNullChange(!!checked)} />
        <Text size="2">Include NULL values</Text>
      </Flex>
    </Flex>
  );
}
