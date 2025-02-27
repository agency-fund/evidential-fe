'use client';
import {
  Button,
  Card,
  Flex,
  Heading,
  SegmentedControl,
  Select,
  Spinner,
  Switch,
  Text,
  TextField,
} from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { useInspectParticipantTypes } from '@/api/admin';
import { isHttpOk } from '@/services/typehelper';
import {
  AudienceSpecFilter,
  AudienceSpecFilterValue,
  DataType,
  GetFiltersResponseElement,
  GetMetricsResponseElement,
  Relation,
} from '@/api/methods.schemas';

// TODO: booleans should only offer a tri-state (Null, True, False) for values
const TEXT_BOX_TYPES: string[] = [
  DataType.bigint,
  DataType.character_varying,
  DataType.double_precision,
  DataType.integer,
  DataType.numeric,
  DataType.timestamp_without_time_zone,
];

interface DesignFormProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DesignForm({ formData, onFormDataChange, onNext, onBack }: DesignFormProps) {
  const { data: participantTypesData, isLoading: loadingParticipantTypes } = useInspectParticipantTypes(
    formData.datasourceId || '',
    formData.participantType || '',
    {},
    {
      swr: {
        enabled: !!(formData.datasourceId && formData.participantType),
      },
    },
  );

  // Extract metrics and filters from the API response
  const metricFields: GetMetricsResponseElement[] = isHttpOk(participantTypesData)
    ? participantTypesData.data.metrics
    : [];

  const filterFields: GetFiltersResponseElement[] = isHttpOk(participantTypesData)
    ? participantTypesData.data.filters
    : [];
  const addFilter = () => {
    onFormDataChange({
      ...formData,
      filters: [
        ...formData.filters,
        {
          field_name: '',
          relation: 'includes',
          value: [''],
        },
      ],
    });
  };

  const removeFilter = (index: number) => {
    onFormDataChange({
      ...formData,
      filters: formData.filters.filter((_, i) => i !== index),
    });
  };

  const updateFilter = (
    index: number,
    field: keyof AudienceSpecFilter,
    value: Relation | AudienceSpecFilterValue | string,
  ) => {
    const newFilters = [...formData.filters];
    newFilters[index] = { ...newFilters[index], [field]: value };

    // Reset values when operator changes
    if (field === 'relation') {
      if (value === 'between') {
        newFilters[index].value = ['', ''];
      } else {
        newFilters[index].value = [''];
      }
    }

    onFormDataChange({ ...formData, filters: newFilters });
  };

  const addFilterValue = (filterIndex: number) => {
    const newFilters = [...formData.filters];
    newFilters[filterIndex].value = [...newFilters[filterIndex].value, ''] as AudienceSpecFilterValue;
    onFormDataChange({ ...formData, filters: newFilters });
  };

  const removeFilterValue = (filterIndex: number, valueIndex: number) => {
    const newFilters = [...formData.filters];
    newFilters[filterIndex].value = newFilters[filterIndex].value.filter(
      (_, i) => i !== valueIndex,
    ) as AudienceSpecFilterValue;
    onFormDataChange({ ...formData, filters: newFilters });
  };

