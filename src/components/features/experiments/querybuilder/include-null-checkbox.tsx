'use client';

import { Checkbox, Flex, Text } from '@radix-ui/themes';

export interface IncludeNullCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function IncludeNullCheckbox({ checked, onChange }: IncludeNullCheckboxProps) {
  return (
    <Text as="label" size="2">
      <Flex gap="1" align="center">
        <Checkbox checked={checked} onCheckedChange={(checked) => onChange(!!checked)} />
        Include NULL
      </Flex>
    </Text>
  );
}
