'use client';

import { Flex, Grid, IconButton, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { TypeSpecificFilterInput } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { Combobox } from '@/components/ui/combobox';

const findExactMatch = (searchText: string, availableOptions: Array<FilterRowOption>) => {
  return availableOptions.find((f) => f.field_name === searchText);
};

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
  const exactMatchField = findExactMatch(filter.field_name, availableOptions);

  const handleComboboxChange = (value: string) => {
    if (value !== filter.field_name) {
      onUpdate({
        field_name: value,
        relation: 'includes',
        value: [],
      });
    }
  };

  const handleSelect = (selectedOption: FilterRowOption) => {
    if (selectedOption.field_name !== filter.field_name) {
      onSelect(selectedOption);
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
          value={filter.field_name}
          onChange={handleComboboxChange}
          options={availableOptions}
          onSelect={handleSelect}
          findExactMatch={findExactMatch}
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
