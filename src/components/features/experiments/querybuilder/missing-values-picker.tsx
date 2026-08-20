'use client';

import { Checkbox, Flex, Text } from '@radix-ui/themes';
import { ReactNode } from 'react';
import { MissingValuesOption } from '@/components/features/experiments/querybuilder/utils';

interface MissingValuesPickerProps {
  value: MissingValuesOption;
  onChange: (value: MissingValuesOption) => void;
  /** Value controls rendered inline after "with a value", which is the population they narrow. */
  children?: ReactNode;
}

const toOption = (withValue: boolean, missingValue: boolean): MissingValuesOption => {
  if (!withValue) return 'is-missing';
  return missingValue ? 'any' : 'has-value';
};

export function MissingValuesPicker({ value, onChange, children }: MissingValuesPickerProps) {
  const withValue = value !== 'is-missing';
  const missingValue = value !== 'has-value';

  // Keep at least one population included: the last checked box can't be unchecked.
  const handleChange = (nextWithValue: boolean, nextMissingValue: boolean) => {
    if (!nextWithValue && !nextMissingValue) return;
    onChange(toOption(nextWithValue, nextMissingValue));
  };

  return (
    <Flex direction="column" gap="2" align="start">
      <Flex gap="3" align="start" wrap="wrap">
        <Text as="label" size="2">
          {/* The label matches the 32px control height so the checkbox centers on the select row. */}
          <Flex gap="2" align="center" height="var(--space-6)">
            <Checkbox checked={withValue} onCheckedChange={(checked) => handleChange(checked === true, missingValue)} />
            with a value
          </Flex>
        </Text>
        {children}
      </Flex>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox checked={missingValue} onCheckedChange={(checked) => handleChange(withValue, checked === true)} />
          missing a value
        </Flex>
      </Text>
    </Flex>
  );
}
