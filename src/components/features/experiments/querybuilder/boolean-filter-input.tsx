'use client';

import { Flex, Select } from '@radix-ui/themes';
import { FilterInput } from '@/api/methods.schemas';
import { TypedFilter } from '@/components/features/experiments/querybuilder/utils';
import { IncludeNullCheckbox } from '@/components/features/experiments/querybuilder/include-null-checkbox';

export interface BooleanFilterInputProps {
  filter: FilterInput & TypedFilter<boolean>;
  onChange: (filter: FilterInput) => void;
}

export function BooleanFilterInput({ filter, onChange }: BooleanFilterInputProps) {
  const hasTrue = filter.value.some((v) => v === true);
  const includesNull = filter.value.some((v) => v === null);

  const handleValueChange = (newValue: boolean) => {
    onChange({
      ...filter,
      relation: 'includes',
      value: includesNull ? [newValue, null] : [newValue],
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
    <Flex gap="2" align="start" wrap="wrap">
      <Select.Root value={hasTrue ? 'true' : 'false'} onValueChange={(v) => handleValueChange(v === 'true')}>
        <Select.Trigger style={{ width: 128 }} />
        <Select.Content>
          <Select.Item value="true">Is True</Select.Item>
          <Select.Item value="false">Is False</Select.Item>
        </Select.Content>
      </Select.Root>

      <IncludeNullCheckbox checked={includesNull} onChange={handleNullChange} />
    </Flex>
  );
}
