import { Badge, Flex, Text } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { DataType, InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { useMemo, useState } from 'react';

interface RightBadgesProps {
  primary_key: boolean;
  recommended: boolean;
  type: DataType;
}

function RightBadges({ recommended, type, primary_key }: RightBadgesProps) {
  return (
    <Flex align={'end'} gap={'2'}>
      {primary_key && <Badge color={'blue'}>Primary Key</Badge>}
      {recommended && <Badge color={'green'}>Recommended</Badge>}
      <DataTypeBadge type={type} />
    </Flex>
  );
}

interface ComboboxRowProps {
  data_type: DataType;
  field_name: string;
  primary_key: boolean;
  recommended: boolean;
}

const ComboboxRow = ({ field_name, data_type, recommended, primary_key }: ComboboxRowProps) => {
  return (
    <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
      <Text size="2">{field_name}</Text>
      <RightBadges recommended={recommended} type={data_type} primary_key={primary_key} />
    </Flex>
  );
};

interface SelectPrimaryKeyProps {
  tableData: InspectDatasourceTableResponse | undefined;
  value: string | undefined;
  isLoading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SelectPrimaryKey = ({ tableData, isLoading, value, onChange, disabled }: SelectPrimaryKeyProps) => {
  const uniqueIdFields = useMemo(() => new Set(tableData?.detected_unique_id_fields ?? []), [tableData]);
  const orderedFields = useMemo(() => {
    const fields = tableData?.fields ?? [];
    const primaryKeys = fields
      .filter((field) => tableData?.primary_key_fields.includes(field.field_name))
      .sort((a, b) => a.field_name.localeCompare(b.field_name));
    const recommended = fields
      .filter(
        (field) => uniqueIdFields.has(field.field_name) && !tableData?.primary_key_fields.includes(field.field_name),
      )
      .sort((a, b) => a.field_name.localeCompare(b.field_name));
    const remaining = fields
      .filter((field) => !uniqueIdFields.has(field.field_name))
      .sort((a, b) => a.field_name.localeCompare(b.field_name));
    return [...primaryKeys, ...recommended, ...remaining];
  }, [tableData, uniqueIdFields]);
  const [inputValue, setInputValue] = useState<string>(value ?? tableData?.primary_key_fields[0] ?? '');
  const exactMatchField = tableData?.fields.find((v) => v.field_name === inputValue);
  const showSpinner = isLoading && !disabled;

  return (
    <Flex direction="column" gap={'3'}>
      <Text as="label" size="2" weight="bold">
        Unique User Key
      </Text>
      {showSpinner ? (
        <XSpinner message="Loading fields..." />
      ) : (
        <Combobox
          value={inputValue ?? ''}
          onChange={(value, key) => {
            setInputValue(value);
            if (key !== undefined) {
              onChange(key);
            } else {
              onChange('');
            }
          }}
          options={orderedFields}
          rightSlot={
            exactMatchField && (
              <RightBadges
                primary_key={tableData?.primary_key_fields.includes(exactMatchField.field_name) ?? false}
                recommended={uniqueIdFields.has(exactMatchField.field_name)}
                type={exactMatchField.data_type}
              />
            )
          }
          dropdownRow={({ option }) => (
            <ComboboxRow
              data_type={option.data_type}
              field_name={option.field_name}
              primary_key={tableData?.primary_key_fields.includes(option.field_name) ?? false}
              recommended={uniqueIdFields.has(option.field_name)}
            />
          )}
          getDisplayTextForOption={(v) => v.field_name}
          getKeyForOption={(v) => v.field_name}
          disabled={disabled}
        />
      )}
    </Flex>
  );
};
