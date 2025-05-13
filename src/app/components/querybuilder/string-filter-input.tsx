'use client';

import { Button, Checkbox, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { DataType, Filter } from '@/api/methods.schemas';
import { TypedFilter, createDefaultValueForOperator, operatorToRelation } from './utils';
import React, { useState } from 'react';

export interface StringFilterInputProps {
  filter: Filter & TypedFilter<string>;
  onChange: (filter: Filter) => void;
  dataType: DataType;
}

export function StringFilterInput({ filter, onChange, dataType }: StringFilterInputProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (filter.relation === 'excludes') {
      return filter.value.length > 1 ? 'not-in-list' : 'not-equals';
    }
    // Default for includes relation
    return filter.value.length > 1 ? 'in-list' : 'equals';
  });

  const includesNull = filter.value.includes(null);

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
    const newValues = [...filter.value];
    newValues[index] = newValue;
    onChange({
      ...filter,
      value: newValues,
    });
  };

  const addValue = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), '', ...(includesNull ? [null] : [])],
    });
  };

  const removeValue = (index: number) => {
    const newValues = filter.value.filter((_, i) => i !== index);
    if (newValues.length === 0) {
      // Don't allow removing all values - add a default empty one
      newValues.push('');
    }
    onChange({
      ...filter,
      value: newValues,
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
            <TextField.Root value={val as string} onChange={(e) => handleValueChange(idx, e.target.value)} />
            {/* Only show the remove button if there are multiple non-null values or if null
                is included, since we allow a single null value. */}
            {(nonNullValues.length > 1 || includesNull) && (
              <IconButton
                variant="soft"
                size="1"
                onClick={(e) => {
                  e.preventDefault();
                  removeValue(idx);
                }}
              >
                <Cross2Icon />
              </IconButton>
            )}
          </Flex>
        ))}

        {(operator === 'in-list' || operator === 'not-in-list') && (
          <Button variant="soft" size="1" onClick={addValue}>
            <PlusIcon /> Add value
          </Button>
        )}
      </Flex>
    );
  };

  // For UUID, we only want to show includes/excludes operators
  const isUuid = dataType === 'uuid';

  return (
    <Flex gap="2" align="center">
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="equals">Equals</Select.Item>
          <Select.Item value="not-equals">Not equals</Select.Item>
          {!isUuid && (
            <>
              <Select.Item value="in-list">Is one of</Select.Item>
              <Select.Item value="not-in-list">Is not one of</Select.Item>
            </>
          )}
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}

      {(operator === 'equals' ||
        operator === 'in-list' ||
        operator === 'not-in-list') && (
        <Flex gap="1" align="center">
          <Checkbox checked={includesNull} onCheckedChange={(checked) => handleNullChange(!!checked)} />
          <Text size="2">Include NULL</Text>
        </Flex>
      )}
    </Flex>
  );
}
