'use client';

import { Badge, Flex, Grid, IconButton, Select, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { TypeSpecificFilterInput } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { getDefaultFilterForType } from '@/components/features/experiments/querybuilder/utils';

export interface FilterRowProps {
  filter: FilterInput;
  availableFields: Array<{
    field_name: string;
    data_type: DataType;
    description: string;
  }>;
  onChange: (filter: FilterInput) => void;
  onRemove: () => void;
}

export function FilterRow({ filter, availableFields, onChange, onRemove }: FilterRowProps) {
  const selectedField = availableFields.find((f) => f.field_name === filter.field_name);
  const dataType = selectedField?.data_type;

  const handleFieldChange = (fieldName: string) => {
    const newField = availableFields.find((f) => f.field_name === fieldName);
    if (!newField) return;

    // Reset the filter with appropriate defaults for the new field type
    const defaultFilter = getDefaultFilterForType(fieldName, newField.data_type);

    // Ensure numeric fields have numeric values
    if (
      newField.data_type === 'integer' ||
      newField.data_type === 'bigint' ||
      newField.data_type === 'double precision' ||
      newField.data_type === 'numeric'
    ) {
      // Make sure the value is a number, not a string
      const numericValues = defaultFilter.value.map((val) => {
        if (val === null) return null;
        return typeof val === 'number' ? val : 0;
      });

      defaultFilter.value = numericValues;
    }

    onChange(defaultFilter);
  };

  return (
    <Grid columns={'2'} width={'auto'} gap={'3'}>
      <Flex gap={'2'} align={'center'}>
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

        <Select.Root value={filter.field_name} onValueChange={handleFieldChange}>
          <Select.Trigger />
          <Select.Content>
            {availableFields.map((field) => (
              <Select.Item key={field.field_name} value={field.field_name}>
                <Flex gap={'2'}>
                  <Text>{field.field_name}</Text>
                  <Badge size={'1'}>{field.data_type}</Badge>
                </Flex>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>

      <Flex gap={'2'} align={'center'}>
        {dataType ? <TypeSpecificFilterInput dataType={dataType} filter={filter} onChange={onChange} /> : <Flex></Flex>}
      </Flex>
    </Grid>
  );
}
