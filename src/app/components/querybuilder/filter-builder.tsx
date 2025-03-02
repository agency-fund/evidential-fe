'use client';

import { Button, Flex } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { AudienceSpecFilterInput, DataType } from '@/api/methods.schemas';
import { FilterRow } from './filter-row';
import React from 'react';

export interface FilterBuilderProps {
  availableFields: Array<{
    field_name: string;
    data_type: DataType;
    description: string;
  }>;
  filters: AudienceSpecFilterInput[];
  onChange: (filters: AudienceSpecFilterInput[]) => void;
}

export function FilterBuilder({ availableFields, filters, onChange }: FilterBuilderProps) {
  const addFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableFields.length === 0) return;

    // Create a default filter using the first available field
    const defaultField = availableFields[0];
    const defaultFilter: AudienceSpecFilterInput = {
      field_name: defaultField.field_name,
      relation: 'includes',
      value: defaultField.data_type === 'boolean' ? [true] : [''],
    };

    onChange([...filters, defaultFilter]);
  };

  const updateFilter = (index: number, filter: AudienceSpecFilterInput) => {
    const newFilters = [...filters];
    newFilters[index] = filter;
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  return (
    <Flex direction="column" gap="2">
      {filters.map((filter, index) => (
        <FilterRow
          key={index}
          filter={filter}
          availableFields={availableFields}
          onChange={(updatedFilter) => updateFilter(index, updatedFilter)}
          onRemove={() => removeFilter(index)}
        />
      ))}
      <Button onClick={addFilter} variant="soft" size="2">
        <PlusIcon /> Add Filter
      </Button>
    </Flex>
  );
}
