import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { XSpinner } from '@/components/ui/x-spinner';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { DataType, InspectDatasourceTableResponse } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { isEligibleForUseAsMetric } from '@/services/genapi-helpers';
import { useMemo } from 'react';

interface ComboboxRowProps {
  data_type: DataType;
  field_name: string;
}

const ComboboxRow = ({ field_name, data_type }: ComboboxRowProps) => (
  <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
    <Text size="2">{field_name}</Text>
    <DataTypeBadge type={data_type} />
  </Flex>
);

interface SelectTargetFieldProps {
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
  excludeFieldName?: string; // to prevent the target from being the same as the primary key
}

export const SelectTargetField = ({
  tableData,
  isLoading,
  inputValue,
  onChange,
  disabled,
  excludeFieldName,
}: SelectTargetFieldProps) => {
  const orderedFields = useMemo(() => {
    const fields = tableData?.fields ?? [];
    // Only boolean/numeric columns can back a bandit outcome (and the chosen type locks binary vs
    // real-valued downstream), so don't offer columns we'd reject at create time.
    return fields
      .filter((field) => field.field_name !== excludeFieldName && isEligibleForUseAsMetric(field.data_type))
      .toSorted((a, b) => a.field_name.localeCompare(b.field_name));
  }, [excludeFieldName, tableData]);
  const exactMatchField = tableData?.fields.find((v) => v.field_name === inputValue);
  const showSpinner = isLoading && !disabled;

  return (
    <Flex direction="column" gap={'3'}>
      <Flex align="center" gap="1">
        <Text as="label" size="2" weight="bold">
          Target column
        </Text>
        <Tooltip
          content={
            'The data-warehouse column read as each participant outcome for this bandit. Its type ' +
            'sets what a valid outcome looks like — a boolean column expects 0/1, a numeric column ' +
            'expects a number. Validity is enforced when the experiment is created.'
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
