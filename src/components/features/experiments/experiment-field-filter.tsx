'use client';

import { CheckboxGroup, DropdownMenu, Button, Flex, Text } from '@radix-ui/themes';

export interface FieldOption {
  field: string;
  count: number;
}

interface ExperimentFieldFilterProps {
  value: string[];
  onChange: (selectedFields: string[]) => void;
  options: FieldOption[];
}

export function ExperimentFieldFilter({ value, onChange, options }: ExperimentFieldFilterProps) {
  const displayLabel = value.length === 0 ? 'Fields' : `Fields (${value.length})`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline">
          {displayLabel}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <CheckboxGroup.Root value={value} onValueChange={onChange}>
          <Flex direction="column" gap="3" px="1" py="2">
            {options.map(({ field, count }) => (
              <CheckboxGroup.Item key={field} value={field}>
                <Text>
                  {field} <Text style={{ color: 'var(--gray-11)' }}>({count})</Text>
                </Text>
              </CheckboxGroup.Item>
            ))}
          </Flex>
        </CheckboxGroup.Root>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
