'use client';

import { Flex, IconButton, Select, TextField } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataType, Filter } from '@/api/methods.schemas';
import {
  createDefaultValueForOperator,
  operatorToRelation,
  TypedFilter,
} from '@/components/features/experiments/querybuilder/utils';
import React, { useState } from 'react';
import { AddValueButton } from '@/components/features/experiments/querybuilder/add-value-button';

export interface StringFilterProps {
  filter: Filter & TypedFilter<string>;
  onChange: (filter: Filter) => void;
  dataType: DataType;
}

export function StringFilter({ filter, onChange, dataType }: StringFilterProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (!filter.value.some((v) => v !== null)) return 'none';
    if (filter.relation === 'excludes') {
      return 'not-in-list';
    }
    // Default for includes relation
    return 'in-list';
  });

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    if (newOperator === 'none') {
      onChange({ ...filter, relation: 'includes', value: [] });
      return;
    }
    const relation = operatorToRelation(newOperator);
    const defaultValue = createDefaultValueForOperator(newOperator, dataType);

    onChange({
      ...filter,
      relation,
      value: defaultValue,
    });
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newNonNullValues = filter.value.filter((v) => v !== null);
    newNonNullValues[index] = newValue;

    onChange({
      ...filter,
      value: newNonNullValues,
    });
  };

  const addValue = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), ''],
    });
  };

  const removeValue = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    let newNonNullFilterValues = filter.value.filter((v) => v !== null).filter((_, i) => i !== index);

    // Don't allow removing all values - add a default.
    if (newNonNullFilterValues.length === 0) {
      newNonNullFilterValues = [''];
    }

    onChange({
      ...filter,
      value: newNonNullFilterValues,
    });
  };

  const renderValueInputs = () => {
    if (operator === 'none') return null;
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
            {/* Only show the remove button if there are multiple values. */}
            {nonNullValues.length > 1 && (
              <IconButton variant="soft" size="1" onClick={(e) => removeValue(idx, e)}>
                <Cross2Icon />
              </IconButton>
            )}
          </Flex>
        ))}

        {/* Always show add button for list operators, even when no values */}
        <AddValueButton minWidth="176px" onClick={addValue} />
      </Flex>
    );
  };

  return (
    <Flex gap="2" wrap="wrap">
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger style={{ width: 160 }} />
        <Select.Content>
          <Select.Item value="none">All participants</Select.Item>
          <Select.Separator />
          <Select.Item value="in-list">One of</Select.Item>
          <Select.Item value="not-in-list">Not one of</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}
    </Flex>
  );
}