  const updateFilterValue = (filterIndex: number, valueIndex: number, value: string | null | boolean) => {
    const newFilters = [...formData.filters];
    newFilters[filterIndex].value[valueIndex] = value;
    onFormDataChange({ ...formData, filters: newFilters });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Card>
          <Heading size="4" mb="4">
            Metrics
          </Heading>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Primary Metric
              </Text>
              {loadingParticipantTypes ? (
                <Flex align="center" gap="2">
                  <Spinner size="1" />
                  <Text size="2">Loading metrics...</Text>
                </Flex>
              ) : metricFields.length === 0 ? (
                <Text color="gray" size="2">
                  No metrics available for this participant type
                </Text>
              ) : (
                <Select.Root
                  value={formData.primaryMetric}
                  onValueChange={(value) => onFormDataChange({ ...formData, primaryMetric: value })}
                >
                  <Select.Trigger placeholder="Select a metric" />
                  <Select.Content>
                    {metricFields.map((metric) => (
                      <Select.Item key={metric.field_name} value={metric.field_name}>
                        {metric.field_name} ({metric.data_type})
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Secondary Metrics
              </Text>
              {loadingParticipantTypes ? (
                <Flex align="center" gap="2">
                  <Spinner size="1" />
                  <Text size="2">Loading metrics...</Text>
                </Flex>
              ) : metricFields.length === 0 ? (
                <Text color="gray" size="2">
                  No metrics available for this participant type
                </Text>
              ) : (
                <Select.Root
                  value={formData.secondaryMetrics[0] || ''}
                  onValueChange={(value) => {
                    onFormDataChange({
                      ...formData,
                      secondaryMetrics: value ? [value] : [],
                    });
                  }}
                >
                  <Select.Trigger placeholder="Select a metric" />
                  <Select.Content>
                    {metricFields
                      .filter((m) => m.field_name !== formData.primaryMetric)
                      .map((metric) => (
                        <Select.Item key={metric.field_name} value={metric.field_name}>
                          {metric.field_name} ({metric.data_type})
                        </Select.Item>
                      ))}
                  </Select.Content>
                </Select.Root>
              )}
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Heading size="4" mb="4">
            Filters
          </Heading>
          <Flex direction="column" gap="3">
            {formData.filters.map((filter, index) => (
              <Card key={index}>
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Text size="2" weight="bold">
                      Filter {index + 1}
                    </Text>
                    <Button type="button" color="red" variant="soft" onClick={() => removeFilter(index)}>
                      <TrashIcon />
                    </Button>
                  </Flex>

                  <Flex gap="3">
                    {loadingParticipantTypes ? (
                      <Flex align="center" gap="2" flexGrow="1">
                        <Spinner size="1" />
                        <Text size="2">Loading fields...</Text>
                      </Flex>
                    ) : filterFields.length === 0 ? (
                      <Text>There are no filterable fields.</Text>
                    ) : (
                      <Select.Root
                        value={filter.field_name}
                        onValueChange={(value) => updateFilter(index, 'field_name', value)}
                      >
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
                      onValueChange={(value) => updateFilter(index, 'relation', value as Relation)}
                    >
                      <SegmentedControl.Item value="includes">Includes</SegmentedControl.Item>
                      <SegmentedControl.Item value="excludes">Excludes</SegmentedControl.Item>
                      {TEXT_BOX_TYPES.includes(
                        filterFields.find((mf) => mf.field_name === filter.field_name)?.data_type ||
                          'character varying',
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
                                filterFields.find((mf) => mf.field_name === filter.field_name)?.data_type ||
                                  'character varying',
                              ) ? (
                                <TextField.Root
                                  disabled={value === null}
                                  placeholder={
                                    filter.relation === 'between'
                                      ? valueIndex === 0
                                        ? 'Lower bound'
                                        : 'Upper bound'
                                      : 'Value'
                                  }
                                  value={(value || '') as string} // TODO hack
                                  onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
                                />
                              ) : (
                                <>
                                  <Switch
                                    disabled={value === null}
                                    size={'1'}
                                    checked={value === true}
                                    onCheckedChange={(checked) => updateFilterValue(index, valueIndex, checked)}
                                  />
                                  {value === true ? <Text size={'1'}>TRUE</Text> : <Text size={'1'}>FALSE</Text>}
                                </>
                              )}
                              <Switch
                                size="1"
                                checked={value === null}
                                onCheckedChange={(checked) => {
                                  updateFilterValue(index, valueIndex, checked ? null : '');
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
                                onClick={() => removeFilterValue(index, valueIndex)}
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
                                onClick={() => addFilterValue(index)}
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
              </Card>
            ))}
            <Flex justify="end" mt="4">
              <Button type="button" onClick={addFilter}>
                <PlusIcon /> Add Filter
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Heading size="4" mb="4">
            Experiment Parameters
          </Heading>
          <Flex direction="row" gap="3">
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Confidence (%)
              </Text>
              <TextField.Root
                type="number"
                value={formData.confidence}
                onChange={(e) => onFormDataChange({ ...formData, confidence: Number(e.target.value) })}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Power (%)
              </Text>
              <TextField.Root
                type="number"
                value={formData.power}
                onChange={(e) => onFormDataChange({ ...formData, power: Number(e.target.value) })}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Effect % Change
              </Text>
              <TextField.Root
                type="number"
                value={formData.effectPctChange}
                onChange={(e) => onFormDataChange({ ...formData, effectPctChange: Number(e.target.value) })}
              />
            </Flex>
          </Flex>
        </Card>

        <Flex gap="3" justify="end">
          <Button type="button" variant="soft" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Next</Button>
        </Flex>
      </Flex>
    </form>
  );
}
