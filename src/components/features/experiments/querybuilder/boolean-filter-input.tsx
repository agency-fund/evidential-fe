'use client';

import { Button, Flex, IconButton, Select } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { FilterInput } from '@/api/methods.schemas';
import { TypedFilter } from '@/components/features/experiments/querybuilder/utils';
import { IncludeNullCheckbox } from '@/components/features/experiments/querybuilder/include-null-checkbox';

export interface BooleanFilterInputProps {
  filter: FilterInput & TypedFilter<boolean>;
  onChange: (filter: FilterInput) => void;
}

export function BooleanFilterInput({ filter, onChange }: BooleanFilterInputProps) {
  const nonNullValues = filter.value.filter((v) => v !== null);
  const hasTrue = filter.value.some((v) => v === true);
  const includesNull = filter.value.some((v) => v === null);

  const handleValueChange = (newValue: boolean) => {
    onChange({
      ...filter,
      relation: 'includes',
      value: includesNull ? [newValue, null] : [newValue],
    });
  };

  const addValue = (e: React.MouseEvent) => {
    e.preventDefault();
    // Add a default boolean value (true) when none exists
    onChange({
      ...filter,
      value: includesNull ? [true, null] : [true],
    });
  };

  const removeValue = (e: React.MouseEvent) => {
    e.preventDefault();
    // Remove the non-null value, leaving only null
    onChange({
      ...filter,
      value: [null],
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
      {nonNullValues.length > 0 ? (
        <Flex gap="1" align="center">
          <Select.Root value={hasTrue ? 'true' : 'false'} onValueChange={(v) => handleValueChange(v === 'true')}>
            <Select.Trigger style={{ width: 128 }} />
            <Select.Content>
              <Select.Item value="true">Is True</Select.Item>
              <Select.Item value="false">Is False</Select.Item>
            </Select.Content>
          </Select.Root>

          {/* Only show the remove button if null is included */}
          {includesNull && (
            <IconButton variant="soft" size="1" onClick={removeValue}>
              <Cross2Icon />
            </IconButton>
          )}
        </Flex>
      ) : (
        /* Show "Add value" button when there are no non-null values */
        <Button variant="soft" size="1" onClick={addValue}>
          <PlusIcon /> Add value
        </Button>
      )}

      <IncludeNullCheckbox checked={includesNull} onChange={handleNullChange} />
    </Flex>
  );
}
