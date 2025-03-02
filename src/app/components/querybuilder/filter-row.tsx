'use client';

import { Flex, IconButton, Select, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { AudienceSpecFilterInput, DataType } from '../../../api/methods.schemas';
import { TypeSpecificFilterInput } from './type-specific-filter-input';
import { getDefaultFilterForType } from './utils';

export interface FilterRowProps {
  filter: AudienceSpecFilterInput;
  availableFields: Array<{
    field_name: string;
    data_type: DataType;
    description: string;
  }>;
  onChange: (filter: AudienceSpecFilterInput) => void;
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
    if (newField.data_type === 'integer' || newField.data_type === 'bigint' || 
        newField.data_type === 'double precision' || newField.data_type === 'numeric') {
      
      // Make sure the value is a number, not a string
      const numericValues = defaultFilter.value.map(val => {
        if (val === null) return null;
        return typeof val === 'number' ? val : 0;
      });
      
      defaultFilter.value = numericValues;
    }
    
    onChange(defaultFilter);
  };

  return (
    <Flex gap="2" align="center">
      <Select.Root value={filter.field_name} onValueChange={handleFieldChange}>
        <Select.Trigger />
        <Select.Content>
          {availableFields.map((field) => (
            <Select.Item key={field.field_name} value={field.field_name}>
              <Text>{field.field_name}</Text>
              <Text size="1" color="gray">
                ({field.description})
              </Text>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      {dataType && <TypeSpecificFilterInput dataType={dataType} filter={filter} onChange={onChange} />}

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
    </Flex>
  );
}
