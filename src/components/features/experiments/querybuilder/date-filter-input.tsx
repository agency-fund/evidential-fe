'use client';

import { Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import {
  BETWEEN_BASED_OPS,
  BETWEEN_WITH_NULL_LENGTH,
  createDefaultValueForOperator,
  operatorToRelation,
  TypedFilter,
} from '@/components/features/experiments/querybuilder/utils';
import { useState } from 'react';
import { IncludeNullButton } from '@/components/features/experiments/querybuilder/include-null-button';
import { AddValueButton } from '@/components/features/experiments/querybuilder/add-value-button';

export interface DateFilterInputProps {
  filter: FilterInput & TypedFilter<string>;
  onChange: (filter: FilterInput) => void;
  dataType: DataType;
}

export function DateFilterInput({ filter, onChange, dataType }: DateFilterInputProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (filter.relation === 'between') {
      if (filter.value[0] !== null && filter.value[1] === null) return 'after';
      if (filter.value[0] === null && filter.value[1] !== null) return 'before';
      return 'between';
    }
    if (filter.relation === 'excludes') {
      return 'not-in-list';
    }
    // Default for includes relation
    return 'in-list';
  });

  const includesNull = BETWEEN_BASED_OPS.has(operator)
    ? filter.value.length === BETWEEN_WITH_NULL_LENGTH && filter.value[2] === null
    : filter.value.includes(null);
  const includesNullValue = includesNull ? [null] : [];

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    const relation = operatorToRelation(newOperator);
    const defaultValue = createDefaultValueForOperator(newOperator, dataType);

    onChange({
      ...filter,
      relation,
      value: defaultValue,
    });
  };

  const handleValueChange = (index: number, newValue: string) => {
    // Extract non-null values, update the correct one by index, then re-append null if present
    const newNonNullValues = filter.value.filter((v) => v !== null);
    newNonNullValues[index] = newValue;
    onChange({
      ...filter,
      value: [...newNonNullValues, ...includesNullValue],
    });
  };

  const addValueForListBasedOp = (e: React.MouseEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), today, ...includesNullValue],
    });
  };

  // Preserves NULL values when removing items from the list.  Assumes that there can only be at
  // most one null value in filter.value as managed by the 'Include NULL' button.
  const removeValueForListBasedOp = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    // Derive new filter.value state
    // First remove any null value if it exists, in case it was added in some arbitrary position.
    const nonNullFilterValues = filter.value.filter((v) => v !== null);
    // Next remove the value at the given index from the non-null values, as it is safe to assume
    // the ordering now is aligned with the old listValues.
    let newNonNullFilterValues = nonNullFilterValues.filter((_, i) => i !== index);

    // Don't allow removing all values (unless NULL is included) - add a default
    if (newNonNullFilterValues.length === 0 && !includesNull) {
      const today = new Date().toISOString().split('T')[0];
      newNonNullFilterValues = [today];
    }

    onChange({
      ...filter,
      value: [...newNonNullFilterValues, ...includesNullValue],
    });
  };

  const handleNullChange = (includeNull: boolean) => {
    let baseValues: typeof filter.value;
    if (BETWEEN_BASED_OPS.has(operator)) {
      // Ensure we have valid values for between-based operators
      const val0 = filter.value[0] !== undefined ? filter.value[0] : null;
      const val1 = filter.value[1] !== undefined ? filter.value[1] : null;
      baseValues = [val0, val1] as typeof filter.value;
    } else {
      baseValues = filter.value.filter((v) => v !== null) as typeof filter.value;
    }
    const newValues = includeNull ? ([...baseValues, null] as typeof filter.value) : baseValues;
    onChange({ ...filter, value: newValues });
  };

  const renderValueInputs = () => {
    switch (operator) {
      case 'after':
        return (
          <Flex direction="column" gap="1">
            <TextField.Root
              type="date"
              value={filter.value[0] as string}
              onChange={(e) => {
                onChange({ ...filter, value: [e.target.value, null, ...includesNullValue] });
              }}
            />
            <IncludeNullButton checked={includesNull} onChange={handleNullChange} minWidth="145px" />
          </Flex>
        );

      case 'before':
        return (
          <Flex direction="column" gap="1">
            <TextField.Root
              type="date"
              value={filter.value[1] as string}
              onChange={(e) => {
                onChange({ ...filter, value: [null, e.target.value, ...includesNullValue] });
              }}
            />
            <IncludeNullButton checked={includesNull} onChange={handleNullChange} minWidth="145px" />
          </Flex>
        );

      case 'between':
        return (
          <Flex direction="column" gap="1">
            <Flex gap="2" align="center">
              <TextField.Root
                type="date"
                value={filter.value[0] as string}
                onChange={(e) => {
                  onChange({ ...filter, value: [e.target.value, filter.value[1], ...includesNullValue] });
                }}
              />
              <Text>and</Text>
              <TextField.Root
                type="date"
                value={filter.value[1] as string}
                onChange={(e) => {
                  onChange({ ...filter, value: [filter.value[0], e.target.value, ...includesNullValue] });
                }}
              />
            </Flex>
            <IncludeNullButton checked={includesNull} onChange={handleNullChange} minWidth="334px" />
          </Flex>
        );

      case 'in-list':
      case 'not-in-list':
        const nonNullValues = filter.value.filter((v) => v !== null);

        return (
          <Flex direction="column" gap="1">
            {nonNullValues.map((val, idx) => (
              <Flex key={idx} gap="1" align="center">
                <TextField.Root
                  type="date"
                  value={val as string}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                />
                {/* Only show the remove button if there are multiple non-null values or if null
                    is included, since we allow a single null value. */}
                {(nonNullValues.length > 1 || includesNull) && (
                  <IconButton variant="soft" size="1" onClick={(e) => removeValueForListBasedOp(idx, e)}>
                    <Cross2Icon />
                  </IconButton>
                )}
              </Flex>
            ))}

            <IncludeNullButton
              checked={includesNull}
              onChange={handleNullChange}
              singularValue={nonNullValues.length === 0}
              minWidth="145px"
            />

            {/* Always show add button for list operators, even when no values */}
            <AddValueButton minWidth="145px" onClick={addValueForListBasedOp} />
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <Flex gap="2" wrap="wrap">
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger style={{ width: 128 }} />
        <Select.Content>
          <Select.Item value="in-list">Is one of</Select.Item>
          <Select.Item value="not-in-list">Not any of</Select.Item>
          <Select.Item value="before">Before</Select.Item>
          <Select.Item value="after">After</Select.Item>
          <Select.Item value="between">Between</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}
    </Flex>
  );
}
