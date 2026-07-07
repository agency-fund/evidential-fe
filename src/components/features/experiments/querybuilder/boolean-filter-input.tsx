'use client';

import { Flex, Select, TextField } from '@radix-ui/themes';
import { Filter } from '@/api/methods.schemas';
import { TypedFilter } from '@/components/features/experiments/querybuilder/utils';

export interface BooleanFilterProps {
  filter: Filter & TypedFilter<boolean>;
  onChange: (filter: Filter) => void;
}

export function BooleanFilter({ filter, onChange }: BooleanFilterProps) {
  const hasTrue = filter.value.some((v) => v === true);

  const handleValueChange = (newValue: boolean) => {
    onChange({ ...filter, relation: 'includes', value: [newValue] });
  };

  return (
    <Flex gap="2" wrap="wrap">
      <TextField.Root value="Is" disabled style={{ width: 128 }} />

      <Select.Root value={hasTrue ? 'true' : 'false'} onValueChange={(v) => handleValueChange(v === 'true')}>
        <Select.Trigger style={{ width: 128 }} />
        <Select.Content>
          <Select.Item value="true">True</Select.Item>
          <Select.Item value="false">False</Select.Item>
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
