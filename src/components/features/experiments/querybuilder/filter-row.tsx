'use client';

import { Flex, Grid, IconButton, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { TypeSpecificFilterInput } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { Combobox } from '@/components/ui/combobox';

const findExactMatchOption = (searchText: string, availableOptions: Array<FilterRowOption>) => {
  return availableOptions.find((f) => f.field_name === searchText);
};

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
  // If there's an exact match for the current filter, store it here so we can reference the data type.
  const exactMatchField = findExactMatchOption(filter.field_name, availableOptions);

  // Handler for when value changed and now we don't have an exact match: reset to an empty filter
  // with the current search string to prevent stale filter data from being used.
  const handleNoMatch = (searchText: string) => {
    onUpdate({
      field_name: searchText,
      relation: 'includes',
      value: [],
    });
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
          options={availableOptions}
          onSelect={onSelect}
          onNoMatch={handleNoMatch}
          findExactMatch={findExactMatchOption}
          getSearchTextFromOption={(opt) => opt.field_name}
          placeholder="Search fields..."
          noMatchText="No matching fields"
          rightSlot={(match) => (match ? <DataTypeBadge type={match.data_type} /> : null)}
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
