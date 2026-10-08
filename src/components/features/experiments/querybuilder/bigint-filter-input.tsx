'use client';

import { Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataType, Filter } from '@/api/methods.schemas';
import {
  createDefaultValueForOperator,
  operatorToRelation,
  getDefaultFilterForType,
  selectOnFocusIf,
  TypedFilter,
  BETWEEN_BASED_OPS,
  BETWEEN_WITH_NULL_LENGTH,
} from '@/components/features/experiments/querybuilder/utils';
import React, { useState } from 'react';
import { z } from 'zod';
import { IncludeNullButton } from '@/components/features/experiments/querybuilder/include-null-button';
import { AddValueButton } from '@/components/features/experiments/querybuilder/add-value-button';

export interface BigIntFilterProps {
  filter: Filter & TypedFilter<string>;
  onChange: (filter: Filter) => void;
  dataType: DataType;
}

const BigIntStringSchema = z.string().refine((val: string) => {
  // decimals, sci-notation, random letters etc should fail.
  try {
    BigInt(val);
    return true;
  } catch {
    return false;
  }
}, 'BigInt format error');

export function BigIntFilter({ filter, onChange, dataType }: BigIntFilterProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
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

  // Tracks which inputs still hold a value filled in by the app rather than typed by the user, so
  // that focusing them selects the value and typing replaces it. A filter that matches the default
  // for its field is considered app-filled on mount.
  const [appFilled, setAppFilled] = useState(() => {
    const defaultFilter = getDefaultFilterForType(filter.field_name, dataType);
    const isDefault =
      filter.relation === defaultFilter.relation &&
      JSON.stringify(filter.value) === JSON.stringify(defaultFilter.value);
    return {
      gte: isDefault,
      lte: isDefault,
      betweenMin: isDefault,
      betweenMax: isDefault,
      list: filter.value.filter((v) => v !== null).map(() => isDefault),
    };
  });

  const includesNull = BETWEEN_BASED_OPS.has(operator)
    ? filter.value.length === BETWEEN_WITH_NULL_LENGTH && filter.value[2] === null
    : filter.value.includes(null);
  const includesNullValue = includesNull ? [null] : [];

  const handleOperatorChange = (newOperator: string) => {
    const relation = operatorToRelation(newOperator);
    const defaultValue = createDefaultValueForOperator(newOperator, dataType);

    setOperator(newOperator);
    setAppFilled({
      gte: true,
      lte: true,
      betweenMin: true,
      betweenMax: true,
      list: defaultValue.filter((value) => value !== null).map(() => true),
    });
    if (newOperator === 'gte') {
      setGreaterThanValue(defaultValue[0] !== null ? String(defaultValue[0]) : '');
    } else if (newOperator === 'lte') {
      setLessThanValue(defaultValue[1] !== null ? String(defaultValue[1]) : '');
    } else if (newOperator === 'between') {
      setBetweenMinValue(defaultValue[0] !== null ? String(defaultValue[0]) : '');
      setBetweenMaxValue(defaultValue[1] !== null ? String(defaultValue[1]) : '');
    } else {
      setListValues(defaultValue.filter((value) => value !== null).map(String));
    }
    onChange({
      ...filter,
      relation,
      value: defaultValue,
    });
  };

  const parseValue = (inputValue: string): string | null => {
    // Allow empty string to be treated as a special case
    if (inputValue.trim() === '' || inputValue === '-') {
      return null;
    }
    const parsedValue = BigIntStringSchema.safeParse(inputValue);
    return parsedValue.success ? inputValue : null;
  };

  const getStepAttribute = (): string => {
    return '1';
  };

  const handleListValueChange = (index: number, inputValue: string) => {
    // Update the string state
    const newListValues = [...listValues];
    newListValues[index] = inputValue;
    setListValues(newListValues);
    setAppFilled((prev) => ({ ...prev, list: prev.list.map((v, i) => (i === index ? false : v)) }));

    // Parse and update the actual filter if valid
    const parsedValue = parseValue(inputValue);
    if (parsedValue !== null) {
      const nonNullValues = filter.value.filter((v) => v !== null);
      const newNonNullValues = [...nonNullValues];
      newNonNullValues[index] = parsedValue;

      onChange({
        ...filter,
        value: [...newNonNullValues, ...includesNullValue],
      });
    }
  };

  const addValueForListBasedOp = (e: React.MouseEvent) => {
    e.preventDefault();
    const defaultValue = '0';

    // Update string state
    setListValues([...listValues, String(defaultValue)]);
    setAppFilled((prev) => ({ ...prev, list: [...prev.list, true] }));

    // Update filter
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), defaultValue, ...includesNullValue],
    });
  };

  // Keeps listValues in sync with filter.value. Assumes that there can only be at most one null
  // value in the filter.value list as managed by the 'Include NULL' button.
  const removeValueForListBasedOp = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    // Derive new display string state
    const newListValues = listValues.filter((_, i) => i !== index);

    // Derive new filter.value state
    // First remove any null value if it exists, in case it was added in some arbitrary position.
    const nonNullFilterValues = filter.value.filter((v) => v !== null);
    // Next remove the value at the given index from the non-null values, as it is safe to assume
    // the ordering now is aligned with the old listValues.
    const newNonNullFilterValues = nonNullFilterValues.filter((_, i) => i !== index);

    // Finally update display state and filter.value state
    setListValues(newListValues);
    setAppFilled((prev) => ({ ...prev, list: prev.list.filter((_, i) => i !== index) }));
    onChange({
      ...filter,
      value: [...newNonNullFilterValues, ...includesNullValue],
    });
  };

  // Between-based operators can't express "only NULL", so that case is an 'Is one of' list holding
  // only NULL.
  const switchToOnlyNull = () => {
    setOperator('in-list');
    setListValues([]);
    setAppFilled((prev) => ({ ...prev, list: [] }));
    onChange({ ...filter, relation: 'includes', value: [null] });
  };

  // Removing the bound(s) leaves only NULL if it was included. Otherwise the operator is kept and
  // the row becomes a draft without input(s) until a value is added back.
  const removeValueForBetweenBasedOp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (includesNull) {
      switchToOnlyNull();
      return;
    }
    onChange({ ...filter, value: [] });
  };

  // Brings back the input(s) of a draft between-based row, filled with the operator's defaults.
  const addValueForBetweenBasedOp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleOperatorChange(operator);
  };

  const handleNullChange = (includeNull: boolean) => {
    // A draft between-based row has no bounds to combine NULL with.
    if (includeNull && BETWEEN_BASED_OPS.has(operator) && filter.value.length === 0) {
      switchToOnlyNull();
      return;
    }
    let baseValues: (string | null)[];
    if (BETWEEN_BASED_OPS.has(operator)) {
      // Ensure we have valid values for between-based operators
      const val0 = filter.value[0] !== undefined ? filter.value[0] : null;
      const val1 = filter.value[1] !== undefined ? filter.value[1] : null;
      baseValues = [val0, val1];
    } else {
      baseValues = filter.value.filter((v) => v !== null);
    }
    const newValues = includeNull ? [...baseValues, null] : baseValues;
    onChange({ ...filter, value: newValues });
  };

  const renderValueInputs = () => {
    // A draft between-based row has no bounds: offer to add them back, or to keep only NULL.
    if (BETWEEN_BASED_OPS.has(operator) && filter.value.length === 0) {
      return (
        <Flex direction="column" gap="1">
          <IncludeNullButton checked={false} onChange={handleNullChange} minWidth="176px" />

          <AddValueButton minWidth="176px" onClick={addValueForBetweenBasedOp} />
        </Flex>
      );
    }

    switch (operator) {
      case 'gte':
        return (
          <Flex direction="column" gap="1">
            <Flex gap="1" align="center">
              <TextField.Root
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocusIf(appFilled.gte)}
                step={getStepAttribute()}
                value={greaterThanValue}
                style={{ width: '20ch' }}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setGreaterThanValue(inputValue);
                  setAppFilled((prev) => ({ ...prev, gte: false }));

                  const parsedValue = parseValue(inputValue);
                  if (parsedValue !== null) {
                    onChange({ ...filter, value: [parsedValue, null, ...includesNullValue] });
                  }
                }}
                onBlur={() => {
                  // On blur, if the field is empty, set a default value
                  if (greaterThanValue.trim() === '' || greaterThanValue === '-') {
                    const defaultValue = '0';
                    setGreaterThanValue(String(defaultValue));
                    setAppFilled((prev) => ({ ...prev, gte: true }));
                    onChange({ ...filter, value: [defaultValue, null, ...includesNullValue] });
                  }
                }}
              />
              <IconButton variant="soft" size="1" onClick={removeValueForBetweenBasedOp}>
                <Cross2Icon />
              </IconButton>
            </Flex>
            <IncludeNullButton checked={includesNull} onChange={handleNullChange} minWidth="176px" />
          </Flex>
        );

      case 'lte':
        return (
          <Flex direction="column" gap="1">
            <Flex gap="1" align="center">
              <TextField.Root
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocusIf(appFilled.lte)}
                step={getStepAttribute()}
                value={lessThanValue}
                style={{ width: '20ch' }}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setLessThanValue(inputValue);
                  setAppFilled((prev) => ({ ...prev, lte: false }));

                  const parsedValue = parseValue(inputValue);
                  if (parsedValue !== null) {
                    onChange({ ...filter, value: [null, parsedValue, ...includesNullValue] });
                  }
                }}
                onBlur={() => {
                  // On blur, if the field is empty, set a default value
                  if (lessThanValue.trim() === '' || lessThanValue === '-') {
                    const defaultValue = '0';
                    setLessThanValue(defaultValue);
                    setAppFilled((prev) => ({ ...prev, lte: true }));
                    onChange({ ...filter, value: [null, defaultValue, ...includesNullValue] });
                  }
                }}
              />
              <IconButton variant="soft" size="1" onClick={removeValueForBetweenBasedOp}>
                <Cross2Icon />
              </IconButton>
            </Flex>
            <IncludeNullButton checked={includesNull} onChange={handleNullChange} minWidth="176px" />
          </Flex>
        );

      case 'between':
        return (
          <Flex direction="column" gap="1">
            <Flex gap="2" align="center">
              <TextField.Root
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocusIf(appFilled.betweenMin)}
                step={getStepAttribute()}
                value={betweenMinValue}
                style={{ width: '20ch' }}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setBetweenMinValue(inputValue);
                  setAppFilled((prev) => ({ ...prev, betweenMin: false }));

                  const parsedValue = parseValue(inputValue);
                  if (parsedValue !== null) {
                    onChange({ ...filter, value: [parsedValue, filter.value[1], ...includesNullValue] });
                  }
                }}
                onBlur={() => {
                  // On blur, if the field is empty, set a default value
                  if (betweenMinValue.trim() === '' || betweenMinValue === '-') {
                    const defaultValue = '0';
                    setBetweenMinValue(defaultValue);
                    setAppFilled((prev) => ({ ...prev, betweenMin: true }));
                    onChange({ ...filter, value: [defaultValue, filter.value[1], ...includesNullValue] });
                  }
                }}
              />
              <Text>and</Text>
              <TextField.Root
                type="text"
                inputMode="decimal"
                onFocus={selectOnFocusIf(appFilled.betweenMax)}
                step={getStepAttribute()}
                value={betweenMaxValue}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setBetweenMaxValue(inputValue);
                  setAppFilled((prev) => ({ ...prev, betweenMax: false }));

                  const parsedValue = parseValue(inputValue);
                  if (parsedValue !== null) {
                    onChange({ ...filter, value: [filter.value[0], parsedValue, ...includesNullValue] });
                  }
                }}
                onBlur={() => {
                  // On blur, if the upper bound is empty, set its default value
                  if (betweenMaxValue.trim() === '' || betweenMaxValue === '-') {
                    const defaultValue = '10';
                    setBetweenMaxValue(defaultValue);
                    setAppFilled((prev) => ({ ...prev, betweenMax: true }));
                    onChange({ ...filter, value: [filter.value[0], defaultValue, ...includesNullValue] });
                  }
                }}
              />
              <IconButton variant="soft" size="1" onClick={removeValueForBetweenBasedOp}>
                <Cross2Icon />
              </IconButton>
            </Flex>
            <IncludeNullButton checked={includesNull} onChange={handleNullChange} minWidth="375px" />
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
                  onFocus={selectOnFocusIf(appFilled.list[idx] ?? false)}
                  step={getStepAttribute()}
                  value={val}
                  style={{ width: '20ch' }}
                  onChange={(e) => handleListValueChange(idx, e.target.value)}
                  onBlur={() => {
                    // On blur, if the field is empty, set a default value
                    if (listValues[idx].trim() === '' || listValues[idx] === '-') {
                      const defaultValue = '0';
                      const newListValues = [...listValues];
                      newListValues[idx] = defaultValue;
                      setListValues(newListValues);
                      setAppFilled((prev) => ({ ...prev, list: prev.list.map((v, i) => (i === idx ? true : v)) }));

                      const newFilterValues = [...nonNullValues];
                      newFilterValues[idx] = defaultValue;
                      onChange({
                        ...filter,
                        value: [...newFilterValues, ...includesNullValue],
                      });
                    }
                  }}
                />
                <IconButton variant="soft" size="1" onClick={(e) => removeValueForListBasedOp(idx, e)}>
                  <Cross2Icon />
                </IconButton>
              </Flex>
            ))}

            <IncludeNullButton
              checked={includesNull}
              onChange={handleNullChange}
              singularValue={listValues.length === 0}
              negated={operator === 'not-in-list'}
              minWidth="176px"
            />

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
      <Select.Root value={operator} onValueChange={handleOperatorChange}>
        <Select.Trigger style={{ width: 128 }} />
        <Select.Content>
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
