'use client';
import { Badge, Button, Card, Flex, Heading, HoverCard, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { LightningBoltIcon } from '@radix-ui/react-icons';
import { useCreateExperimentWithAssignment, useInspectParticipantTypes } from '@/api/admin';
import { AudienceSpecFilter, GetFiltersResponseElement, GetMetricsResponseElement } from '@/api/methods.schemas';
import { PowerCheckSection } from '@/app/experiments/create/power-check-section';
import { convertFormDataToCreateExperimentRequest } from '@/app/experiments/create/helpers';
import { FilterBuilder } from '@/app/components/querybuilder/filter-builder';

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
  const metricFields: GetMetricsResponseElement[] =
    participantTypesData !== undefined ? participantTypesData.metrics : [];

  const filterFields: GetFiltersResponseElement[] =
    participantTypesData !== undefined ? participantTypesData.filters : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const request = convertFormDataToCreateExperimentRequest(formData);
      const response = await triggerCreateAssignment(request);
      onFormDataChange({
        ...formData,
        experimentId: response.design_spec.experiment_id!,
        createExperimentResponse: response,
      });
      onNext();
    } catch (error) {
      // TODO
      console.error('Failed to create experiment:', error);
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
                    onValueChange={(value) => {
                      // Remove the from the secondary metrics if it was added initially, else the
                      // metric would show up in the power check 2x with an error.
                      const secondaryMetrics = formData.secondaryMetrics.filter((m) => m !== value);
                      onFormDataChange({ ...formData, primaryMetric: value, secondaryMetrics });
                    }}
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
            <FilterBuilder
              availableFields={filterFields}
              filters={formData.filters}
              onChange={(filters: AudienceSpecFilter[]) => onFormDataChange({ ...formData, filters })}
            />
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
