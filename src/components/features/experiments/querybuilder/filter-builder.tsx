'use client';

import { Button, Flex, Separator } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { FilterInput } from '@/api/methods.schemas';
import { FilterRow, FilterRowOption } from '@/components/features/experiments/querybuilder/filter-row';
import React, { useState } from 'react';
import { getDefaultFilterForType } from './utils';

// Sanitize filter to ensure no NaN values are passed to the API
const sanitizeFilter = (availableFields: FilterRowOption[], filter: FilterInput): FilterInput => {
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

// Placeholder filter for newly added rows before a field is selected
const EMPTY_FILTER: FilterInput = {
  field_name: '',
  relation: 'includes',
  value: [],
};

// Internal FilterBuilder state model for associating a stable id with a draft filter.
interface FilterWithId {
  id: string;
  filter: FilterInput;
}

/**
  @param availableFields Available fields can have a one to many relationship with the filters, i.e. a field can be used in multiple filters with different constraints.
  @param initialFilters Array of FilterInputs used only to seed the initial state. The component owns the draft state internally and will not sync with changes to this prop. To reset the component, change its key prop.
  @param onChange Callback to notify parent of changes to the filters.
  */
export interface FilterBuilderProps {
  availableFields: Array<FilterRowOption>;
  initialFilters: FilterInput[];
  onChange: (filters: FilterInput[]) => void;
}

export function FilterBuilder({ availableFields, initialFilters, onChange }: FilterBuilderProps) {
  // Internal state that associates initial filters prop as the starting point with stable IDs on
  // init. To reset our internal state, the parent component should change the builder's key prop.
  const [filtersWithIds, setFiltersWithIds] = useState<FilterWithId[]>(() => {
    // Initialize by generating IDs for each incoming filter
    return initialFilters.map((filter) => ({
      id: crypto.randomUUID(),
      filter,
    }));
  });

  const commitFilters = (filtersWithIds: FilterWithId[]) => {
    // Strip the IDs before passing to parent.
    onChange(filtersWithIds.map((item) => item.filter));
  };

  const addFilter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableFields.length === 0) return;

    const newFilterWithId: FilterWithId = {
      id: crypto.randomUUID(),
      filter: { ...EMPTY_FILTER },
    };

    const newFiltersWithIds = [...filtersWithIds, newFilterWithId];
    setFiltersWithIds(newFiltersWithIds);
    commitFilters(newFiltersWithIds);
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

    const sanitizedFilter = sanitizeFilter(availableFields, filterRowChange);
    const newFiltersWithIds = filtersWithIds.map((item) =>
      item.id === id ? { ...item, filter: sanitizedFilter } : item,
    );
    setFiltersWithIds(newFiltersWithIds);
    commitFilters(newFiltersWithIds);
  };

  const removeFilter = (id: string) => {
    const newFiltersWithIds = filtersWithIds.filter((item) => item.id !== id);
    setFiltersWithIds(newFiltersWithIds);
    commitFilters(newFiltersWithIds);
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
