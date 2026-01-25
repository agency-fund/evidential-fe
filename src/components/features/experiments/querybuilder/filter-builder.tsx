'use client';

import { Button, Flex, Separator } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { FilterRow } from '@/components/features/experiments/querybuilder/filter-row';
import React, { useState, useEffect } from 'react';
import { getDefaultFilterForType } from './utils';

// Placeholder filter for newly added rows before a field is selected
const EMPTY_FILTER: FilterInput = {
  field_name: '',
  relation: 'includes',
  value: [],
};

interface FilterWithId {
  id: string;
  filter: FilterInput;
}

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
  // Internal state tracking filters with stable IDs
  const [filtersWithIds, setFiltersWithIds] = useState<FilterWithId[]>(() => {
    // Initialize by generating IDs for each incoming filter
    return filters.map((filter) => ({
      id: crypto.randomUUID(),
      filter,
    }));
  });

  // Sync with external filters prop changes
  // If the length changes, treat it as a reset (parent modified state externally)
  useEffect(() => {
    if (filters.length !== filtersWithIds.length) {
      // Reset: generate new IDs for all filters
      setFiltersWithIds(
        filters.map((filter) => ({
          id: crypto.randomUUID(),
          filter,
        })),
      );
    } else {
      // Update filters while preserving IDs (matching by index)
      setFiltersWithIds((prev) =>
        prev.map((item, index) => ({
          id: item.id,
          filter: filters[index]!,
        })),
      );
    }
  }, [filters, filtersWithIds.length]);

  const addFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableFields.length === 0) return;

    const newFilterWithId: FilterWithId = {
      id: crypto.randomUUID(),
      filter: { ...EMPTY_FILTER },
    };

    setFiltersWithIds((prev) => [...prev, newFilterWithId]);
    // Strip IDs before passing to parent
    onChange([...filters, newFilterWithId.filter]);
  };

  const updateFilter = (id: string, filterRowChange: FilterInput) => {
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

    // Sanitize the filter to ensure no NaN values
    const sanitizedFilter = sanitizeFilter(filterRowChange);

    // Update internal state and compute updated filters for parent
    setFiltersWithIds((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, filter: sanitizedFilter } : item));
      // Strip IDs before passing to parent
      onChange(updated.map((item) => item.filter));
      return updated;
    });
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

  const removeFilter = (id: string) => {
    setFiltersWithIds((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      // Strip IDs before passing to parent
      onChange(updated.map((item) => item.filter));
      return updated;
    });
  };

  return (
    <Flex direction="column" gap="3" overflow="auto">
      {filtersWithIds.map(({ id, filter }) => (
        <React.Fragment key={id}>
          <FilterRow
            filter={filter}
            availableOptions={availableFields}
            onSelect={(selectedOption) => {
              // Reset the filter with appropriate defaults for the new field type
              const defaultFilter = getDefaultFilterForType(selectedOption.field_name, selectedOption.data_type);
              updateFilter(id, defaultFilter);
            }}
            onUpdate={(updatedFilter) => updateFilter(id, updatedFilter)}
            onRemove={() => removeFilter(id)}
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
