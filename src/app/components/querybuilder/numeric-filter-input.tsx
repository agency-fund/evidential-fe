'use client';

import { Button, Checkbox, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { AudienceSpecFilter, DataType } from '@/api/methods.schemas';
import { TypedFilter, createDefaultValueForOperator, operatorToRelation } from './utils';
import React, { useState } from 'react';

export interface NumericFilterInputProps {
  filter: AudienceSpecFilter & TypedFilter<number>;
  onChange: (filter: AudienceSpecFilter) => void;
  dataType: DataType;
}

export function NumericFilterInput({ filter, onChange, dataType }: NumericFilterInputProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (filter.relation === 'between') {
      if (filter.value[0] !== null && filter.value[1] === null) return 'greater-than';
      if (filter.value[0] === null && filter.value[1] !== null) return 'less-than';
      return 'between';
    }
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

  const parseValue = (inputValue: string): number => {
    // Check if the input is a valid number string (allowing for empty decimal points, etc.)
    const isValidNumber = /^-?\d*\.?\d*$/.test(inputValue) && inputValue.trim() !== '';

    if (!isValidNumber) {
      // Return the current value or 0 if there isn't one
      const currentValue = filter.value[0];
      return typeof currentValue === 'number' && !isNaN(currentValue) ? currentValue : 0;
    }

    const parsedValue =
      dataType === 'integer' || dataType === 'bigint' ? parseInt(inputValue, 10) : parseFloat(inputValue);

    // If parsing resulted in NaN, return 0 as a fallback
    return isNaN(parsedValue) ? 0 : parsedValue;
  };

  const getStepAttribute = (): string => {
    if (dataType === 'integer' || dataType === 'bigint') {
      return '1';
    } else {
      return 'any'; // Allows any decimal input for floating-point types
    }
  };

  const handleValueChange = (index: number, newValue: string) => {
    const parsedValue = parseValue(newValue);
    // Ensure we never set NaN values in the filter
    if (!isNaN(parsedValue)) {
      const newValues = [...filter.value];
      newValues[index] = parsedValue;
      onChange({
        ...filter,
        value: newValues,
      });
    }
  };

  const addValue = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), defaultValue, ...(includesNull ? [null] : [])],
    });
  };

  const removeValue = (index: number) => {
    const newValues = filter.value.filter((_, i) => i !== index);
    if (newValues.length === 0 || (newValues.length === 1 && newValues[0] === null)) {
      // Don't allow removing all non-null values - add a default one
      const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
      newValues.unshift(defaultValue);
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
    switch (operator) {
      case 'equals':
      case 'not-equals':
        return (
          <TextField.Root
            type="number"
            step={getStepAttribute()}
            value={filter.value[0] as number}
            onChange={(e) => handleValueChange(0, e.target.value)}
          />
        );

      case 'greater-than':
        return (
          <TextField.Root
            type="number"
            step={getStepAttribute()}
            value={filter.value[0] as number}
            onChange={(e) => {
              const value = parseValue(e.target.value);
              if (!isNaN(value)) {
                onChange({ ...filter, value: [value, null] });
              }
            }}
          />
        );

      case 'less-than':
        return (
          <TextField.Root
            type="number"
            step={getStepAttribute()}
            value={filter.value[1] as number}
            onChange={(e) => {
              const value = parseValue(e.target.value);
              if (!isNaN(value)) {
                onChange({ ...filter, value: [null, value] });
              }
            }}
          />
        );

      case 'between':
        return (
          <Flex gap="2" align="center">
            <TextField.Root
              type="number"
              step={getStepAttribute()}
              value={filter.value[0] as number}
              onChange={(e) => {
                const min = parseValue(e.target.value);
                if (!isNaN(min)) {
                  onChange({ ...filter, value: [min, filter.value[1]] });
                }
              }}
            />
            <Text>and</Text>
            <TextField.Root
              type="number"
              step={getStepAttribute()}
              value={filter.value[1] as number}
              onChange={(e) => {
                const max = parseValue(e.target.value);
                if (!isNaN(max)) {
                  onChange({ ...filter, value: [filter.value[0], max] });
                }
              }}
            />
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
                  type="number"
                  step={getStepAttribute()}
                  value={val as number}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                />
                {nonNullValues.length > 1 && (
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

            <Button variant="soft" size="1" onClick={addValue}>
              <PlusIcon /> Add value
            </Button>
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <Flex gap="2" align="center">
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="equals">Equals</Select.Item>
          <Select.Item value="not-equals">Not equals</Select.Item>
          <Select.Item value="greater-than">Greater than</Select.Item>
          <Select.Item value="less-than">Less than</Select.Item>
          <Select.Item value="between">Between</Select.Item>
          <Select.Item value="in-list">In list</Select.Item>
          <Select.Item value="not-in-list">Not in list</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}

      {(operator === 'equals' || operator === 'in-list') && (
        <Flex gap="1" align="center">
          <Checkbox checked={includesNull} onCheckedChange={(checked) => handleNullChange(!!checked)} />
          <Text size="2">Include NULL</Text>
        </Flex>
      )}
    </Flex>
  );
}
