'use client';

import { Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataType, Filter } from '@/api/methods.schemas';
import {
  createDefaultValueForOperator,
  operatorToRelation,
  TypedFilter,
} from '@/components/features/experiments/querybuilder/utils';
import React, { useEffect, useState } from 'react';
import { AddValueButton } from '@/components/features/experiments/querybuilder/add-value-button';

export interface NumericFilterProps {
  filter: Filter & TypedFilter<number>;
  onChange: (filter: Filter) => void;
  dataType: DataType;
}

export function NumericFilter({ filter, onChange, dataType }: NumericFilterProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (!filter.value.some((v) => v !== null)) return 'none';
    if (filter.relation === 'between') {
      if (filter.value[0] !== null && filter.value[1] === null) return 'gte';
      if (filter.value[0] === null && filter.value[1] !== null) return 'lte';
      return 'between';
    }
    if (filter.relation === 'excludes') {
      return 'not-in-list';
    }
    // Default for includes relation
    return 'in-list';
  });

  // String-based input states for each possible input field
  const [greaterThanValue, setGreaterThanValue] = useState(() =>
    filter.value[0] !== null ? String(filter.value[0]) : '',
  );
  const [lessThanValue, setLessThanValue] = useState(() => (filter.value[1] !== null ? String(filter.value[1]) : ''));
  const [betweenMinValue, setBetweenMinValue] = useState(() =>
    filter.value[0] !== null ? String(filter.value[0]) : '',
  );
  const [betweenMaxValue, setBetweenMaxValue] = useState(() =>
    filter.value[1] !== null ? String(filter.value[1]) : '',
  );
  const [listValues, setListValues] = useState<string[]>(() => filter.value.filter((v) => v !== null).map(String));

  // Update string states when filter changes externally
  useEffect(() => {
    if (operator === 'gte') {
      setGreaterThanValue(filter.value[0] !== null ? String(filter.value[0]) : '');
    } else if (operator === 'lte') {
      setLessThanValue(filter.value[1] !== null ? String(filter.value[1]) : '');
    } else if (operator === 'between') {
      setBetweenMinValue(filter.value[0] !== null ? String(filter.value[0]) : '');
      setBetweenMaxValue(filter.value[1] !== null ? String(filter.value[1]) : '');
    } else if (['in-list', 'not-in-list'].includes(operator)) {
      setListValues(filter.value.filter((v) => v !== null).map(String));
    }
  }, [filter.value, operator]);

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

  const parseValue = (inputValue: string): number | null => {
    // Allow empty string to be treated as a special case
    if (inputValue.trim() === '' || inputValue === '-') {
      return null;
    }

    // Check if the input is a valid number string
    const isValidNumber = /^-?\d*\.?\d*$/.test(inputValue);
    if (!isValidNumber) {
      return null;
    }

    const parsedValue =
      dataType === 'integer' || dataType === 'bigint' ? parseInt(inputValue, 10) : parseFloat(inputValue);

    // If parsing resulted in NaN, return null
    return isNaN(parsedValue) ? null : parsedValue;
  };

  const getStepAttribute = (): string => {
    if (dataType === 'integer' || dataType === 'bigint') {
      return '1';
    } else {
      return 'any'; // Allows any decimal input for floating-point types
    }
  };

  const handleListValueChange = (index: number, inputValue: string) => {
    // Update the string state
    const newListValues = [...listValues];
    newListValues[index] = inputValue;
    setListValues(newListValues);

    // Parse and update the actual filter if valid
    const parsedValue = parseValue(inputValue);
    if (parsedValue !== null) {
      const newNonNullValues = [...filter.value.filter((v) => v !== null)];
      newNonNullValues[index] = parsedValue;

      onChange({
        ...filter,
        value: newNonNullValues,
      });
    }
  };

  const addValueForListBasedOp = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;

    // Update string state
    setListValues([...listValues, String(defaultValue)]);

    // Update filter
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), defaultValue],
    });
  };

  const removeValueForListBasedOp = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    let newListValues = listValues.filter((_, i) => i !== index);
    let newNonNullFilterValues = filter.value.filter((v) => v !== null).filter((_, i) => i !== index);

    // Don't allow removing all values - add a default.
    if (newNonNullFilterValues.length === 0) {
      const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
      newListValues = [String(defaultValue)];
      newNonNullFilterValues = [defaultValue];
    }

    setListValues(newListValues);
    onChange({
      ...filter,
      value: newNonNullFilterValues,
    });
  };

  const renderValueInputs = () => {
    switch (operator) {
      case 'gte':
        return (
          <TextField.Root
            type="text"
            inputMode="decimal"
            step={getStepAttribute()}
            value={greaterThanValue}
            style={{ width: '20ch' }}
            onChange={(e) => {
              const inputValue = e.target.value;
              setGreaterThanValue(inputValue);

              const parsedValue = parseValue(inputValue);
              if (parsedValue !== null) {
                onChange({ ...filter, value: [parsedValue, null] });
              }
            }}
            onBlur={() => {
              if (greaterThanValue.trim() === '' || greaterThanValue === '-') {
                const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                setGreaterThanValue(String(defaultValue));
                onChange({ ...filter, value: [defaultValue, null] });
              }
            }}
          />
        );

      case 'lte':
        return (
          <TextField.Root
            type="text"
            inputMode="decimal"
            step={getStepAttribute()}
            value={lessThanValue}
            style={{ width: '20ch' }}
            onChange={(e) => {
              const inputValue = e.target.value;
              setLessThanValue(inputValue);

              const parsedValue = parseValue(inputValue);
              if (parsedValue !== null) {
                onChange({ ...filter, value: [null, parsedValue] });
              }
            }}
            onBlur={() => {
              if (lessThanValue.trim() === '' || lessThanValue === '-') {
                const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                setLessThanValue(String(defaultValue));
                onChange({ ...filter, value: [null, defaultValue] });
              }
            }}
          />
        );

      case 'between':
        return (
          <Flex gap="2" align="center">
            <TextField.Root
              type="text"
              inputMode="decimal"
              step={getStepAttribute()}
              value={betweenMinValue}
              style={{ width: '20ch' }}
              onChange={(e) => {
                const inputValue = e.target.value;
                setBetweenMinValue(inputValue);

                const parsedValue = parseValue(inputValue);
                if (parsedValue !== null) {
                  onChange({ ...filter, value: [parsedValue, filter.value[1]] });
                }
              }}
              onBlur={() => {
                if (betweenMinValue.trim() === '' || betweenMinValue === '-') {
                  const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                  setBetweenMinValue(String(defaultValue));
                  onChange({ ...filter, value: [defaultValue, filter.value[1]] });
                }
              }}
            />
            <Text>and</Text>
            <TextField.Root
              type="text"
              inputMode="decimal"
              step={getStepAttribute()}
              value={betweenMaxValue}
              onChange={(e) => {
                const inputValue = e.target.value;
                setBetweenMaxValue(inputValue);

                const parsedValue = parseValue(inputValue);
                if (parsedValue !== null) {
                  onChange({ ...filter, value: [filter.value[0], parsedValue] });
                }
              }}
              onBlur={() => {
                if (betweenMaxValue.trim() === '' || betweenMaxValue === '-') {
                  const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                  setBetweenMaxValue(String(defaultValue));
                  onChange({ ...filter, value: [filter.value[0], defaultValue] });
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
            {listValues.map((val, idx) => (
              <Flex key={idx} gap="1" align="center">
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  step={getStepAttribute()}
                  value={val}
                  style={{ width: '20ch' }}
                  onChange={(e) => handleListValueChange(idx, e.target.value)}
                  onBlur={() => {
                    if (listValues[idx].trim() === '' || listValues[idx] === '-') {
                      const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                      const newListValues = [...listValues];
                      newListValues[idx] = String(defaultValue);
                      setListValues(newListValues);

                      const newFilterValues = [...nonNullValues];
                      newFilterValues[idx] = defaultValue;
                      onChange({
                        ...filter,
                        value: newFilterValues,
                      });
                    }
                  }}
                />
                {/* Only show the remove button if there are multiple values. */}
                {nonNullValues.length > 1 && (
                  <IconButton variant="soft" size="1" onClick={(e) => removeValueForListBasedOp(idx, e)}>
                    <Cross2Icon />
                  </IconButton>
                )}
              </Flex>
            ))}

            {/* Always show add button for list operators, even when no values */}
            <AddValueButton minWidth="176px" onClick={addValueForListBasedOp} />
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <Flex gap="2" wrap="wrap">
      <Select.Root value={operator === 'none' ? undefined : operator} onValueChange={handleOperatorChange}>
        <Select.Trigger style={{ width: 160 }} placeholder="Add a condition…" />
        <Select.Content>
          <Select.Item value="none">No condition</Select.Item>
          <Select.Item value="in-list">Is one of</Select.Item>
          <Select.Item value="not-in-list">is not one of</Select.Item>
          <Select.Item value="gte">&#x2265;</Select.Item>
          <Select.Item value="lte">&#x2264;</Select.Item>
          <Select.Item value="between">Between</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}
    </Flex>
  );
}
