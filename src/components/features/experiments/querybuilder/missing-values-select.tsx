'use client';

import { Select } from '@radix-ui/themes';
import { MissingValuesOption } from '@/components/features/experiments/querybuilder/utils';

interface MissingValuesSelectProps {
  value: MissingValuesOption;
  onChange: (value: MissingValuesOption) => void;
}

export function MissingValuesSelect({ value, onChange }: MissingValuesSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(next) => onChange(next as MissingValuesOption)}>
      <Select.Trigger />
      <Select.Content>
        <Select.Item value="any">With or without a value</Select.Item>
        <Select.Item value="has-value">Has a value</Select.Item>
        <Select.Item value="is-missing">Is missing</Select.Item>
      </Select.Content>
    </Select.Root>
  );
}
