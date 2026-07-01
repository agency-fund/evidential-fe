import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { XSpinner } from '@/components/ui/x-spinner';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { DataType, InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { useMemo } from 'react';

type TableField = InspectDatasourceTableResponse['fields'][number];

const ComboboxRow = ({ field_name, data_type }: { field_name: string; data_type: DataType }) => (
  <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
    <Text size="2">{field_name}</Text>
    <DataTypeBadge type={data_type} />
  </Flex>
);

interface SelectFieldProps {
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
  excludeFieldName?: string;
  /** Label shown above the combobox. */
  label: string;
  /** Tooltip explaining what the field is for. */
  tooltip: string;
  /** Optional eligibility filter applied on top of the exclude-by-name filter. */
  isEligible?: (field: TableField) => boolean;
}

/** Combobox for picking a single table column by name, with a label, tooltip, and data-type badges. */
export const SelectField = ({
  tableData,
  isLoading,
  inputValue,
  onChange,
  disabled,
  excludeFieldName,
  label,
  tooltip,
  isEligible,
}: SelectFieldProps) => {
  const orderedFields = useMemo(() => {
    const fields = tableData?.fields ?? [];
    return fields
      .filter((field) => field.field_name !== excludeFieldName && (isEligible?.(field) ?? true))
      .toSorted((a, b) => a.field_name.localeCompare(b.field_name));
  }, [excludeFieldName, isEligible, tableData]);
  const exactMatchField = tableData?.fields.find((v) => v.field_name === inputValue);
  const showSpinner = isLoading && !disabled;

  return (
    <Flex direction="column" gap={'3'}>
      <Flex align="center" gap="1">
        <Text as="label" size="2" weight="bold">
          {label}
        </Text>
        <Tooltip content={tooltip}>
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
