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
  Text,
  TextField,
  Box,
} from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { InfoCircledIcon, LightningBoltIcon, TrashIcon } from '@radix-ui/react-icons';
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
      primaryMetric: { metricName, mde: '10' }, // Default MDE
      // Secondary metrics remain as is, user can add/remove them after primary is set
    });
  };

  const handlePrimaryMetricDeselect = () => {
    onFormDataChange({
      ...formData,
      primaryMetric: undefined,
      // secondaryMetrics: [], // DO NOT Clear secondary metrics
    });
  };

  const handleSecondaryMetricAdd = (metricName: string) => {
    const newSecondaryMetrics = [
      ...formData.secondaryMetrics,
      { metricName, mde: '10' }, // Default MDE
    ];
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleSecondaryMetricRemove = (metricName: string) => {
    const newSecondaryMetrics = formData.secondaryMetrics.filter(
      (m) => m.metricName !== metricName,
    );
    onFormDataChange({ ...formData, secondaryMetrics: newSecondaryMetrics });
  };

  const handleMdeChange = (
    type: 'primary' | 'secondary',
    metricName: string,
    mde: string,
  ) => {
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
    !formData.primaryMetric?.mde || // Ensure MDE is also set
    (supportsPowerCheck && (formData.powerCheckResponse === undefined || isMutating));

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Card>
          <Heading size="4" mb="4">
            Metrics
          </Heading>
          <Flex direction="column" gap="3" style={{ overflowX: 'auto' }}>
            {/* Primary Metric Section */}
            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Primary Metric
              </Text>
              {loadingParticipantTypes ? (
                <Flex align="center" gap="2">
                  <Spinner size="1" />
                  <Text size="2">Loading metrics...</Text>
                </Flex>
              ) : formData.primaryMetric?.metricName ? (
                // Display selected primary metric with MDE input and trash icon
                <>
                  {/* Header for MDE */}
                  <Flex align="center" mt="1" mb="1">
                    <Box style={{ minWidth: '250px', flexShrink: 0, marginRight: 'var(--space-3)', paddingLeft: 'var(--space-1)' }}>
                      <Text size="1" weight="bold">Metric Name</Text>
                    </Box>
                    <Box style={{ width: '150px', minWidth: '80px', flexShrink: 0, marginRight: 'var(--space-2)' }}>
                      <Text size="1" weight="bold">min effect (% change)</Text>
                    </Box>
                    <Box style={{ width: 'var(--radix-size-7)' }} /> {/* Spacer for Trash Icon Column */}
                  </Flex>
                  <Flex align="center"> {/* Removed gap */}
                    <Box style={{ minWidth: '250px', flexShrink: 0, marginRight: 'var(--space-3)', paddingLeft: 'var(--space-1)' }}>
                      <Text size="3">
                        {formData.primaryMetric.metricName}
                      </Text>
                    </Box>
                    <Box style={{ width: '150px', minWidth: '80px', flexShrink: 0, marginRight: 'var(--space-2)' }}>
                      <TextField.Root
                        type="number"
                        value={formData.primaryMetric.mde}
                        onChange={(e) =>
                          handleMdeChange('primary', formData.primaryMetric!.metricName, e.target.value)
                        }
                        placeholder="MDE %"
                      />
                    </Box>
                    <Box>
                      <Button variant="soft" color="red" onClick={handlePrimaryMetricDeselect}>
                        <TrashIcon />
                      </Button>
                    </Box>
                    <Box style={{ flexGrow: 1 }} /> {/* Spacer to push content left */}
                  </Flex>
                </>
              ) : (
                // Display badges for primary metric selection
                <Flex gap="2" wrap="wrap">
                  {availablePrimaryMetricBadges.map((metric) => (
                    <Badge
                      key={metric.field_name}
                      size={'3'}
                      variant={'outline'}
                      color={'gray'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePrimaryMetricSelect(metric.field_name)}
                    >
                      {metric.field_name}
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
              )}
            </Flex>

            {/* Secondary Metrics Sections - Visible if primary is selected OR secondary metrics exist */}
            {(formData.primaryMetric?.metricName || formData.secondaryMetrics.length > 0) && (
              <>
                {/* Selected Secondary Metrics Section */}
                <Flex direction="column" gap="2" mt="3">
                  <Text as="label" size="2" weight="bold">
                    Selected Secondary Metrics
                  </Text>
                  {formData.secondaryMetrics.length === 0 && !loadingParticipantTypes && (
                    <Text color="gray" size="2">
                      No secondary metrics selected. Choose from available below if a primary metric is also selected.
                    </Text>
                  )}
                  {/* Header for MDE in Secondary Metrics */}
                  {formData.secondaryMetrics.length > 0 && (
                    <Flex align="center" mt="1" mb="1">
                      <Box style={{ minWidth: '250px', flexShrink: 0, marginRight: 'var(--space-3)', paddingLeft: 'var(--space-1)' }}>
                        <Text size="1" weight="bold">Metric Name</Text>
                      </Box>
                      <Box style={{ width: '150px', minWidth: '80px', flexShrink: 0, marginRight: 'var(--space-2)' }}>
                        <Text size="1" weight="bold">min effect (% change)</Text>
                      </Box>
                      <Box style={{ width: 'var(--radix-size-7)' }} /> {/* Spacer for Trash Icon Column */}
                    </Flex>
                  )}
                  {formData.secondaryMetrics.map((selectedMetric) => (
                    <Flex key={selectedMetric.metricName} align="center"> {/* Removed gap */}
                      <Box style={{ minWidth: '250px', flexShrink: 0, marginRight: 'var(--space-3)', paddingLeft: 'var(--space-1)' }}>
                        <Text size="3">
                          {selectedMetric.metricName}
                        </Text>
                      </Box>
                      <Box style={{ width: '150px', minWidth: '80px', flexShrink: 0, marginRight: 'var(--space-2)' }}>
                        <TextField.Root
                          type="number"
                          value={selectedMetric.mde}
                          onChange={(e) =>
                            handleMdeChange('secondary', selectedMetric.metricName, e.target.value)
                          }
                          placeholder="MDE %"
                        />
                      </Box>
                      <Box>
                        <Button
                          variant="soft"
                          color="red"
                          onClick={() => handleSecondaryMetricRemove(selectedMetric.metricName)}
                        >
                          <TrashIcon />
                        </Button>
                      </Box>
                      <Box style={{ flexGrow: 1 }} /> {/* Spacer to push content left */}
                    </Flex>
                  ))}
                </Flex>

                {/* Available Secondary Metrics Section - Conditionally render the entire section */}
                {(loadingParticipantTypes || availableSecondaryMetricBadges.length > 0) && (
                  <Flex direction="column" gap="2" mt="3">
                    <Text as="label" size="2" weight="bold">
                      Available Secondary Metrics
                    </Text>
                    {loadingParticipantTypes && (
                      <Flex align="center" gap="2">
                        <Spinner size="1" />
                        <Text size="2">Loading metrics...</Text>
                      </Flex>
                    )}
                    {!loadingParticipantTypes && availableSecondaryMetricBadges.length > 0 && (
                      <Flex gap="2" wrap="wrap">
                        {availableSecondaryMetricBadges.map((metric) => {
                          const badge = (
                            <Badge
                              key={metric.field_name}
                              size={'3'}
                              variant={'outline'}
                              color={'gray'}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSecondaryMetricAdd(metric.field_name)}
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
                )}
              </>
            )}
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

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="bold">
                Effect % Change
              </Text>
              <TextField.Root
                type="number"
                disabled
                placeholder="Set per metric"
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
