'use client';

import { Button, Flex, Separator } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { FilterRow, FilterRowChange } from '@/components/features/experiments/querybuilder/filter-row';
import React, { useState } from 'react';

// Placeholder filter for newly added rows before a field is selected
const EMPTY_FILTER: FilterInput = {
  field_name: '',
  relation: 'includes',
  value: [],
};

export interface FilterBuilderProps {
  availableFields: Array<{
    field_name: string;
    data_type: DataType;
    description: string;
  }>;
  filters: FilterInput[];
  onChange: (filters: FilterInput[]) => void;
}

export function FilterBuilder({ availableFields, filters, onChange }: FilterBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingCursorPosition, setEditingCursorPosition] = useState<number | undefined>(undefined);

  const addFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableFields.length === 0) return;

    onChange([...filters, { ...EMPTY_FILTER }]);
  };

  const updateFilter = (index: number, filterRowChange: FilterRowChange) => {
    // Get the field's data type
    const field = availableFields.find((f) => f.field_name === filterRowChange.field_name);

    // Ensure numeric fields have numeric values
    if (
      field &&
      (field.data_type === 'integer' ||
        field.data_type === 'bigint' ||
        field.data_type === 'double precision' ||
        field.data_type === 'numeric')
    ) {
      // Convert any string values to numbers and handle NaN
      const numericValues = filterRowChange.value.map((val) => {
        if (val === null) return null;

        // If it's already a number and not NaN, keep it
        if (typeof val === 'number' && !isNaN(val)) return val;

        // Otherwise convert to number or use 0 as fallback
        const num =
          typeof val === 'string'
            ? field.data_type === 'integer' || field.data_type === 'bigint'
              ? parseInt(val, 10)
              : parseFloat(val)
            : 0;

        return isNaN(num) ? 0 : num;
      });

      filterRowChange = { ...filterRowChange, value: numericValues };
    }

    // Cache state about the latest filter row being updated
    setEditingCursorPosition(filterRowChange.edit_position);
    setEditingIndex(filterRowChange.edit_position !== undefined ? index : -1);

    // Sanitize the filter to ensure no NaN values
    const sanitizedFilter = sanitizeFilter(filterRowChange);
    const newFilters = [...filters];
    newFilters[index] = sanitizedFilter;
    onChange(newFilters);
  };

  // Sanitize filter to ensure no NaN values are passed to the API
  const sanitizeFilter = (filter: FilterInput): FilterInput => {
    // For numeric fields, ensure no NaN values
    const field = availableFields.find((f) => f.field_name === filter.field_name);
    const isNumeric =
      field?.data_type === 'integer' ||
      field?.data_type === 'bigint' ||
      field?.data_type === 'double precision' ||
      field?.data_type === 'numeric';

    if (isNumeric) {
      const sanitizedValues = filter.value.map((val) => (val === null ? null : isNaN(val as number) ? 0 : Number(val)));
      return { ...filter, value: sanitizedValues };
    }
    return filter;
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  return (
    <Flex direction="column" gap="3" overflow="auto">
      {filters.map((filter, index) => (
        <React.Fragment key={`${index}-${filter.field_name}`}>
          <FilterRow
            filter={filter}
            availableFields={availableFields}
            edit_position={editingIndex === index ? editingCursorPosition : undefined}
            onChange={(updatedFilter) => updateFilter(index, updatedFilter)}
            onRemove={() => removeFilter(index)}
          />
          <Separator orientation="horizontal" size="4" />
        </React.Fragment>
      ))}
      <Flex>
        <Button onClick={addFilter} variant="soft" size="2">
          <PlusIcon /> Add Filter
        </Button>
      </Flex>
    </Flex>
  );
}
