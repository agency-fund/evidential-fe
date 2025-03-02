'use client';
import { Badge, Button, Card, Flex, Heading, HoverCard, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { LightningBoltIcon, PlusIcon } from '@radix-ui/react-icons';
import { useCreateExperimentWithAssignment, useInspectParticipantTypes } from '@/api/admin';
import { ArrayElement, isHttpOk, ValueOf } from '@/services/typehelper';
import {
  AudienceSpecFilterInput,
  FilterValueTypes,
  GetFiltersResponseElement,
  GetMetricsResponseElement,
} from '@/api/methods.schemas';
import { PowerCheckSection } from '@/app/experiments/create/power-check-section';
import { convertFormDataToCreateExperimentRequest } from '@/app/experiments/create/helpers';
import { FilterField } from '@/app/experiments/create/filter-field';

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
  const { trigger: triggerCreateAssignment, isMutating } = useCreateExperimentWithAssignment(formData.datasourceId!, {
    chosen_n: formData.chosenN!,
  });

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
    field: keyof AudienceSpecFilterInput,
    value: ValueOf<AudienceSpecFilterInput>,
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
    newFilters[filterIndex].value = [...newFilters[filterIndex].value, ''] as FilterValueTypes;
    onFormDataChange({ ...formData, filters: newFilters });
  };

  const removeFilterValue = (filterIndex: number, valueIndex: number) => {
    const newFilters = [...formData.filters];
    newFilters[filterIndex].value = newFilters[filterIndex].value.filter(
      (_, i) => i !== valueIndex,
    ) as FilterValueTypes;
    onFormDataChange({ ...formData, filters: newFilters });
  };

  const updateFilterValue = (filterIndex: number, valueIndex: number, value: ArrayElement<FilterValueTypes>) => {
    const newFilters = [...formData.filters];
    newFilters[filterIndex].value[valueIndex] = value;
    onFormDataChange({ ...formData, filters: newFilters });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const request = convertFormDataToCreateExperimentRequest(formData);
    const response = await triggerCreateAssignment(request);
    if (isHttpOk(response)) {
      onFormDataChange({
        ...formData,
        experimentId: response.data.design_spec.experiment_id!,
        createExperimentResponse: response.data,
      });
      onNext();
    } else {
      throw new Error('failed to create experiment');
    }
  };

  const isNextButtonDisabled = formData.powerCheckResponse === undefined || isMutating;

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
                <Flex>
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
                </Flex>
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
                <Flex gap="2" wrap="wrap">
                  {metricFields
                    .filter((m) => m.field_name !== formData.primaryMetric)
                    .map((metric) => {
                      const isSelected = formData.secondaryMetrics.includes(metric.field_name);
                      const badge = (
                        <Badge
                          size={'3'}
                          variant={isSelected ? 'solid' : 'outline'}
                          color={isSelected ? 'blue' : 'gray'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const newSecondaryMetrics = isSelected
                              ? formData.secondaryMetrics.filter((m) => m !== metric.field_name)
                              : [...formData.secondaryMetrics, metric.field_name];
                            onFormDataChange({
                              ...formData,
                              secondaryMetrics: newSecondaryMetrics,
                            });
                          }}
                        >
                          {metric.field_name}
                        </Badge>
                      );
                      if (metric.description) {
                        return (
                          <HoverCard.Root key={metric.field_name}>
                            <HoverCard.Trigger>{badge}</HoverCard.Trigger>
                            <HoverCard.Content maxWidth="300px">
                              <Flex gap="4">{metric.description}</Flex>
                            </HoverCard.Content>
                          </HoverCard.Root>
                        );
                      } else {
                        return <Text key={metric.field_name}>{badge}</Text>;
                      }
                    })}
                </Flex>
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
                <FilterField
                  filter={filter}
                  index={index}
                  filterFieldsLoading={loadingParticipantTypes}
                  filterFields={filterFields}
                  updateFilter={(...args) => updateFilter(index, ...args)}
                  updateFilterValue={(...args) => updateFilterValue(index, ...args)}
                  removeFilter={() => removeFilter(index)}
                  removeFilterValue={(...args) => removeFilterValue(index, ...args)}
                  addFilterValue={() => addFilterValue(index)}
                />
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

        <Card>
          <Heading size="4" mb="4">
            <LightningBoltIcon /> Power Check
          </Heading>
          <PowerCheckSection formData={formData} onFormDataChange={onFormDataChange} />
        </Card>

        <Flex gap="3" justify="end">
          <Button type="button" variant="soft" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isNextButtonDisabled}>
            {isMutating && <Spinner size="1" />}
            Next
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
