'use client';

import { Flex, Select } from '@radix-ui/themes';
import { Filter } from '@/api/methods.schemas';
import { TypedFilter } from '@/components/features/experiments/querybuilder/utils';

export interface BooleanFilterProps {
  filter: Filter & TypedFilter<boolean>;
  onChange: (filter: Filter) => void;
}

export function BooleanFilter({ filter, onChange }: BooleanFilterProps) {
  const hasValue = filter.value.some((v) => v !== null);
  const selected = !hasValue ? undefined : filter.value.some((v) => v === true) ? 'true' : 'false';

  const handleChange = (choice: string) => {
    if (choice === 'none') {
      onChange({ ...filter, relation: 'includes', value: [] });
      return;
    }
    onChange({ ...filter, relation: 'includes', value: [choice === 'true'] });
  };

  return (
    <Flex gap="2" wrap="wrap">
      {/* An empty string keeps the Select controlled while matching no item, so the placeholder shows. */}
      <Select.Root value={selected ?? ''} onValueChange={handleChange}>
        <Select.Trigger style={{ width: 160 }} placeholder="Add a constraint…" />
        <Select.Content>
          <Select.Item value="none">No constraint</Select.Item>
          <Select.Separator />
          <Select.Item value="true">Is true</Select.Item>
          <Select.Item value="false">Is false</Select.Item>
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
