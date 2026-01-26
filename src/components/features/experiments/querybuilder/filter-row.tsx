'use client';

import { useState, useEffect } from 'react';
import { Flex, Grid, IconButton, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { TypeSpecificFilterInput } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { Combobox } from '@/components/ui/combobox';

export interface FilterRowOption {
  field_name: string;
  data_type: DataType;
}

export interface FilterRowProps {
  filter: FilterInput;
  availableOptions: Array<FilterRowOption>;
  onSelect: (selectedOption: FilterRowOption) => void;
  onUpdate: (filterRowChange: FilterInput) => void;
  onRemove: () => void;
}

export function FilterRow({ filter, availableOptions, onSelect, onUpdate, onRemove }: FilterRowProps) {
  // Local state for the search text, synced with filter.field_name
  const [searchText, setSearchText] = useState(filter.field_name);

  // Sync searchText when filter.field_name changes externally
  useEffect(() => {
    setSearchText(filter.field_name);
  }, [filter.field_name]);

  // If there's an exact match for the current filter, store it here for rendering.
  const exactMatchField = availableOptions.find((f) => f.field_name === searchText);

  // Handler for when value changed: update the filter with the current search text
  const handleSearchChange = (newValue: string) => {
    setSearchText(newValue);
    // If the new value doesn't match an option, reset to an empty filter
    const hasMatch = availableOptions.some((f) => f.field_name === newValue);
    if (!hasMatch) {
      onUpdate({
        field_name: newValue,
        relation: 'includes',
        value: [],
      });
    }
  };

  // Handler for when an option is selected
  const handleSelect = (option: FilterRowOption) => {
    setSearchText(option.field_name);
    onSelect(option);
  };

  return (
    <Grid columns={'2'} width={'auto'} gap={'3'}>
      <Flex gap={'2'} align={'start'}>
        <IconButton
          variant="soft"
          color="red"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
        >
          <TrashIcon />
        </IconButton>

        <Combobox<FilterRowOption>
          value={searchText}
          onChange={handleSearchChange}
          options={availableOptions}
          onSelect={handleSelect}
          getSearchTextFromOption={(opt) => opt.field_name}
          placeholder="Search fields..."
          noMatchText="No matching fields"
          rightSlot={exactMatchField && <DataTypeBadge type={exactMatchField.data_type} />}
          dropdownRow={({ option }) => (
            <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
              <Text size="2">{option.field_name}</Text>
              <DataTypeBadge type={option.data_type} />
            </Flex>
          )}
        />
      </Flex>

      {/* Filter options for the selected filter field or help text */}
      <Flex gap={'2'} align={'center'}>
        {exactMatchField ? (
          <TypeSpecificFilterInput dataType={exactMatchField.data_type} filter={filter} onChange={onUpdate} />
        ) : searchText === '' ? (
          <Text size="2" color="gray">
            ← Select a field
          </Text>
        ) : (
          <Text size="2" color="red">
            Invalid field — select from dropdown or type the name
          </Text>
        )}
      </Flex>
    </Grid>
  );
}
