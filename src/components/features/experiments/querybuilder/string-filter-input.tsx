'use client';

import { Flex, IconButton, Select, TextField } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import {
  createDefaultValueForOperator,
  operatorToRelation,
  TypedFilter,
} from '@/components/features/experiments/querybuilder/utils';
import React, { useState } from 'react';
import { IncludeNullButton } from '@/components/features/experiments/querybuilder/include-null-button';
import { AddValueButton } from '@/components/features/experiments/querybuilder/add-value-button';

export interface StringFilterInputProps {
  filter: FilterInput & TypedFilter<string>;
  onChange: (filter: FilterInput) => void;
  dataType: DataType;
}

export function StringFilterInput({ filter, onChange, dataType }: StringFilterInputProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (filter.relation === 'excludes') {
      return 'not-in-list';
    }
    // Default for includes relation
    return 'in-list';
  });

  const includesNull = filter.value.includes(null);
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

  const addValue = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), '', ...includesNullValue],
    });
  };

  // Preserves NULL values when removing items from the list. Assumes that there can only be at
  // most one null value in filter.value as managed by the 'Include NULL' button.
  const removeValue = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    // Derive new filter.value state
    // First remove any null value if it exists, in case it was added in some arbitrary position.
    const nonNullFilterValues = filter.value.filter((v) => v !== null);
    // Next remove the value at the given index from the non-null values, as it is safe to assume
    // the ordering now is aligned with the displayed values.
    let newNonNullFilterValues = nonNullFilterValues.filter((_, i) => i !== index);

    // Don't allow removing all values (unless NULL is included) - add a default
    if (newNonNullFilterValues.length === 0 && !includesNull) {
      newNonNullFilterValues = [''];
    }

    onChange({
      ...filter,
      value: [...newNonNullFilterValues, ...includesNullValue],
    });
  };

  const handleNullChange = (includeNull: boolean) => {
    if (includeNull) {
      onChange({
        ...filter,
        value: [...filter.value.filter((v) => v !== null), null],
      });
    } else {
      onChange({
        ...filter,
        value: filter.value.filter((v) => v !== null),
      });
    }
  };

  const renderValueInputs = () => {
    const nonNullValues = filter.value.filter((v) => v !== null);

    return (
      <Flex direction="column" gap="1">
        {nonNullValues.map((val, idx) => (
          <Flex key={idx} gap="1" align="center">
            <TextField.Root
              value={val as string}
              style={{ width: '20ch' }}
              onChange={(e) => handleValueChange(idx, e.target.value)}
            />
            {/* Only show the remove button if there are multiple non-null values or if null
                is included, since we allow a single null value. */}
            {(nonNullValues.length > 1 || includesNull) && (
              <IconButton variant="soft" size="1" onClick={(e) => removeValue(idx, e)}>
                <Cross2Icon />
              </IconButton>
            )}
          </Flex>
        ))}

        <IncludeNullButton
          checked={includesNull}
          onChange={handleNullChange}
          singularValue={nonNullValues.length === 0}
          minWidth="176px"
        />

        {/* Always show add button for list operators, even when no values */}
        <AddValueButton minWidth="176px" onClick={addValue} />
      </Flex>
    );
  };

  return (
    <Flex gap="2" wrap="wrap">
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger style={{ width: 128 }} />
        <Select.Content>
          <Select.Item value="in-list">Is one of</Select.Item>
          <Select.Item value="not-in-list">is not one of</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}
    </Flex>
  );
}
