'use client';

import { RadioCards, Text } from '@radix-ui/themes';
import { MissingValuesOption } from '@/components/features/experiments/querybuilder/utils';

interface MissingValuesPickerProps {
  value: MissingValuesOption;
  onChange: (value: MissingValuesOption) => void;
}

const OPTIONS: Array<{ value: MissingValuesOption; label: string }> = [
  { value: 'has-value', label: 'Has a value' },
  { value: 'any', label: 'Has a value or missing' },
  { value: 'is-missing', label: 'Is missing' },
];

export function MissingValuesPicker({ value, onChange }: MissingValuesPickerProps) {
  return (
    <RadioCards.Root
      value={value}
      onValueChange={(next) => onChange(next as MissingValuesOption)}
      size="2"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
    >
      {OPTIONS.map((option) => (
        <RadioCards.Item key={option.value} value={option.value} style={{ height: 'var(--space-6)', paddingBlock: 0 }}>
          <Text size="2">{option.label}</Text>
        </RadioCards.Item>
      ))}
    </RadioCards.Root>
  );
}
