'use client';

import { Button, Checkbox, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { AudienceSpecFilterInput, DataType } from '@/api/methods.schemas';
import { createDefaultValueForOperator, getOperatorFromFilter, operatorToRelation } from './utils';
import React from 'react';

export interface StringFilterInputProps {
  filter: AudienceSpecFilterInput;
  onChange: (filter: AudienceSpecFilterInput) => void;
  dataType: DataType;
}

export function StringFilterInput({ filter, onChange, dataType }: StringFilterInputProps) {
  const operator = getOperatorFromFilter(filter, dataType);
  const includesNull = filter.value.includes(null);

  const handleOperatorChange = (newOperator: string) => {
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
              <Select.Item value="in-list">Contains any of</Select.Item>
              <Select.Item value="not-in-list">Does not contain any of</Select.Item>
            </>
          )}
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
