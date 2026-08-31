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
  if (withValue) return missingValue ? 'any' : 'has-value';
  return missingValue ? 'is-missing' : 'neither';
};

export function MissingValuesPicker({ value, onChange, children }: MissingValuesPickerProps) {
  const withValue = value === 'has-value' || value === 'any';
  const missingValue = value === 'any' || value === 'is-missing';

  return (
    <Flex direction="column" gap="2" align="start">
      <Flex gap="3" align="start" wrap="wrap">
        <Text as="label" size="2">
          {/* The label matches the 32px control height so the checkbox centers on the select row. */}
          <Flex gap="2" align="center" height="var(--space-6)">
            <Checkbox
              checked={withValue}
              onCheckedChange={(checked) => onChange(toOption(checked === true, missingValue))}
            />
            with a value
          </Flex>
        </Text>
        {children}
      </Flex>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox
            checked={missingValue}
            onCheckedChange={(checked) => onChange(toOption(withValue, checked === true))}
          />
          missing a value
        </Flex>
      </Text>
      {value === 'neither' ? (
        <Text size="1" color="amber">
          Select at least one option to apply this filter.
        </Text>
      ) : null}
    </Flex>
  );
}
