'use client';

import { Button, Checkbox, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { AudienceSpecFilter, DataType } from '@/api/methods.schemas';
import { createDefaultValueForOperator, operatorToRelation } from './utils';
import { useState } from 'react';

export interface DateFilterInputProps {
  filter: AudienceSpecFilter;
  onChange: (filter: AudienceSpecFilter) => void;
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
      return filter.value.length > 1 ? 'not-in-list' : 'not-equals';
    }
    // Default for includes relation
    return filter.value.length > 1 ? 'in-list' : 'on';
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
    const today = new Date().toISOString().split('T')[0];
    onChange({
      ...filter,
      value: [...filter.value.filter((v) => v !== null), today, ...(includesNull ? [null] : [])],
    });
  };

  const removeValue = (index: number) => {
    const newValues = filter.value.filter((_, i) => i !== index);
    if (newValues.length === 0 || (newValues.length === 1 && newValues[0] === null)) {
      // Don't allow removing all non-null values - add a default one
      const today = new Date().toISOString().split('T')[0];
      newValues.unshift(today);
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
      case 'on':
        return (
          <TextField.Root
            type="date"
            value={filter.value[0] as string}
            onChange={(e) => handleValueChange(0, e.target.value)}
          />
        );

      case 'after':
        return (
          <TextField.Root
            type="date"
            value={filter.value[0] as string}
            onChange={(e) => {
              onChange({ ...filter, value: [e.target.value, null] });
            }}
          />
        );

      case 'before':
        return (
          <TextField.Root
            type="date"
            value={filter.value[1] as string}
            onChange={(e) => {
              onChange({ ...filter, value: [null, e.target.value] });
            }}
          />
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
              <PlusIcon /> Add date
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
          <Select.Item value="on">On</Select.Item>
          <Select.Item value="before">Before</Select.Item>
          <Select.Item value="after">After</Select.Item>
          <Select.Item value="between">Between</Select.Item>
          <Select.Item value="in-list">In list</Select.Item>
          <Select.Item value="not-in-list">Not in list</Select.Item>
        </Select.Content>
      </Select.Root>

      {renderValueInputs()}

      {(operator === 'on' || operator === 'in-list') && (
        <Flex gap="1" align="center">
          <Checkbox checked={includesNull} onCheckedChange={(checked) => handleNullChange(!!checked)} />
          <Text size="2">Include NULL</Text>
        </Flex>
      )}
    </Flex>
  );
}
