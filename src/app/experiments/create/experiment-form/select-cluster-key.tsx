import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { XSpinner } from '@/components/ui/x-spinner';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { DataType, InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { useEffect, useMemo, useState } from 'react';

interface ComboboxRowProps {
  data_type: DataType;
  field_name: string;
}

const ComboboxRow = ({ field_name, data_type }: ComboboxRowProps) => {
  return (
    <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
      <Text size="2">{field_name}</Text>
      <DataTypeBadge type={data_type} />
    </Flex>
  );
};

interface SelectClusterKeyProps {
  tableData: InspectDatasourceTableResponse | undefined;
  value: string | undefined;
  isLoading: boolean;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  excludeFieldName?: string; // to prevent the cluster key from being the same as the primary key
}

export const SelectClusterKey = ({
  tableData,
  isLoading,
  value,
  onChange,
  disabled,
  excludeFieldName,
}: SelectClusterKeyProps) => {
  const [inputValue, setInputValue] = useState<string>(value ?? '');
  const orderedFields = useMemo(() => {
    const fields = tableData?.fields ?? [];
    return fields
      .filter((field) => field.field_name !== excludeFieldName)
      .toSorted((a, b) => a.field_name.localeCompare(b.field_name));
  }, [excludeFieldName, tableData]);
  const exactMatchField = tableData?.fields.find((v) => v.field_name === inputValue);
  const showSpinner = isLoading && !disabled;

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  return (
    <Flex direction="column" gap={'3'}>
      <Flex align="center" gap="1">
        <Text as="label" size="2" weight="bold">
          Cluster key (optional)
        </Text>
        <Tooltip
          content={
            'If your treatment is naturally delivered at a group level (such as schools, clinics, ' +
            'or districts), but you will track metrics at the participant level, set this to ' +
            'randomly assign whole groups of participants together to your arms. ' +
            'Select the field that identifies each group.'
          }
        >
          <InfoCircledIcon />
        </Tooltip>
      </Flex>
      {showSpinner ? (
        <XSpinner message="Loading fields..." />
      ) : (
        <Combobox
          value={inputValue}
          onChange={(value, key) => {
            setInputValue(value);
            onChange(key);
          }}
          options={orderedFields}
          rightSlot={exactMatchField && <DataTypeBadge type={exactMatchField.data_type} />}
          dropdownRow={({ option }) => <ComboboxRow data_type={option.data_type} field_name={option.field_name} />}
          getDisplayTextForOption={(v) => v.field_name}
          getKeyForOption={(v) => v.field_name}
          disabled={disabled}
        />
      )}
    </Flex>
  );
};
