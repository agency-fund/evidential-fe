'use client';

import { Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { DataType, Filter } from '@/api/methods.schemas';
import {
  createDefaultValueForOperator,
  operatorToRelation,
  TypedFilter,
} from '@/components/features/experiments/querybuilder/utils';
import { useState } from 'react';
import { AddValueButton } from '@/components/features/experiments/querybuilder/add-value-button';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';

export interface DateFilterProps {
  filter: Filter & TypedFilter<string>;
  onChange: (filter: Filter) => void;
  dataType: DataType;
}

export function DateFilter({ filter, onChange, dataType }: DateFilterProps) {
  // Initialize operator state based on filter configuration
  const [operator, setOperator] = useState(() => {
    if (!filter.value.some((v) => v !== null)) return 'none';
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

  const addValueForListBasedOp = (e: React.MouseEvent) => {
    e.preventDefault();
    const today = formatDateUtcYYYYMMDD(new Date());
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), today],
    });
  };

  const removeValueForListBasedOp = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    let newNonNullFilterValues = filter.value.filter((v) => v !== null).filter((_, i) => i !== index);

    // Don't allow removing all values - add a default.
    if (newNonNullFilterValues.length === 0) {
      newNonNullFilterValues = [formatDateUtcYYYYMMDD(new Date())];
    }

    onChange({
      ...filter,
      value: newNonNullFilterValues,
    });
  };

  const renderValueInputs = () => {
    switch (operator) {
      case 'after':
        return (
          <Flex gap="1" align="center">
            <TextField.Root
              type="date"
              value={filter.value[0] as string}
              onChange={(e) => {
                onChange({ ...filter, value: [e.target.value, null] });
              }}
            />
            {dataType.includes('timestamp') && <Text size="2">00:00:00 UTC</Text>}
          </Flex>
        );

      case 'before':
        return (
          <Flex gap="1" align="center">
            <TextField.Root
              type="date"
              value={filter.value[1] as string}
              onChange={(e) => {
                onChange({ ...filter, value: [null, e.target.value] });
              }}
            />
            {dataType.includes('timestamp') && <Text size="2">00:00:00 UTC</Text>}
          </Flex>
        );

      case 'between':
        return (
          <Flex gap="2" align="center">
            <TextField.Root
              type="date"
              value={filter.value[0] as string}
              onChange={(e) => {
                onChange({ ...filter, value: [e.target.value, filter.value[1]] });
              }}
            />
            <Text>and</Text>
            <TextField.Root
              type="date"
              value={filter.value[1] as string}
              onChange={(e) => {
                onChange({ ...filter, value: [filter.value[0], e.target.value] });
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
                  type="date"
                  value={val as string}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
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
            <AddValueButton minWidth="145px" onClick={addValueForListBasedOp} />
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
          <Select.Item value="before">On or Before</Select.Item>
          <Select.Item value="after">On or After</Select.Item>
          <Select.Item value="between">Between</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}
    </Flex>
  );
}
