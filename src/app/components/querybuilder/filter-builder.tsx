'use client';

import { Button, Flex } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { AudienceSpecFilter, DataType } from '@/api/methods.schemas';
import { FilterRow } from './filter-row';
import React from 'react';

export interface FilterBuilderProps {
  availableFields: Array<{
    field_name: string;
    data_type: DataType;
    description: string;
  }>;
  filters: AudienceSpecFilter[];
  onChange: (filters: AudienceSpecFilter[]) => void;
}

export function FilterBuilder({ availableFields, filters, onChange }: FilterBuilderProps) {
  const addFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableFields.length === 0) return;

    // Create a default filter using the first available field
    const defaultField = availableFields[0];
    let defaultValue;

    // Set appropriate default value based on data type
    switch (defaultField.data_type) {
      case 'boolean':
        defaultValue = [true];
        break;
      case 'integer':
      case 'bigint':
        defaultValue = [0]; // Numeric value, not string
        break;
      case 'double precision':
      case 'numeric':
        defaultValue = [0.0]; // Numeric value, not string
        break;
      case 'date':
      case 'timestamp without time zone':
        defaultValue = [new Date().toISOString().split('T')[0]];
        break;
      default:
        defaultValue = [''];
    }

    const defaultFilter: AudienceSpecFilter = {
      field_name: defaultField.field_name,
      relation: 'includes',
      value: defaultValue,
    };

    onChange([...filters, defaultFilter]);
  };

  const updateFilter = (index: number, filter: AudienceSpecFilter) => {
    // Get the field's data type
    const field = availableFields.find((f) => f.field_name === filter.field_name);

    // Ensure numeric fields have numeric values
    if (
      field &&
      (field.data_type === 'integer' ||
        field.data_type === 'bigint' ||
        field.data_type === 'double precision' ||
        field.data_type === 'numeric')
    ) {
      // Convert any string values to numbers and handle NaN
      const numericValues = filter.value.map((val) => {
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

      filter = { ...filter, value: numericValues };
    }

    // Sanitize the filter to ensure no NaN values
    const sanitizedFilter = sanitizeFilter(filter);
    const newFilters = [...filters];
    newFilters[index] = sanitizedFilter;
    onChange(newFilters);
  };

  // Sanitize filter to ensure no NaN values are passed to the API
  const sanitizeFilter = (filter: AudienceSpecFilter): AudienceSpecFilter => {
    // For numeric fields, ensure no NaN values
    const field = availableFields.find((f) => f.field_name === filter.field_name);
    const isNumeric =
      field?.data_type === 'integer' ||
      field?.data_type === 'bigint' ||
      field?.data_type === 'double precision' ||
      field?.data_type === 'numeric';

    if (isNumeric) {
      const sanitizedValues = filter.value.map((val) => (val === null ? null : isNaN(val as number) ? 0 : val));
      return { ...filter, value: sanitizedValues };
    }
    return filter;
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
      <Flex>
        <Button onClick={addFilter} variant="soft" size="2">
          <PlusIcon /> Add Filter
        </Button>
      </Flex>
    </Flex>
  );
}
