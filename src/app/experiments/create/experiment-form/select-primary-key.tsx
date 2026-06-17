import { Badge, Flex, Text, Tooltip } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { DataType, InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { useMemo } from 'react';
import { InfoCircledIcon } from '@radix-ui/react-icons';

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

const ComboboxRow = ({ field_name, data_type, recommended, primary_key }: ComboboxRowProps) => (
  <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
    <Text size="2">{field_name}</Text>
    <RightBadges recommended={recommended} type={data_type} primary_key={primary_key} />
  </Flex>
);

interface SelectPrimaryKeyProps {
  tableData: InspectDatasourceTableResponse | undefined;
  /** Input text owned by the parent component. */
  inputValue: string;
  isLoading: boolean;
  /**
   * `inputText` is always the new input from typing or selection. `selectedKey` is set only on an
   * exact unique field-name match (same as Combobox), otherwise undefined.
   */
  onChange: (inputText: string, selectedKey?: string) => void;
  disabled?: boolean;
}

export const SelectPrimaryKey = ({ tableData, isLoading, inputValue, onChange, disabled }: SelectPrimaryKeyProps) => {
  const primaryKeyFields = useMemo(() => new Set(tableData?.primary_key_fields ?? []), [tableData]);
  const uniqueIdFields = useMemo(() => new Set(tableData?.detected_unique_id_fields ?? []), [tableData]);
  const orderedFields = useMemo(() => {
    const fields = tableData?.fields ?? [];
    const primaryKeys = fields
      .filter((field) => primaryKeyFields.has(field.field_name))
      .sort((a, b) => a.field_name.localeCompare(b.field_name));
    const recommended = fields
      .filter((field) => uniqueIdFields.has(field.field_name) && !primaryKeyFields.has(field.field_name))
      .sort((a, b) => a.field_name.localeCompare(b.field_name));
    const remaining = fields
      .filter((field) => !uniqueIdFields.has(field.field_name) && !primaryKeyFields.has(field.field_name))
      .sort((a, b) => a.field_name.localeCompare(b.field_name));
    return [...primaryKeys, ...recommended, ...remaining];
  }, [tableData, uniqueIdFields, primaryKeyFields]);
  const exactMatchField = tableData?.fields.find((v) => v.field_name === inputValue);
  const showSpinner = isLoading && !disabled;

  return (
    <Flex direction="column" gap={'3'}>
      <Flex align="center" gap="1">
        <Text as="label" size="2" weight="bold">
          Unique ID
        </Text>
        <Tooltip content="Select the field that will uniquely identify each individual participant in the experiment.">
          <InfoCircledIcon />
        </Tooltip>
      </Flex>

      {showSpinner ? (
        <XSpinner message="Loading fields..." />
      ) : (
        <Combobox
          value={inputValue}
          onChange={onChange}
          options={orderedFields}
          rightSlot={
            exactMatchField ? (
              <RightBadges
                primary_key={primaryKeyFields.has(exactMatchField.field_name)}
                recommended={uniqueIdFields.has(exactMatchField.field_name)}
                type={exactMatchField.data_type}
              />
            ) : null
          }
          dropdownRow={({ option }) => (
            <ComboboxRow
              data_type={option.data_type}
              field_name={option.field_name}
              primary_key={primaryKeyFields.has(option.field_name)}
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
