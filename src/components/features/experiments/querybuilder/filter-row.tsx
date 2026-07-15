'use client';

import { Flex, Grid, IconButton, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { DataType, Filter } from '@/api/methods.schemas';
import { TypeSpecificFilter } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { MissingValuesSelect } from '@/components/features/experiments/querybuilder/missing-values-select';
import {
  applyMissingValuesOption,
  getMissingValuesOption,
  MissingValuesOption,
} from '@/components/features/experiments/querybuilder/utils';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { Combobox } from '@/components/ui/combobox';

export interface FilterRowOption {
  field_name: string;
  data_type: DataType;
}

export interface FilterRowProps {
  filter: Filter;
  availableOptions: Array<FilterRowOption>;
  isNewRow: boolean;
  onSelect: (selectedOption: FilterRowOption) => void;
  onUpdate: (filterRowChange: Filter) => void;
  onRemove: () => void;
}

// We'll use this function for both option display and as as its unique key
const getSearchTextFromOption = (option: FilterRowOption) => option.field_name;

interface ComboboxRowProps {
  field_name: string;
  data_type: DataType;
}

const ComboboxRow = ({ field_name, data_type }: ComboboxRowProps) => {
  return (
    <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
      <Text size="2">{field_name}</Text>
      <DataTypeBadge type={data_type} />
    </Flex>
  );
};

export function FilterRow({ filter, availableOptions, isNewRow, onSelect, onUpdate, onRemove }: FilterRowProps) {
  const exactMatchField = availableOptions.find((f) => f.field_name === filter.field_name);
  const missingValuesOption = getMissingValuesOption(filter);

  const handleMissingValuesChange = (option: MissingValuesOption) => {
    // Leaving "Is missing" starts from a clean, no-condition predicate (its value was irrelevant),
    // so the row returns to the neutral "Add a condition" default.
    const baseFilter =
      missingValuesOption === 'is-missing' ? { ...filter, relation: 'includes' as const, value: [] } : filter;
    onUpdate(applyMissingValuesOption(baseFilter, option));
  };

  // The type-specific inputs manage only the value predicate; FilterRow re-applies the current
  // missing-values choice so the NULL stays consistent whenever the predicate changes.
  const handlePredicateChange = (predicateFilter: Filter) => {
    onUpdate(applyMissingValuesOption(predicateFilter, missingValuesOption));
  };

  const handleComboboxChange = (value: string) => {
    // User selected the current value.
    if (value === filter.field_name) return;
    // Regardless of a selection or typing, we can use the value to look for an exact match given our usage.
    const exactMatch = availableOptions.find((opt) => opt.field_name === value);
    if (exactMatch) {
      onSelect(exactMatch);
    } else {
      // User input a non-exact match
      onUpdate({
        field_name: value,
        relation: 'includes',
        value: [],
      });
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
          getDisplayTextForOption={getSearchTextFromOption}
          getKeyForOption={getSearchTextFromOption}
          autoFocus={isNewRow}
          placeholder="Search fields..."
          noMatchText="No matching fields"
          rightSlot={exactMatchField && <DataTypeBadge type={exactMatchField.data_type} />}
          dropdownRow={({ option }) => <ComboboxRow field_name={option.field_name} data_type={option.data_type} />}
        />
      </Flex>

      {/* Filter options for the selected filter field or help text */}
      <Flex direction={'column'} gap={'2'} align={'start'}>
        {exactMatchField ? (
          <>
            <MissingValuesSelect value={missingValuesOption} onChange={handleMissingValuesChange} />
            {missingValuesOption !== 'is-missing' ? (
              <TypeSpecificFilter
                key={exactMatchField.field_name}
                dataType={exactMatchField.data_type}
                filter={filter}
                onChange={handlePredicateChange}
              />
            ) : null}
          </>
        ) : filter.field_name === '' ? (
          <Text size="2" color="gray">
            ← Select a field or type the name
          </Text>
        ) : (
          <Text size="2" color="red">
            Invalid field
          </Text>
        )}
      </Flex>
    </Grid>
  );
}
