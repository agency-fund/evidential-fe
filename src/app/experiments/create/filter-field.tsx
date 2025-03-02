import { Button, Flex, SegmentedControl, Select, Spinner, Switch, Text, TextField } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import {
  AudienceSpecFilterInput,
  DataType,
  FilterValueTypes,
  GetFiltersResponseElement,
  Relation,
} from '@/api/methods.schemas';
import { ArrayElement, ValueOf } from '@/services/typehelper';

// TODO: booleans should only offer a tri-state (Null, True, False) for values
const TEXT_BOX_TYPES: string[] = [
  DataType.bigint,
  DataType.character_varying,
  DataType.double_precision,
  DataType.integer,
  DataType.numeric,
  DataType.timestamp_without_time_zone,
];

interface FilterFieldProps {
  filterFieldsLoading: boolean;
  index: number;
  filter: AudienceSpecFilterInput;
  filterFields: GetFiltersResponseElement[];
  updateFilter: (field: keyof AudienceSpecFilterInput, value: ValueOf<AudienceSpecFilterInput>) => void;
  updateFilterValue: (valueIndex: number, value: ArrayElement<FilterValueTypes>) => void;
  removeFilter: () => void;
  removeFilterValue: (valueIndex: number) => void;
  addFilterValue: () => void;
}
export function FilterField({
  filterFieldsLoading,
  index,
  filter,
  filterFields,
  updateFilter,
  updateFilterValue,
  removeFilter,
  removeFilterValue,
  addFilterValue,
}: FilterFieldProps) {
  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Text size="2" weight="bold">
          Filter {index + 1}
        </Text>
        <Button type="button" color="red" variant="soft" onClick={() => removeFilter()}>
          <TrashIcon />
        </Button>
      </Flex>

      <Flex gap="3">
        {filterFieldsLoading ? (
          <Flex align="center" gap="2" flexGrow="1">
            <Spinner size="1" />
            <Text size="2">Loading fields...</Text>
          </Flex>
        ) : filterFields.length === 0 ? (
          <Text>There are no filterable fields.</Text>
        ) : (
          <Select.Root value={filter.field_name} onValueChange={(value) => updateFilter('field_name', value)}>
            <Select.Trigger placeholder="Select a field" />
            <Select.Content>
              {filterFields.map((field) => (
                <Select.Item key={field.field_name} value={field.field_name}>
                  {field.field_name} ({field.data_type})
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        )}

        <SegmentedControl.Root
          value={filter.relation}
          size="1"
          onValueChange={(value) => updateFilter('relation', value as Relation)}
        >
          <SegmentedControl.Item value="includes">Includes</SegmentedControl.Item>
          <SegmentedControl.Item value="excludes">Excludes</SegmentedControl.Item>
          {TEXT_BOX_TYPES.includes(
            filterFields.find((mf) => mf.field_name === filter.field_name)?.data_type || 'character varying',
          ) ? (
            <SegmentedControl.Item value="between">Between</SegmentedControl.Item>
          ) : (
            <></>
          )}
        </SegmentedControl.Root>
      </Flex>

      <Flex gap="2" align="start">
        <Flex gap="2" wrap="wrap" flexGrow="1">
          {filter.value.map((value, valueIndex) => (
            <Flex key={valueIndex} gap="3">
              <Flex direction="row" gap="1">
                <Flex align="center" gap="1">
                  {TEXT_BOX_TYPES.includes(
                    filterFields.find((mf) => mf.field_name === filter.field_name)?.data_type || 'character varying',
                  ) ? (
                    <TextField.Root
                      disabled={value === null}
                      placeholder={
                        filter.relation === 'between' ? (valueIndex === 0 ? 'Lower bound' : 'Upper bound') : 'Value'
                      }
                      value={(value || '') as string} // TODO hack
                      onChange={(e) => updateFilterValue(valueIndex, e.target.value)}
                    />
                  ) : (
                    <>
                      <Switch
                        disabled={value === null}
                        size={'1'}
                        checked={value === true}
                        onCheckedChange={(checked) => updateFilterValue(valueIndex, checked)}
                      />
                      {value === true ? <Text size={'1'}>TRUE</Text> : <Text size={'1'}>FALSE</Text>}
                    </>
                  )}
                  <Switch
                    size="1"
                    checked={value === null}
                    onCheckedChange={(checked) => {
                      updateFilterValue(valueIndex, checked ? null : '');
                    }}
                  />
                  <Text size="1">NULL</Text>
                </Flex>

                {filter.relation !== 'between' && (
                  <Button
                    type="button"
                    color="red"
                    variant="soft"
                    disabled={filter.value.length === 1}
                    onClick={() => removeFilterValue(valueIndex)}
                  >
                    <TrashIcon />
                  </Button>
                )}
              </Flex>
              {(filter.relation === 'includes' || filter.relation === 'excludes') &&
                valueIndex === filter.value.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFilterValue}
                    disabled={filter.value.length === 0 || filter.value[filter.value.length - 1] === ''}
                  >
                    <PlusIcon /> Add Value
                  </Button>
                )}
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
