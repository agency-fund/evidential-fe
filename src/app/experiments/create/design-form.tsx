'use client';
import {
  Badge,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  HoverCard,
  Spinner,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { InfoCircledIcon, LightningBoltIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { useCreateExperiment, useInspectParticipantTypes } from '@/api/admin';
import { AudienceSpecFilter, GetFiltersResponseElement, GetMetricsResponseElement } from '@/api/methods.schemas';
import { PowerCheckSection } from '@/app/experiments/create/power-check-section';
import { convertFormDataToCreateExperimentRequest } from '@/app/experiments/create/helpers';
import { FilterBuilder } from '@/app/components/querybuilder/filter-builder';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { PRODUCT_NAME } from '@/services/constants';

interface DesignFormProps {
  formData: ExperimentFormData;
  onFormDataChange: (data: ExperimentFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_MDE = '10';

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
  const {
    trigger: triggerCreateExperiment,
    isMutating,
    error: createExperimentError,
  } = useCreateExperiment(formData.datasourceId!, {
    chosen_n: formData.chosenN!,
  });

  // Extract metrics and filters from the API response
  const metricFields: GetMetricsResponseElement[] =
    participantTypesData !== undefined ? participantTypesData.metrics : [];

  const filterFields: GetFiltersResponseElement[] =
    participantTypesData !== undefined ? participantTypesData.filters : [];

  const handlePrimaryMetricSelect = (metricName: string) => {
    onFormDataChange({
      ...formData,
      primaryMetric: { metricName, mde: DEFAULT_MDE },
    });
  };

  const handlePrimaryMetricDeselect = () => {
    onFormDataChange({
      ...formData,
      primaryMetric: undefined,
    });
  };

  const handleSecondaryMetricAdd = (metricName: string) => {
    const newSecondaryMetrics = [...formData.secondaryMetrics, { metricName, mde: DEFAULT_MDE }];
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleSecondaryMetricRemove = (metricName: string) => {
    const newSecondaryMetrics = formData.secondaryMetrics.filter((m) => m.metricName !== metricName);
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleMdeChange = (type: 'primary' | 'secondary', metricName: string, mde: string) => {
    if (type === 'primary' && formData.primaryMetric) {
      onFormDataChange({
        ...formData,
        primaryMetric: { ...formData.primaryMetric, mde },
      });
    } else if (type === 'secondary') {
      const newSecondaryMetrics = formData.secondaryMetrics.map((m) =>
        m.metricName === metricName ? { ...m, mde } : m,
      );
      onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
    }
  };

  // Determine metrics available for primary selection (all metrics not in secondaryMetrics)
  const availablePrimaryMetricBadges = metricFields.filter(
    (m) => !formData.secondaryMetrics.some((sm) => sm.metricName === m.field_name),
  );

  // Determine metrics available for secondary selection
  const availableSecondaryMetricBadges = metricFields.filter(
    (m) =>
      m.field_name !== formData.primaryMetric?.metricName &&
      !formData.secondaryMetrics.some((sm) => sm.metricName === m.field_name),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const request = convertFormDataToCreateExperimentRequest(formData);
      const response = await triggerCreateExperiment(request);
      onFormDataChange({
        ...formData,
        experimentId: response.design_spec.experiment_id!,
        createExperimentResponse: response,
      });
      console.log('handleSubmit is calling onNext()');
      onNext();
    } catch (error) {
      // TODO
      console.error('Failed to create experiment:', error);
      throw new Error('failed to create experiment');
    }
  };

  const supportsPowerCheck = formData.experimentType === 'preassigned';
  const isNextButtonDisabled =
    !formData.primaryMetric?.metricName ||
    !formData.primaryMetric?.mde ||
    (supportsPowerCheck && (formData.powerCheckResponse === undefined || isMutating));

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Card>
          <Heading size="4" mb="4">
            Metrics
          </Heading>
          <Flex direction={'row'} justify={'start'} gap={'4'}>
            <Flex direction="column" gap="2" mt="3">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Metric</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Minimum Effect
                      <br />
                      (% change)
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell> </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <>
                    {(formData.primaryMetric || formData.secondaryMetrics.length > 0) && (
                      <>
                        {formData.primaryMetric && (
                          <Table.Row>
                            <Table.Cell>
                              {formData.primaryMetric.metricName} <Badge>Primary</Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <TextField.Root
                                type="number"
                                value={formData.primaryMetric.mde}
                                onChange={(e) =>
                                  handleMdeChange('primary', formData.primaryMetric!.metricName, e.target.value)
                                }
                                placeholder="MDE %"
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <Button
                                variant="soft"
                                color="red"
                                onClick={(event) => {
                                  event.preventDefault();
                                  handlePrimaryMetricDeselect();
                                }}
                              >
                                <TrashIcon />
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        )}
                        {formData.secondaryMetrics
                          .toSorted((a, b) => a.metricName.localeCompare(b.metricName))
                          .map((selectedMetric) => (
                            <Table.Row>
                              <Table.Cell>
                                <Text size="3">{selectedMetric.metricName}</Text>
                              </Table.Cell>
                              <Table.Cell>
                                <TextField.Root
                                  type="number"
                                  value={selectedMetric.mde}
                                  onChange={(e) =>
                                    handleMdeChange('secondary', selectedMetric.metricName, e.target.value)
                                  }
                                  placeholder="MDE %"
                                />
                              </Table.Cell>
                              <Table.Cell>
                                <Button
                                  variant="soft"
                                  color="red"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    handleSecondaryMetricRemove(selectedMetric.metricName);
                                  }}
                                >
                                  <TrashIcon />
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                      </>
                    )}
                  </>
                </Table.Body>
              </Table.Root>
            </Flex>

            <Flex direction="column" gap="3" overflowX={'auto'}>
              <Flex direction="column" gap="2">
                {loadingParticipantTypes ? (
                  <Flex align="center" gap="2">
                    <Spinner size="1" />
                    <Text size="2">Loading metrics...</Text>
                  </Flex>
                ) : !formData.primaryMetric ? (
                  <Flex gap="2" wrap="wrap">
                    <Text as={'label'} size={'2'} weight={'bold'}>
                      Select a primary metric:
                    </Text>
                    {availablePrimaryMetricBadges.map((metric) => (
                      <Badge
                        key={metric.field_name}
                        size={'3'}
                        variant={'soft'}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handlePrimaryMetricSelect(metric.field_name)}
                      >
                        <PlusIcon /> {metric.field_name}
                      </Badge>
                    ))}
                    {availablePrimaryMetricBadges.length === 0 && metricFields.length > 0 && (
                      <Text color="gray" size="2">
                        All available metrics are selected as secondary. Deselect one to make it primary.
                      </Text>
                    )}
                    {metricFields.length === 0 && (
                      <Text color="gray" size="2">
                        No metrics available for this participant type.
                      </Text>
                    )}
                  </Flex>
                ) : availableSecondaryMetricBadges.length > 0 && formData.primaryMetric ? (
                  <Flex direction="column" gap="2" mt="3">
                    <Text as="label" size="2" weight="bold">
                      Add optional secondary metrics:
                    </Text>
                    <Flex gap="2" wrap="wrap">
                      {availableSecondaryMetricBadges.map((metric) => {
                        const badge = (
                          <Badge
                            key={metric.field_name}
                            size={'3'}
                            variant={'soft'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSecondaryMetricAdd(metric.field_name)}
                          >
                            <PlusIcon /> {metric.field_name}
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
                  </Flex>
                ) : (
                  <></>
                )}
              </Flex>
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
                onChange={(e) => onFormDataChange({ ...formData, confidence: e.target.value })}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Power (%)
              </Text>
              <TextField.Root
                type="number"
                value={formData.power}
                onChange={(e) => onFormDataChange({ ...formData, power: e.target.value })}
              />
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Heading size="4" mb="4" color={supportsPowerCheck ? undefined : 'gray'}>
            <LightningBoltIcon /> Power Check
          </Heading>
          {supportsPowerCheck ? (
            <PowerCheckSection formData={formData} onFormDataChange={onFormDataChange} />
          ) : (
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                ️ Power calculations are not required to set up an online experiment, but if desired should be computed
                outside {PRODUCT_NAME}.
              </Callout.Text>
            </Callout.Root>
          )}
        </Card>

        {createExperimentError && (
          <GenericErrorCallout title="Failed to create experiment" error={createExperimentError} />
        )}

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
