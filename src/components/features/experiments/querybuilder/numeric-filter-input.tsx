'use client';

import { Box, Button, Checkbox, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput, FilterValueTypes } from '@/api/methods.schemas';
import {
  createDefaultValueForOperator,
  operatorToRelation,
  TypedFilter,
} from '@/components/features/experiments/querybuilder/utils';
import React, { useEffect, useState } from 'react';

export interface NumericFilterInputProps {
  filter: FilterInput & TypedFilter<number>;
  onChange: (filter: FilterInput) => void;
  dataType: DataType;
}

const BETWEEN_LIKE_OPS = new Set(['greater-than', 'less-than', 'between']);

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

  // String-based input states for each possible input field
  const [equalsValue, setEqualsValue] = useState(() => (filter.value[0] !== null ? String(filter.value[0]) : ''));
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
  const [listValues, setListValues] = useState<string[]>(() =>
    filter.value.filter((v) => v !== null).map((v) => String(v)),
  );

  // Update string states when filter changes externally
  useEffect(() => {
    if (operator === 'equals' || operator === 'not-equals') {
      setEqualsValue(filter.value[0] !== null ? String(filter.value[0]) : '');
    } else if (operator === 'greater-than') {
      setGreaterThanValue(filter.value[0] !== null ? String(filter.value[0]) : '');
    } else if (operator === 'less-than') {
      setLessThanValue(filter.value[1] !== null ? String(filter.value[1]) : '');
    } else if (operator === 'between') {
      setBetweenMinValue(filter.value[0] !== null ? String(filter.value[0]) : '');
      setBetweenMaxValue(filter.value[1] !== null ? String(filter.value[1]) : '');
    } else if (operator === 'in-list' || operator === 'not-in-list') {
      setListValues(filter.value.filter((v) => v !== null).map((v) => String(v)));
    }
  }, [filter.value, operator]);

  const includesNull = BETWEEN_LIKE_OPS.has(operator)
    ? filter.value.length === 3 && filter.value[2] === null // we use the 3rd value to indicate null
    : filter.value.includes(null);

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

  const updateFilterValue = (index: number, value: number | null) => {
    const newValues = [...filter.value];

    // If value is null and we're not already tracking nulls, use 0 as fallback
    if (value === null && !includesNull) {
      const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
      newValues[index] = defaultValue;
    } else {
      newValues[index] = value;
    }

    onChange({
      ...filter,
      value: newValues,
    });
  };

  const handleListValueChange = (index: number, inputValue: string) => {
    // Update the string state
    const newListValues = [...listValues];
    newListValues[index] = inputValue;
    setListValues(newListValues);

    // Parse and update the actual filter if valid
    const parsedValue = parseValue(inputValue);
    if (parsedValue !== null) {
      const nonNullValues = filter.value.filter((v) => v !== null);
      const newValues: typeof filter.value = [...nonNullValues];
      newValues[index] = parsedValue;

      // Preserve null if it was there
      if (includesNull) {
        newValues.push(null);
      }

      onChange({
        ...filter,
        value: newValues,
      });
    }
  };

  const addValue = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;

    // Update string state
    setListValues([...listValues, String(defaultValue)]);

    // Update filter
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), defaultValue, ...(includesNull ? [null] : [])],
    });
  };

  const removeValue = (index: number) => {
    // Update string state
    const newListValues = listValues.filter((_, i) => i !== index);
    setListValues(newListValues);

    // Update filter
    const newValues = filter.value.filter(
      (_, i) => i !== filter.value.findIndex((v, idx) => v !== null && idx === index),
    );

    if (newValues.length === 0) {
      // Don't allow removing all values - add a default one. A single null is allowed.
      const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
      newValues.unshift(defaultValue);
      setListValues([String(defaultValue)]);
    }

    onChange({
      ...filter,
      value: newValues,
    });
  };

  const handleNullChange = (includeNull: boolean) => {
    let newValues: FilterValueTypes;
    if (includeNull) {
      newValues = BETWEEN_LIKE_OPS.has(operator)
        ? [filter.value[0], filter.value[1], null]
        : [...filter.value.filter((v) => v !== null), null];
    } else {
      newValues = BETWEEN_LIKE_OPS.has(operator)
        ? [filter.value[0], filter.value[1]]
        : [...filter.value.filter((v) => v !== null)];
    }
    onChange({ ...filter, value: newValues });
  };

  const renderValueInputs = () => {
    switch (operator) {
      case 'greater-than':
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
                onChange({ ...filter, value: [parsedValue, null, ...(includesNull ? [null] : [])] });
              }
            }}
            onBlur={() => {
              // On blur, if the field is empty, set a default value
              if (greaterThanValue.trim() === '' || greaterThanValue === '-') {
                const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                setGreaterThanValue(String(defaultValue));
                onChange({ ...filter, value: [defaultValue, null] });
              }
            }}
          />
        );

      case 'less-than':
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
                onChange({ ...filter, value: [null, parsedValue, ...(includesNull ? [null] : [])] });
              }
            }}
            onBlur={() => {
              // On blur, if the field is empty, set a default value
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
                  onChange({ ...filter, value: [parsedValue, filter.value[1], ...(includesNull ? [null] : [])] });
                }
              }}
              onBlur={() => {
                // On blur, if the field is empty, set a default value
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
                  onChange({ ...filter, value: [filter.value[0], parsedValue, ...(includesNull ? [null] : [])] });
                }
              }}
              onBlur={() => {
                // On blur, if the field is empty, set a default value
                if (betweenMaxValue.trim() === '' || betweenMaxValue === '-') {
                  const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                  setBetweenMaxValue(String(defaultValue));
                  onChange({ ...filter, value: [filter.value[0], defaultValue] });
                }
              }}
            />
          </Flex>
        );

      case 'equals':
      case 'not-equals':
      case 'in-list':
      case 'not-in-list':
        const nonNullValues = filter.value.filter((v) => v !== null);

        return (
          <Flex direction="column" gap="1">
            {listValues.map((val, idx) => (
              <Flex key={idx} gap="1" align="start">
                <TextField.Root
                  type="text"
                  inputMode="decimal"
                  step={getStepAttribute()}
                  value={val}
                  style={{ width: '20ch' }}
                  onChange={(e) => handleListValueChange(idx, e.target.value)}
                  onBlur={() => {
                    // On blur, if the field is empty, set a default value
                    if (listValues[idx].trim() === '' || listValues[idx] === '-') {
                      const defaultValue = dataType === 'integer' || dataType === 'bigint' ? 0 : 0.0;
                      const newListValues = [...listValues];
                      newListValues[idx] = String(defaultValue);
                      setListValues(newListValues);

                      const newFilterValues = [...nonNullValues];
                      newFilterValues[idx] = defaultValue;
                      onChange({
                        ...filter,
                        value: [...newFilterValues, ...(includesNull ? [null] : [])],
                      });
                    }
                  }}
                />
                {/* Only show the remove button if there are multiple non-null values or if null
                    is included, since we allow a single null value. */}
                {nonNullValues.length > 1 || includesNull ? (
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
                ) : (
                  // empty spacer
                  <Box width="24px" height="24px" />
                )}
              </Flex>
            ))}

            {(operator === 'in-list' ||
              operator === 'not-in-list' ||
              ((operator === 'equals' || operator === 'not-equals') && nonNullValues.length === 0)) && (
              <Button variant="soft" size="1" onClick={addValue}>
                <PlusIcon /> Add value
              </Button>
            )}
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <Flex gap="2" align="start" wrap="wrap">
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger style={{ width: 128 }} />
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

      <Flex gap="1" align="center">
        <Checkbox checked={includesNull} onCheckedChange={(checked) => handleNullChange(!!checked)} />
        <Text size="2">Include NULL</Text>
      </Flex>
    </Flex>
  );
}
