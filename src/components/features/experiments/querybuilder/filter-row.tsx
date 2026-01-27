'use client';

import { useState } from 'react';
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
  isNewRow: boolean;
  onSelect: (selectedOption: FilterRowOption) => void;
  onUpdate: (filterRowChange: FilterInput) => void;
  onRemove: () => void;
}

export function FilterRow({ filter, availableOptions, isNewRow, onSelect, onUpdate, onRemove }: FilterRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find exact match for rendering the data type badge
  const exactMatchField = availableOptions.find((f) => f.field_name === filter.field_name);

  const handleInputChange = (value: string, filteredOptions: FilterRowOption[]) => {
    if (value !== filter.field_name) {
      // Value changed - reset the filter to avoid stale state
      onUpdate({
        field_name: value,
        relation: 'includes',
        value: [],
      });

      // Auto-close if there's an exact match and it's the only filtered option
      const hasExactMatch = filteredOptions.some((opt) => opt.field_name === value);
      if (hasExactMatch && filteredOptions.length === 1) {
        setIsOpen(false);
      }
    }
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
          inputValue={filter.field_name}
          onChange={handleInputChange}
          open={isOpen}
          onOpenChange={setIsOpen}
          options={availableOptions}
          onSelect={onSelect}
          getSearchTextFromOption={(option) => option.field_name}
          autoFocus={isNewRow}
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
        ) : filter.field_name === '' ? (
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
