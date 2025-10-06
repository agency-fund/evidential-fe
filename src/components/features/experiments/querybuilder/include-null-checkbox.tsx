'use client';

import { Checkbox, Flex, Text } from '@radix-ui/themes';

export interface IncludeNullCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function IncludeNullCheckbox({ checked, onChange }: IncludeNullCheckboxProps) {
  return (
    <Text as="label" size="2">
      {/* Height matches TextField.Root default size="2" (30px) */}
      <Flex gap="1" align="center" height="30px">
        <Checkbox checked={checked} onCheckedChange={(checked) => onChange(!!checked)} />
        Include NULL
      </Flex>
    </Text>
  );
}
